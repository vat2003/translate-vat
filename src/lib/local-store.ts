"use client";

import {
  DEFAULT_LANGUAGES,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  type AppSettings,
  type PromptItem,
  type PromptItemInput
} from "@/lib/types";
import { normalizePromptItem, stripHiddenPromptSection } from "@/lib/prompt-utils";

const PROMPTS_STORAGE = "yt_prompt_items_guest";
const SETTINGS_STORAGE = "gemini_translator_settings";
const LEGACY_THEME_STORAGE = "app_theme";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getGuestPromptItems() {
  return readJson<PromptItem[]>(PROMPTS_STORAGE, []).map((item) => normalizePromptItem(item));
}

export function setGuestPromptItems(items: PromptItem[]) {
  writeJson(PROMPTS_STORAGE, items);
}

export function getGuestPromptCount() {
  return getGuestPromptItems().length;
}

export function createGuestPromptItem(input: PromptItemInput) {
  const item = normalizePromptItem(input);
  const items = [item, ...getGuestPromptItems()];
  setGuestPromptItems(items);
  return item;
}

export function updateGuestPromptItem(id: string, input: PromptItemInput) {
  const items = getGuestPromptItems();
  const nextItems = items.map((item) =>
    item.id === id
      ? normalizePromptItem({
          ...item,
          ...input,
          id,
          created_at: item.created_at,
          updated_at: new Date().toISOString()
        })
      : item
  );
  const updated = nextItems.find((item) => item.id === id);
  setGuestPromptItems(nextItems);

  if (!updated) {
    throw new Error("Prompt not found");
  }

  return updated;
}

export function deleteGuestPromptItem(id: string) {
  setGuestPromptItems(getGuestPromptItems().filter((item) => item.id !== id));
}

export function clearGuestPromptItems() {
  setGuestPromptItems([]);
}

export function readAppSettings(): AppSettings {
  const settings = readJson<Partial<AppSettings> & { languages?: string; prompt?: string }>(
    SETTINGS_STORAGE,
    {}
  );
  const legacyTheme =
    canUseStorage() && window.localStorage.getItem(LEGACY_THEME_STORAGE) === "dark" ? "dark" : "light";

  const systemPrompt = settings.systemPrompt || settings.prompt || DEFAULT_SYSTEM_PROMPT;

  return {
    model: settings.model || DEFAULT_MODEL,
    languagesRaw: settings.languagesRaw || settings.languages || DEFAULT_LANGUAGES,
    systemPrompt: stripHiddenPromptSection(systemPrompt),
    selectedApiKeyId: settings.selectedApiKeyId || "",
    theme: settings.theme || legacyTheme
  };
}

export function saveAppSettings(settings: AppSettings) {
  writeJson(SETTINGS_STORAGE, {
    ...settings,
    systemPrompt: stripHiddenPromptSection(settings.systemPrompt)
  });

  if (canUseStorage()) {
    window.localStorage.setItem(LEGACY_THEME_STORAGE, settings.theme);
  }
}
