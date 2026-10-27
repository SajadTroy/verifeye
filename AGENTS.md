<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Rules

1. **No Code Comments**: Do not include any comments in any code files.
2. **UI Theme**: Keep the user interface strictly in a white / light theme with clean, high-contrast, modern aesthetics.
3. **Maximize Server-Side Rendering (SSR)**: Maximize Server-Side Rendering and React Server Components (RSC) across the entire application. Treat all components as Server Components by default; only designate a component as a Client Component (`"use client"`) when strictly necessary for user interactions, browser APIs, or stateful hooks. Keep Client Components isolated to small, discrete leaf nodes to maximize performance, streaming capabilities, and SEO.
