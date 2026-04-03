# Mona Mayhem — Copilot Instructions

## Project Overview

**Mona Mayhem** is a retro arcade-themed Astro web application that compares GitHub contribution graphs of two users. It demonstrates a modern full-stack development workflow with Astro 5 as the framework, server-side rendering, and Node.js runtime.

- **Stack**: Astro 5 + Node.js (standalone server)
- **Language**: TypeScript (strict mode by default)
- **Setup**: Simple, single package.json in root

## Development Commands

Run these commands from the workspace root:

```bash
npm run dev      # Start dev server (localhost:3000 by default)
npm run build    # Build production artifacts to dist/
npm run preview  # Preview built site locally
npm astro <cmd>  # Run any Astro CLI command
```

**Development workflow**: Use `npm run dev` for local iteration. The dev server auto-reloads on file changes.

**Building**: Always run `npm run build` before deploying to verify the production build succeeds.

## Project Structure

```
src/
  pages/           # Astro page routes (auto-routed to paths)
    index.astro    # / (homepage)
    api/           # API routes
      contributions/[username].ts  # Dynamic API endpoint
  
public/            # Static assets (images, fonts, etc.)
docs/              # Documentation for workshop guides
```

**Route Convention**: Files in `src/pages/` automatically become routes:
- `src/pages/index.astro` → `/`
- `src/pages/api/foo.ts` → `/api/foo`
- `src/pages/[id].astro` → `/[id]` (dynamic route)

## Astro Best Practices

### Components & Layout

- **Astro components** (`.astro` files) are server-rendered by default. Use component syntax to structure layout and pages.
- **Layouts**: Create reusable `.astro` components in `src/layouts/` and import them in pages with `import Layout from '../layouts/Base.astro'`.
- **Props**: Pass data to components via implicit `Astro.props` or explicit component props.

### API Routes

- API routes use `.ts` files in `src/pages/api/` — they execute server-side and return JSON or responses.
- Use dynamic segments like `[username].ts` for parameterized endpoints (e.g., `/api/contributions/alice`).
- **Response format**: Export a named function matching the HTTP verb (`GET`, `POST`, etc.) returning a `Response` object.

### Styling

- **Global styles**: Place in `src/styles/` and import in layouts.
- **Component styles**: Use `<style>` blocks inside `.astro` files (scoped to component by default).
- **Tailwind/CSS**: Configure in `astro.config.mjs` if needed; currently using vanilla CSS.

### Static vs. Server-Rendered Content

This project uses `output: 'server'` — all pages are rendered on-demand at request time. Use `prerender: true` in frontmatter for specific pages that should be pre-built as static HTML.

### TypeScript

- Strict mode is enabled by default (`tsconfig.json`).
- Use `interface` for type definitions, `type` for unions/primitives.
- Always export component and route handlers with proper type annotations.

## Common Workflow Patterns

### Adding a New Page

1. Create `src/pages/newpage.astro`
2. Import a layout (optional), add markup and exports
3. Route is automatically available at `/newpage`

### Adding a Dynamic API Endpoint

1. Create `src/pages/api/[paramname].ts`
2. Export `GET`/`POST` handler that receives `params` and `request`
3. Return a `Response` object (use `Response.json()` for JSON)

### Accessing Build-Time Config

- Import `import.meta.env` to access environment variables defined in `.env` or `astro.config.mjs`
- Common variables: `SITE`, `MODE` (`development` or `production`), custom vars prefixed with `PUBLIC_` are client-visible

## Architecture Notes

- **Server adapter**: Node.js standalone mode (`@astrojs/node`) — outputs a self-contained server.
- **Request lifecycle**: Every page/API route receives an Astro context with `request`, `params`, `url`, and more.
- **No client-side framework by default** — Astro sends zero JavaScript to the browser unless you explicitly opt-in with client directives like `client:load`.

## Debugging & Troubleshooting

- **Build fails**: Check `astro build` output for TypeScript or compilation errors. Verify `tsconfig.json` and import paths.
- **Routes not found**: Confirm files are in `src/pages/` and follow the naming convention. Restart dev server if unsure.
- **Env vars not loaded**: Add them to `.env` at root or define in `astro.config.mjs`. Remember `PUBLIC_` prefix for client-visible vars.

---

**Link to workshop**: Refer to `/workshop/00-overview.md` for learning guides (out of scope for instructions).
