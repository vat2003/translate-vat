"use client";

import type { User } from "@supabase/supabase-js";
import { Clapperboard, Moon, Settings, Sun } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { AuthButton } from "@/components/auth-button";
import { CopyButton } from "@/components/copy-button";
import { NotePanel } from "@/components/note-panel";
import { PromptEditor } from "@/components/prompt-editor";
import { PromptList } from "@/components/prompt-list";
import { readApiKeys, type LocalApiKey } from "@/lib/api-key-store";
import { readAppSettings, saveAppSettings } from "@/lib/local-store";
import { normalizeTags, parseLanguages } from "@/lib/prompt-utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEFAULT_LANGUAGES,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  type AppSettings,
  type GeneratedResult,
  type PromptItem,
  type PromptItemInput
} from "@/lib/types";
import { usePromptStore } from "@/stores/prompt-store";

const initialSettings: AppSettings = {
  model: DEFAULT_MODEL,
  languagesRaw: DEFAULT_LANGUAGES,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  selectedApiKeyId: "",
  theme: "light"
};

type GenerateResponse = {
  results?: GeneratedResult[];
  error?: string;
};

type LatestExchange = {
  request: unknown;
  response: unknown;
};

export function AppShell() {
  const supabaseConfigured = isSupabaseConfigured();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [apiKeys, setApiKeys] = useState<LocalApiKey[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [notice, setNotice] = useState("");
  const [latestExchange, setLatestExchange] = useState<LatestExchange | null>(null);

  const items = usePromptStore((state) => state.items);
  const syncStatus = usePromptStore((state) => state.syncStatus);
  const storeError = usePromptStore((state) => state.error);
  const guestCount = usePromptStore((state) => state.guestCount);
  const hydrate = usePromptStore((state) => state.hydrate);
  const createItem = usePromptStore((state) => state.createItem);
  const updateItem = usePromptStore((state) => state.updateItem);
  const deleteItem = usePromptStore((state) => state.deleteItem);
  const toggleFavorite = usePromptStore((state) => state.toggleFavorite);
  const importGuestToCloud = usePromptStore((state) => state.importGuestToCloud);
  const refreshGuestCount = usePromptStore((state) => state.refreshGuestCount);

  const languages = useMemo(() => parseLanguages(settings.languagesRaw), [settings.languagesRaw]);
  const activeApiKey = useMemo(
    () => apiKeys.find((key) => key.id === settings.selectedApiKeyId) || apiKeys[0],
    [apiKeys, settings.selectedApiKeyId]
  );
  const selectedTargetLanguages = useMemo(() => {
    if (selectedLanguage === "all") {
      return languages;
    }

    return languages.filter((language) => language.code === selectedLanguage);
  }, [languages, selectedLanguage]);
  const promptChoices = useMemo(
    () => items.filter((item) => item.system_prompt.trim().length > 0),
    [items]
  );
  const isSavingPrompt = syncStatus === "saving";

  useEffect(() => {
    const loadedSettings = readAppSettings();
    const loadedKeys = readApiKeys();
    const normalizedSettings = {
      ...loadedSettings,
      selectedApiKeyId:
        loadedSettings.selectedApiKeyId || loadedKeys.find(Boolean)?.id || ""
    };

    setSettings(normalizedSettings);
    setSystemPrompt(normalizedSettings.systemPrompt);
    setApiKeys(loadedKeys);
    refreshGuestCount();
  }, [refreshGuestCount]);

  useEffect(() => {
    let mounted = true;

    if (!supabaseConfigured) {
      setAuthReady(true);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  useEffect(() => {
    if (authReady) {
      void hydrate(user?.id ?? null);
    }
  }, [authReady, hydrate, user?.id]);

  useEffect(() => {
    if (selectedLanguage !== "all" && !languages.some((language) => language.code === selectedLanguage)) {
      setSelectedLanguage("all");
    }
  }, [languages, selectedLanguage]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function updateAndSaveSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
    saveAppSettings(nextSettings);
  }

  function handleThemeToggle() {
    updateAndSaveSettings({
      ...settings,
      theme: settings.theme === "dark" ? "light" : "dark"
    });
  }

  function handleApiKeyChange(selectedApiKeyId: string) {
    updateAndSaveSettings({ ...settings, selectedApiKeyId });
  }

  function handleSettingsSave() {
    const keyStillExists =
      !settings.selectedApiKeyId || apiKeys.some((key) => key.id === settings.selectedApiKeyId);
    const nextSettings = {
      ...settings,
      selectedApiKeyId: keyStillExists ? settings.selectedApiKeyId : apiKeys[0]?.id || ""
    };

    updateAndSaveSettings(nextSettings);
    setSystemPrompt(nextSettings.systemPrompt);
    setSettingsOpen(false);
    setNotice("Settings saved locally");
  }

  function resetDraft() {
    setActiveItemId(null);
    setTitle("");
    setDescription("");
    setSystemPrompt(settings.systemPrompt);
    setSelectedLanguage("all");
    setNote("");
    setCategory("");
    setTagsRaw("");
    setFavorite(false);
  }

  function loadPromptItem(item: PromptItem) {
    setActiveItemId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setSystemPrompt(item.system_prompt || settings.systemPrompt);
    setSelectedLanguage(item.target_language || "all");
    setNote(item.note);
    setCategory(item.category);
    setTagsRaw(item.tags.join(", "));
    setFavorite(item.is_favorite);
  }

  function buildPromptInput(): PromptItemInput {
    return {
      title: title.trim() || "Untitled prompt",
      description,
      system_prompt: systemPrompt,
      target_language: selectedLanguage,
      note,
      category,
      tags: normalizeTags(tagsRaw),
      is_favorite: favorite
    };
  }

  async function handleSavePrompt() {
    try {
      const saved = activeItemId
        ? await updateItem(activeItemId, buildPromptInput(), user?.id)
        : await createItem(buildPromptInput(), user?.id);
      setActiveItemId(saved.id);
      setNotice(user ? "Prompt synced to Supabase" : "Prompt saved locally");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save prompt");
    }
  }

  async function handleDeletePrompt(item: PromptItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await deleteItem(item.id, user?.id);
      if (activeItemId === item.id) {
        resetDraft();
      }
      setNotice("Prompt deleted");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not delete prompt");
    }
  }

  async function handleToggleFavorite(item: PromptItem) {
    try {
      const updated = await toggleFavorite(item, user?.id);
      if (activeItemId === item.id) {
        setFavorite(updated.is_favorite);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update favorite");
    }
  }

  async function handleImportGuest() {
    try {
      const count = await importGuestToCloud();
      setNotice(`Imported ${count} guest prompt${count === 1 ? "" : "s"}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import guest data");
    }
  }

  async function handleGenerate() {
    if (!activeApiKey) {
      setNotice("Add a local API key in Settings");
      setSettingsOpen(true);
      return;
    }

    if (!title.trim() || !description.trim()) {
      setNotice("Title and description are required");
      return;
    }

    if (!selectedTargetLanguages.length) {
      setNotice("Target language is not configured");
      return;
    }

    setGenerating(true);
    setGenerationError("");
    setResults([]);

    const requestBody = {
      apiKey: activeApiKey.value,
      model: settings.model,
      title,
      description,
      systemPrompt,
      targetLanguages: selectedTargetLanguages
    };
    const requestPreview = {
      method: "POST",
      url: "/api/generate",
      body: {
        ...requestBody,
        apiKey: "[redacted]"
      }
    };

    setLatestExchange({ request: requestPreview, response: null });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const payload = (await response.json().catch(() => ({}))) as GenerateResponse;
      const responsePreview = {
        ok: response.ok,
        status: response.status,
        body: payload
      };

      setLatestExchange({ request: requestPreview, response: responsePreview });

      if (!response.ok) {
        throw new Error(payload.error || "Generation failed");
      }

      setResults(payload.results || []);
      setNotice("Generation complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      setLatestExchange((current) => ({
        request: current?.request ?? requestPreview,
        response: current?.response ?? { error: message }
      }));
      setGenerationError(message);
      setNotice(message);
    } finally {
      setGenerating(false);
    }
  }

  const shellClass = settings.theme === "dark" ? "dark" : "";
  const latestRequestJson = latestExchange ? JSON.stringify(latestExchange.request, null, 2) : "";
  const latestResponseJson = latestExchange ? JSON.stringify(latestExchange.response, null, 2) : "";

  return (
    <div className={shellClass}>
      <div className="min-h-screen bg-[#f7f8fb] text-zinc-950 dark:bg-[#111113] dark:text-zinc-50">
        <div
          className={`grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out lg:grid-cols-[440px_minmax(0,1fr)] ${
            promptLibraryOpen
              ? "xl:grid-cols-[440px_minmax(0,1fr)_370px]"
              : "xl:grid-cols-[440px_minmax(0,1fr)_48px]"
          }`}
        >
          <aside className="border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-screen lg:overflow-y-auto">
            <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white">
                    <Clapperboard size={22} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold">YouTube Prompt Studio</h1>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {user ? user.email : "Guest workspace"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-button"
                    type="button"
                    title={settings.theme === "dark" ? "Light theme" : "Dark theme"}
                    onClick={handleThemeToggle}
                  >
                    {settings.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    title="Settings"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <PromptEditor
                title={title}
                description={description}
                systemPrompt={systemPrompt}
                selectedLanguage={selectedLanguage}
                selectedApiKeyId={settings.selectedApiKeyId}
                model={settings.model}
                apiKeys={apiKeys}
                languages={languages}
                promptChoices={promptChoices}
                generating={generating}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onSystemPromptChange={setSystemPrompt}
                onLanguageChange={setSelectedLanguage}
                onApiKeyChange={handleApiKeyChange}
                onGenerate={handleGenerate}
                onOpenSettings={() => setSettingsOpen(true)}
              />

              <NotePanel
                activeTitle={title || "Untitled prompt"}
                note={note}
                category={category}
                tagsRaw={tagsRaw}
                favorite={favorite}
                saving={isSavingPrompt}
                isEditing={Boolean(activeItemId)}
                onNoteChange={setNote}
                onCategoryChange={setCategory}
                onTagsChange={setTagsRaw}
                onFavoriteChange={setFavorite}
                onSave={handleSavePrompt}
                onNew={resetDraft}
              />
            </div>
          </aside>

          <main className="flex min-h-[70vh] min-w-0 flex-col lg:max-h-screen">
            <header className="border-b border-zinc-200 bg-[#f7f8fb]/95 p-5 backdrop-blur dark:border-zinc-800 dark:bg-[#111113]/95">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Output</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selectedLanguage === "all"
                      ? `${selectedTargetLanguages.length} target languages`
                      : selectedTargetLanguages[0]?.label || "No language"}
                  </p>
                </div>
                <AuthButton
                  user={user}
                  ready={authReady}
                  configured={supabaseConfigured}
                  syncStatus={syncStatus}
                  guestCount={guestCount}
                  onImportGuest={handleImportGuest}
                  onNotice={setNotice}
                />
              </div>
              {(storeError || generationError) && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {generationError || storeError}
                </div>
              )}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {generating && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                  Generating metadata...
                </div>
              )}

              {latestExchange && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <CopyButton value={latestRequestJson} label="Copy Request" onError={setNotice} />
                  <CopyButton value={latestResponseJson} label="Copy Response" onError={setNotice} />
                </div>
              )}

              {results.length > 0 ? (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {results.map((item) => (
                    <article
                      key={item.code}
                      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-panel dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                        <h3 className="min-w-0 truncate text-base font-bold text-blue-700 dark:text-blue-300">
                          {item.label}
                        </h3>
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.code}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <strong className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              Title
                            </strong>
                            <CopyButton value={item.title} label="Copy title" compact onError={setNotice} />
                          </div>
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900">
                            {item.title}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <strong className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              Description
                            </strong>
                            <CopyButton
                              value={item.description}
                              label="Copy description"
                              compact
                              onError={setNotice}
                            />
                          </div>
                          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <Image
                    src="/screaming-tom-lizard.gif"
                    alt=""
                    width={112}
                    height={112}
                    unoptimized
                    className="mb-5 h-28 w-28 rounded-lg object-cover"
                  />
                  <span>No output yet</span>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 xl:hidden">
              <div className="h-[560px]">
                <PromptList
                  items={items}
                  activeItemId={activeItemId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelect={loadPromptItem}
                  onDelete={handleDeletePrompt}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          </main>

          <aside className="hidden min-h-0 border-l border-zinc-200 bg-[#fafafa] dark:border-zinc-800 dark:bg-zinc-950/60 xl:block xl:max-h-screen">
            <PromptList
              items={items}
              activeItemId={activeItemId}
              search={search}
              isOpen={promptLibraryOpen}
              onSearchChange={setSearch}
              onOpenChange={setPromptLibraryOpen}
              onSelect={loadPromptItem}
              onDelete={handleDeletePrompt}
              onToggleFavorite={handleToggleFavorite}
            />
          </aside>
        </div>

        <ApiKeyDialog
          open={settingsOpen}
          apiKeys={apiKeys}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onKeysChange={setApiKeys}
          onSettingsChange={setSettings}
          onSaveSettings={handleSettingsSave}
          onNotice={setNotice}
        />

        {notice && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-zinc-950">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
