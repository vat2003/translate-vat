# AI Agent Guide

This project is a Next.js App Router creator tools studio. Treat `src/components/app-shell.tsx` as the shared shell and state coordinator, not as the place to build full tool UIs.

## Current Tool Structure

- Tool metadata lives in `src/lib/creator-tools.ts`.
- Shared tool navigation lives in `src/components/tools/tool-switcher.tsx`.
- Shared tool icons live in `src/components/tools/tool-icons.ts`.
- Each real tool should live in its own folder under `src/components/tools/`.
- API routes stay under `src/app/api/`.

## Active Tools

- `youtube-prompt-translate`: the main prompt translation workflow.
- `thumbnail-downloader`: a lightweight local utility that does not require login or database storage.
- `youtube-tools`: placeholder only, marked as coming soon.

## Maintenance Rules

- Do not rewrite the app shell for a new tool.
- Add a tool config entry first, then create isolated components for the tool UI.
- Keep Supabase, auth, prompt library, saved prompts, API key settings, language settings, and theme logic unchanged unless the task explicitly asks for it.
- Do not import server-only code into client components.
- Do not expose secrets through `NEXT_PUBLIC_` variables unless the value is intentionally public.
- Prefer CSS variables already defined by the theme system over hardcoded colors.

## Verification

Run these before handing off UI or routing changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

After `npm run build`, check whether `next-env.d.ts` changed because Next may rewrite it.
