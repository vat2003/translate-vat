# YouTube Prompt Studio

Next.js App Router + TypeScript conversion of the legacy single-file HTML/CSS/Vanilla JS Gemini translator.

## 1. Legacy Project Analysis

The old project has one screen in `index.html`:

- Left split panel with two tabs: translation input and settings.
- Right split panel for translated output cards.
- Empty state uses `screaming-tom-lizard.gif`.
- Dark/light theme stored in `localStorage`.

Main state from the old app:

- `gemini_api_keys`: local API key list.
- `gemini_translator_settings`: Gemini model, target language text map, system prompt.
- `app_theme`: light/dark theme.
- Runtime-only state: title, description, loading, generated results, active tab.

Main JS functions converted:

- `loadApiKeys`, `addApiKey`, `removeApiKey` -> `src/lib/api-key-store.ts` and `ApiKeyDialog`.
- `loadSettings`, `saveSettings`, `getParsedLanguages` -> `src/lib/local-store.ts` and `parseLanguages`.
- `translateContent` -> React state in `AppShell` plus `src/app/api/generate/route.ts`.
- `renderResults` -> React result cards in `AppShell`.
- `copyText` -> `CopyButton`.
- `toggleTheme`, `loadTheme` -> `AppShell` settings state.

Component conversion map:

- Split app layout -> `src/components/app-shell.tsx`
- Auth controls -> `src/components/auth-button.tsx`
- Title/description/system prompt form -> `src/components/prompt-editor.tsx`
- Prompt/note metadata -> `src/components/note-panel.tsx`
- Prompt CRUD/search/favorite -> `src/components/prompt-list.tsx`
- API key/model/language settings -> `src/components/api-key-dialog.tsx`
- Target language select -> `src/components/language-selector.tsx`
- Clipboard actions -> `src/components/copy-button.tsx`

## 2. Next.js Architecture

```text
src/
  app/
    layout.tsx
    page.tsx
    api/
      generate/route.ts
      prompts/route.ts
      prompts/[id]/route.ts
    auth/
      callback/route.ts
  components/
    app-shell.tsx
    auth-button.tsx
    prompt-editor.tsx
    prompt-list.tsx
    note-panel.tsx
    api-key-dialog.tsx
    language-selector.tsx
    copy-button.tsx
  lib/
    supabase/client.ts
    supabase/server.ts
    local-store.ts
    api-key-store.ts
    prompt-utils.ts
    types.ts
  stores/
    prompt-store.ts
supabase/
  migrations/
    20260504143800_create_prompt_items.sql
```

Data behavior:

- Guest users never save personal prompt/note data to Supabase.
- Guest prompt/note CRUD uses `localStorage`.
- Logged-in Google users use Supabase through Next.js Route Handlers.
- Guest data can be imported into the logged-in Supabase account.
- API keys are local-only by default, masked in UI, and never stored in Supabase.

## 3. Setup

Install and run:

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public anon key. Do not put Gemini/OpenAI private API keys in `NEXT_PUBLIC_*`.

## 4. Supabase Setup

1. Create a Supabase project.
2. Enable Google provider in Authentication > Providers.
3. Add redirect URL:

```text
http://localhost:3000/auth/callback
```

4. Run the SQL migration in `supabase/migrations/20260504143800_create_prompt_items.sql`.

The migration creates `prompt_items`, enables RLS, and adds authenticated-only policies:

- select only own rows: `user_id = auth.uid()`
- insert only own rows
- update only own rows
- delete only own rows
- no anon policy for cloud personal data

## 5. Test Checklist

- Guest mode: open app without Supabase login, save prompt/note, refresh, confirm local data remains.
- Google login: sign in, confirm status changes to `Logged in` and sync status updates.
- CRUD prompt/note: create, list, search, edit, delete, favorite.
- Copy buttons: generate output, copy title and description separately.
- API key local storage: add key, refresh, confirm masked display and no Supabase persistence.
- Import Guest data: create guest prompts, log in, click import, confirm cloud list contains them.
- RLS: in Supabase SQL/editor, verify one user cannot select/update/delete another user's `prompt_items`.
