"use client";

import type { User } from "@supabase/supabase-js";
import {
  Clapperboard,
  Moon,
  Settings,
  Sun
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { ThumbnailDownloaderSidebar, ThumbnailDownloaderTool } from "@/components/tools/thumbnail-downloader/thumbnail-downloader-tool";
import { ToolSwitcher } from "@/components/tools/tool-switcher";
import { YoutubePromptLibraryAside } from "@/components/tools/youtube-prompt-translate/youtube-prompt-library-aside";
import { YoutubePromptTranslateSidebar } from "@/components/tools/youtube-prompt-translate/youtube-prompt-translate-sidebar";
import { YoutubePromptTranslateTool } from "@/components/tools/youtube-prompt-translate/youtube-prompt-translate-tool";
import { readApiKeys, type LocalApiKey } from "@/lib/api-key-store";
import { ACTIVE_TOOL_ID, CREATOR_TOOLS, type CreatorTool } from "@/lib/creator-tools";
import { readAppSettings, saveAppSettings } from "@/lib/local-store";
import { normalizeTags, parseLanguages } from "@/lib/prompt-utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getThemeBaseMode } from "@/lib/theme-options";
import {
  DEFAULT_LANGUAGES,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  type AppSettings,
  type GeneratedResult,
  type PromptDisplay,
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState(ACTIVE_TOOL_ID);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [promptName, setPromptName] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [display, setDisplay] = useState<PromptDisplay>("private");
  const [favorite, setFavorite] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [usagePromptItemId, setUsagePromptItemId] = useState<string | null>(null);
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
  const togglePin = usePromptStore((state) => state.togglePin);
  const recordUsage = usePromptStore((state) => state.recordUsage);
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
    () => items.filter((item) => item.system_prompt.trim().length > 0 && (user || !item.user_id)),
    [items, user]
  );
  const usagePromptItem = useMemo(
    () => (usagePromptItemId ? items.find((item) => item.id === usagePromptItemId) || null : null),
    [items, usagePromptItemId]
  );
  const selectedPromptChoiceId = useMemo(
    () =>
      usagePromptItem && promptChoices.some((choice) => choice.id === usagePromptItem.id)
        ? usagePromptItem.id
        : "",
    [promptChoices, usagePromptItem]
  );
  const promptStatusSource = usagePromptItem
    ? "library"
    : systemPrompt === settings.systemPrompt
      ? "default"
      : "custom";
  const promptStatusLabel =
    usagePromptItem?.name || (promptStatusSource === "default" ? "Default system prompt" : "Custom system prompt");
  const isSavingPrompt = syncStatus === "saving";
  const isPromptLibraryRefreshing = syncStatus === "loading";
  const activeTool = useMemo(
    () => CREATOR_TOOLS.find((tool) => tool.id === activeToolId) ?? CREATOR_TOOLS[0],
    [activeToolId]
  );
  const activeToolCount = useMemo(
    () => CREATOR_TOOLS.filter((tool) => tool.status === "active").length,
    []
  );
  const isTranslateTool = activeTool.view === "youtube-prompt-translate";

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
    const currentBaseMode = getThemeBaseMode(settings.theme);

    updateAndSaveSettings({
      ...settings,
      theme: currentBaseMode === "dark" ? "light" : "dark"
    });
  }

  function handleApiKeyChange(selectedApiKeyId: string) {
    updateAndSaveSettings({ ...settings, selectedApiKeyId });
  }

  function handleAdvancedThemeChange(theme: AppSettings["theme"]) {
    setSettings((current) => ({ ...current, theme }));
    saveAppSettings({ ...readAppSettings(), theme });
  }

  function handleToolSelect(tool: CreatorTool) {
    if (tool.status !== "active") {
      return;
    }

    setActiveToolId(tool.id);
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
    setUsagePromptItemId(null);
    setSettingsOpen(false);
    setNotice("Settings saved locally");
  }

  function handleSystemPromptChange(value: string) {
    setSystemPrompt(value);
    setUsagePromptItemId(null);
  }

  function resetDraft() {
    setActiveItemId(null);
    setUsagePromptItemId(null);
    setTitle("");
    setDescription("");
    setSystemPrompt(settings.systemPrompt);
    setSelectedLanguage("all");
    setPromptName("");
    setNote("");
    setCategory("");
    setTagsRaw("");
    setDisplay("private");
    setFavorite(false);
  }

  function loadPromptItem(item: PromptItem) {
    setActiveItemId(item.id);
    setUsagePromptItemId(item.id);
    setPromptName(item.name);
    setSystemPrompt(item.system_prompt || settings.systemPrompt);
    setSelectedLanguage(item.target_language || "all");
    setNote(item.note);
    setCategory(item.category);
    setTagsRaw(item.tags.join(", "));
    setDisplay(item.display);
    setFavorite(item.is_favorite);
  }

  function buildPromptInput(): PromptItemInput {
    return {
      name: promptName.trim() || "Untitled suggestion",
      system_prompt: systemPrompt,
      target_language: selectedLanguage,
      note,
      category,
      tags: normalizeTags(tagsRaw),
      display,
      is_favorite: favorite
    };
  }

  async function handleSavePrompt() {
    try {
      const saved = activeItemId
        ? await updateItem(activeItemId, buildPromptInput(), user?.id)
        : await createItem(buildPromptInput(), user?.id);
      setActiveItemId(saved.id);
      setUsagePromptItemId(saved.id);
      setPromptName(saved.name);
      setNotice(user ? "Prompt synced to Supabase" : "Prompt saved locally");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save prompt");
    }
  }

  async function handleDeletePrompt(item: PromptItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteItem(item.id, user?.id);
      if (activeItemId === item.id) {
        resetDraft();
      } else if (usagePromptItemId === item.id) {
        setUsagePromptItemId(null);
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

  async function handleTogglePin(item: PromptItem) {
    try {
      await togglePin(item, user?.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update pin");
    }
  }

  function handleUsePromptChoice(item: PromptItem) {
    setUsagePromptItemId(item.id);
  }

  function handlePromptChoiceChange(promptItemId: string) {
    if (!promptItemId) {
      setUsagePromptItemId(null);
      return;
    }

    const item = promptChoices.find((choice) => choice.id === promptItemId);
    if (item?.system_prompt) {
      handleSystemPromptChange(item.system_prompt);
      handleUsePromptChoice(item);
    }
  }

  async function handleUsePromptItem(item: PromptItem) {
    if (!user && item.user_id) {
      if (!supabaseConfigured) {
        setNotice("Log in to use public prompts");
        return;
      }

      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return;
    }

    try {
      setSystemPrompt(item.system_prompt || settings.systemPrompt);
      setSelectedLanguage(item.target_language || "all");
      setUsagePromptItemId(item.id);
      setNotice(`Using "${item.name}"`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not use prompt");
    }
  }

  async function handleRefreshPromptLibrary() {
    await hydrate(user?.id ?? null);
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
      const promptItemForUsage = usagePromptItemId ? items.find((item) => item.id === usagePromptItemId) : null;

      if (promptItemForUsage) {
        try {
          const updated = await recordUsage(promptItemForUsage, user?.id);
          if (activeItemId === promptItemForUsage.id) {
            setFavorite(updated.is_favorite);
          }
        } catch {
          setNotice("Generation complete, but usage could not be tracked");
          return;
        }
      }

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

  const activeThemeBaseMode = getThemeBaseMode(settings.theme);
  const shellClass = activeThemeBaseMode === "dark" ? "dark" : "";
  const shellGridClass = isTranslateTool
    ? `relative z-10 grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out lg:grid-cols-[440px_minmax(0,1fr)] ${
        promptLibraryOpen
          ? "xl:grid-cols-[440px_minmax(0,1fr)_370px]"
          : "xl:grid-cols-[440px_minmax(0,1fr)_48px]"
      }`
    : "relative z-10 grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out lg:grid-cols-[320px_minmax(0,1fr)]";

  return (
    <div className={shellClass} data-theme={settings.theme}>
      <div className="relative isolate min-h-screen text-[var(--text-primary)]" style={{ background: "var(--app-bg)" }}>
        <div className="theme-motif" aria-hidden="true">
          <span className="theme-motif__shape theme-motif__shape--one" />
          <span className="theme-motif__shape theme-motif__shape--two" />
          <span className="theme-motif__shape theme-motif__shape--three" />
        </div>
        <div className={shellGridClass}>
          <aside className="border-r border-[var(--border-subtle)] bg-[var(--panel-bg)] lg:max-h-screen lg:overflow-y-auto">
            <div className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--panel-bg-glass)] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="theme-brand-mark flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)] text-white">
                    <Clapperboard size={22} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold">Creator Tools Studio</h1>
                    <p className="text-xs font-medium text-[var(--text-muted)]">
                      {user ? user.email : "Guest workspace"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-button"
                    type="button"
                    title={activeThemeBaseMode === "dark" ? "Light theme" : "Dark theme"}
                    onClick={handleThemeToggle}
                  >
                    {activeThemeBaseMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
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
              <ToolSwitcher
                activeTool={activeTool}
                activeToolCount={activeToolCount}
                onToolSelect={handleToolSelect}
              />

              {isTranslateTool ? (
                <YoutubePromptTranslateSidebar
                  title={title}
                  description={description}
                  selectedLanguage={selectedLanguage}
                  settings={settings}
                  apiKeys={apiKeys}
                  languages={languages}
                  generating={generating}
                  promptStatusLabel={promptStatusLabel}
                  promptStatusSource={promptStatusSource}
                  selectedPromptChoiceId={selectedPromptChoiceId}
                  promptChoices={promptChoices}
                  systemPrompt={systemPrompt}
                  usagePromptItem={usagePromptItem}
                  promptName={promptName}
                  note={note}
                  category={category}
                  tagsRaw={tagsRaw}
                  display={display}
                  favorite={favorite}
                  isSavingPrompt={isSavingPrompt}
                  isEditingPrompt={Boolean(activeItemId)}
                  onTitleChange={setTitle}
                  onDescriptionChange={setDescription}
                  onLanguageChange={setSelectedLanguage}
                  onApiKeyChange={handleApiKeyChange}
                  onGenerate={handleGenerate}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onPromptChoiceChange={handlePromptChoiceChange}
                  onSystemPromptChange={handleSystemPromptChange}
                  onNameChange={setPromptName}
                  onNoteChange={setNote}
                  onCategoryChange={setCategory}
                  onTagsChange={setTagsRaw}
                  onDisplayChange={setDisplay}
                  onFavoriteChange={setFavorite}
                  onSavePrompt={handleSavePrompt}
                  onNewPrompt={resetDraft}
                />
              ) : (
                <ThumbnailDownloaderSidebar tool={activeTool} />
              )}
            </div>
          </aside>

          <main className="flex min-h-[70vh] min-w-0 flex-col lg:max-h-screen">
            {isTranslateTool ? (
              <YoutubePromptTranslateTool
                tool={activeTool}
                selectedLanguage={selectedLanguage}
                selectedTargetLanguages={selectedTargetLanguages}
                user={user}
                authReady={authReady}
                supabaseConfigured={supabaseConfigured}
                syncStatus={syncStatus}
                guestCount={guestCount}
                storeError={storeError}
                generationError={generationError}
                generating={generating}
                latestExchange={latestExchange}
                results={results}
                items={items}
                activeItemId={activeItemId}
                usagePromptItemId={usagePromptItemId}
                search={search}
                isPromptLibraryRefreshing={isPromptLibraryRefreshing}
                onFeedbackOpen={() => setFeedbackOpen(true)}
                onImportGuest={handleImportGuest}
                onNotice={setNotice}
                onSearchChange={setSearch}
                onRefresh={handleRefreshPromptLibrary}
                onSelect={loadPromptItem}
                onUse={handleUsePromptItem}
                onDelete={handleDeletePrompt}
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
              />
            ) : (
              <ThumbnailDownloaderTool tool={activeTool} />
            )}
          </main>

          {isTranslateTool && (
            <YoutubePromptLibraryAside
              items={items}
              currentUserId={user?.id ?? null}
              activeItemId={activeItemId}
              usingItemId={usagePromptItemId}
              search={search}
              isOpen={promptLibraryOpen}
              refreshing={isPromptLibraryRefreshing}
              onSearchChange={setSearch}
              onOpenChange={setPromptLibraryOpen}
              onRefresh={handleRefreshPromptLibrary}
              onSelect={loadPromptItem}
              onUse={handleUsePromptItem}
              onDelete={handleDeletePrompt}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
            />
          )}
        </div>

        <ApiKeyDialog
          open={settingsOpen}
          apiKeys={apiKeys}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onKeysChange={setApiKeys}
          onSettingsChange={setSettings}
          onThemeChange={handleAdvancedThemeChange}
          onSaveSettings={handleSettingsSave}
          onNotice={setNotice}
        />

        <FeedbackDialog
          open={feedbackOpen}
          user={user}
          onClose={() => setFeedbackOpen(false)}
          onNotice={setNotice}
        />

        {notice && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-[var(--panel-bg)] shadow-xl">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
