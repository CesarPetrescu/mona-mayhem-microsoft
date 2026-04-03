import type { APIRoute } from 'astro';
import { handleContribsGet, handleContribsOptions } from '../../_githubContribProxy';

export const GET: APIRoute = handleContribsGet;
export const OPTIONS: APIRoute = handleContribsOptions;
