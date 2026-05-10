# Tools Component Map

This folder contains tool-specific UI. The goal is to keep `AppShell` focused on shared state, settings, theme, auth, and navigation.

## Shared Files

- `tool-switcher.tsx`: compact selector for active and upcoming tools.
- `tool-icons.ts`: maps `CreatorToolIcon` values to lucide icons.

## Tool Folders

- `youtube-prompt-translate/`
  - `youtube-prompt-translate-sidebar.tsx`: input form, Generate action, and Advanced prompt settings.
  - `youtube-prompt-translate-tool.tsx`: output header, output cards, empty state, auth status, and mobile Prompt Library.
  - `youtube-prompt-library-aside.tsx`: desktop Prompt Library aside.
- `thumbnail-downloader/`
  - `thumbnail-downloader-tool.tsx`: shell-facing wrapper for sidebar summary and main tool page.
  - `thumbnail-downloader.tsx`: URL parsing, quality selection, preview, and download UI.

## Add A New Tool

1. Add the tool id, icon, status, and view to `src/lib/creator-tools.ts`.
2. Add any new icon key to `tool-icons.ts`.
3. Create a new folder in `src/components/tools/<tool-id>/`.
4. Put the tool's sidebar and main view in that folder.
5. Wire the new view in `src/components/app-shell.tsx` using the tool `view`.
6. Keep feature logic isolated. Only use shared shell state when the feature really needs it.

## Design Notes

- Keep the current three-column layout for `youtube-prompt-translate`.
- Lightweight utilities can use the narrower two-column shell.
- Tool cards and panels should use theme CSS variables.
- Avoid adding fake working features for coming-soon tools.
