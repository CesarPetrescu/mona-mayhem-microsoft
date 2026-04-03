import type { APIRoute } from 'astro';

type CacheStatus = 'fresh' | 'stale' | 'stale-fallback' | 'miss';

type CacheEntry = {
  username: string;
  data: unknown;
  etag?: string;
  fetchedAt: number;
  freshUntil: number;
  staleUntil: number;
};

class ProxyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const USERNAME_RE = /^(?!-)(?!.*--)[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;

const CACHE_TTL_MS = resolveNumber('GH_PROXY_CACHE_TTL_MS', 300_000);
const STALE_TTL_MS = resolveNumber('GH_PROXY_STALE_TTL_MS', 24 * 60 * 60 * 1000);
const UPSTREAM_TIMEOUT_MS = resolveNumber('GH_PROXY_UPSTREAM_TIMEOUT_MS', 6_000);

const cache = new Map<string, CacheEntry>();
const inFlightRefreshes = new Map<string, Promise<CacheEntry>>();

function resolveNumber(envVar: string, defaultValue: number): number {
  const value = Number(process.env[envVar]);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function cacheKey(username: string): string {
  return `gh:contribs:${username}`;
}

function normalizeUsername(raw: string | undefined): string | null {
  if (!raw) return null;
  const username = raw.trim().toLowerCase();
  if (!username || username.length > 39) return null;
  if (!USERNAME_RE.test(username)) return null;
  return username;
}

function buildCorsHeaders(): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
    'Cache-Control': 'public, max-age=0, must-revalidate',
  });
}

function jsonResponse(body: unknown, status: number, headers: Headers = new Headers()): Response {
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function buildSuccessPayload(username: string, cacheStatus: CacheStatus, entry: CacheEntry): object {
  return {
    username,
    fetchedAt: entry.fetchedAt,
    cacheStatus,
    source: `https://github.com/${encodeURIComponent(username)}.contribs`,
    data: entry.data,
  };
}

function buildSuccessResponse(username: string, cacheStatus: CacheStatus, entry: CacheEntry): Response {
  const headers = buildCorsHeaders();
  headers.set('X-Cache-Status', cacheStatus);
  headers.set('X-Cache-Fetched-At', new Date(entry.fetchedAt).toISOString());
  return jsonResponse(buildSuccessPayload(username, cacheStatus, entry), 200, headers);
}

function buildErrorResponse(status: number, code: string, message: string): Response {
  return jsonResponse(
    {
      error: {
        code,
        message,
      },
    },
    status,
    buildCorsHeaders(),
  );
}

function isFresh(cached: CacheEntry): boolean {
  return cached.freshUntil > Date.now();
}

function isStale(cached: CacheEntry): boolean {
  return cached.staleUntil > Date.now();
}

function isRateLimited(status: number, headers: Headers): boolean {
  if (status !== 403) return false;
  const remaining = Number(headers.get('x-ratelimit-remaining'));
  if (Number.isFinite(remaining) && remaining <= 0) return true;
  return Boolean(headers.get('retry-after'));
}

function startRefresh(username: string, existing?: CacheEntry): Promise<CacheEntry> {
  const key = cacheKey(username);
  const inFlight = inFlightRefreshes.get(key);
  if (inFlight) return inFlight;

  const promise = fetchFromGithub(username, existing)
    .then((entry) => {
      cache.set(key, entry);
      return entry;
    })
    .finally(() => {
      inFlightRefreshes.delete(key);
    });

  inFlightRefreshes.set(key, promise);
  return promise;
}

async function fetchFromGithub(username: string, existing?: CacheEntry): Promise<CacheEntry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  const headers = new Headers({
    Accept: 'application/json',
    'User-Agent': 'mona-mayhem-contrib-proxy',
  });
  if (existing?.etag) headers.set('If-None-Match', existing.etag);

  try {
    const response = await fetch(`https://github.com/${encodeURIComponent(username)}.contribs`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (response.status === 304) {
      if (!existing) {
        throw new ProxyError(502, 'UPSTREAM_INVALID_RESPONSE', 'GitHub returned 304 without cache context');
      }
      const now = Date.now();
      return {
        username,
        data: existing.data,
        etag: existing.etag,
        fetchedAt: now,
        freshUntil: now + CACHE_TTL_MS,
        staleUntil: now + STALE_TTL_MS,
      };
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new ProxyError(404, 'CONTRIBS_NOT_FOUND', `No contribution feed found for '${username}'`);
      }
      if (isRateLimited(response.status, response.headers)) {
        throw new ProxyError(429, 'UPSTREAM_RATE_LIMITED', 'GitHub rate limit exceeded');
      }
      if (response.status >= 500) {
        throw new ProxyError(502, 'UPSTREAM_ERROR', `GitHub returned HTTP ${response.status}`);
      }
      throw new ProxyError(response.status, 'UPSTREAM_ERROR', `GitHub returned HTTP ${response.status}`);
    }

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ProxyError(502, 'UPSTREAM_INVALID_JSON', 'Invalid JSON response from GitHub');
    }

    const now = Date.now();
    return {
      username,
      data,
      etag: response.headers.get('etag') ?? undefined,
      fetchedAt: now,
      freshUntil: now + CACHE_TTL_MS,
      staleUntil: now + STALE_TTL_MS,
    };
  } finally {
    clearTimeout(timer);
  }
}

export const handleContribsGet: APIRoute = async ({ params, request }) => {
  const username = normalizeUsername(params.username);
  if (!username) {
    return buildErrorResponse(400, 'INVALID_USERNAME', 'Invalid username: must be 1-39 chars of letters, numbers, and single hyphens.');
  }

  const search = new URL(request.url).searchParams;
  const forceRefresh = search.get('force') === 'true' || search.get('force') === '1';
  const key = cacheKey(username);
  const cached = cache.get(key);

  if (cached && isFresh(cached) && !forceRefresh) {
    return buildSuccessResponse(username, 'fresh', cached);
  }

  if (cached && isStale(cached) && !forceRefresh) {
    startRefresh(username, cached).catch(() => undefined);
    return buildSuccessResponse(username, 'stale', cached);
  }

  try {
    const refreshed = await startRefresh(username, cached);
    const status: CacheStatus = cached ? 'fresh' : 'miss';
    return buildSuccessResponse(username, status, refreshed);
  } catch (error) {
    if (error instanceof ProxyError && cached && isStale(cached)) {
      const response = buildSuccessResponse(username, 'stale-fallback', cached);
      response.headers.set('Warning', '199 - Stale cache data served due to upstream failure');
      return response;
    }

    if (error instanceof ProxyError) {
      return buildErrorResponse(error.status, error.code, error.message);
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return buildErrorResponse(504, 'UPSTREAM_TIMEOUT', 'Upstream request timed out');
    }
    if (error instanceof TypeError) {
      return buildErrorResponse(502, 'UPSTREAM_UNAVAILABLE', 'Failed to reach GitHub upstream');
    }
    return buildErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected internal error');
  }
};

export const handleContribsOptions: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(),
  });
};
