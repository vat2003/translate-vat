"use client";

const KEYS_STORAGE = "gemini_api_keys";

export type ApiProvider = "gemini";

export type LocalApiKey = {
  id: string;
  provider: ApiProvider;
  label: string;
  value: string;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function fallbackId(index: number) {
  return `local-key-${index + 1}`;
}

function normalizeKey(value: string | Partial<LocalApiKey>, index: number): LocalApiKey | null {
  if (typeof value === "string") {
    const key = value.trim();
    if (!key) {
      return null;
    }

    return {
      id: fallbackId(index),
      provider: "gemini",
      label: `Gemini key ${index + 1}`,
      value: key,
      createdAt: new Date().toISOString()
    };
  }

  if (!value.value?.trim()) {
    return null;
  }

  return {
    id: value.id || fallbackId(index),
    provider: "gemini",
    label: value.label || `Gemini key ${index + 1}`,
    value: value.value.trim(),
    createdAt: value.createdAt || new Date().toISOString()
  };
}

export function readApiKeys() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEYS_STORAGE);
    const parsed = raw ? (JSON.parse(raw) as Array<string | Partial<LocalApiKey>>) : [];
    return parsed.map((item, index) => normalizeKey(item, index)).filter(Boolean) as LocalApiKey[];
  } catch {
    return [];
  }
}

export function saveApiKeys(keys: LocalApiKey[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

export function addApiKey(value: string, label?: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    throw new Error("Missing API key");
  }

  const keys = readApiKeys();

  if (keys.some((key) => key.value === cleanValue)) {
    throw new Error("API key already exists");
  }

  const nextKey: LocalApiKey = {
    id: crypto.randomUUID(),
    provider: "gemini",
    label: label?.trim() || `Gemini key ${keys.length + 1}`,
    value: cleanValue,
    createdAt: new Date().toISOString()
  };

  saveApiKeys([...keys, nextKey]);
  return nextKey;
}

export function removeApiKey(id: string) {
  saveApiKeys(readApiKeys().filter((key) => key.id !== id));
}

export function maskApiKey(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return "";
  }

  const suffix = cleanValue.slice(-4);
  const prefix = cleanValue.startsWith("sk-") ? "sk-" : cleanValue.slice(0, 4);
  return `${prefix}****${suffix}`;
}
