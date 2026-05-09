"use client";

import { CheckCircle2, KeyRound, Palette, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addApiKey,
  maskApiKey,
  readApiKeys,
  removeApiKey,
  type LocalApiKey
} from "@/lib/api-key-store";
import type { AppSettings } from "@/lib/types";
import { THEME_OPTIONS } from "@/lib/theme-options";

type ApiKeyDialogProps = {
  open: boolean;
  apiKeys: LocalApiKey[];
  settings: AppSettings;
  onClose: () => void;
  onKeysChange: (keys: LocalApiKey[]) => void;
  onSettingsChange: (settings: AppSettings) => void;
  onThemeChange: (theme: AppSettings["theme"]) => void;
  onSaveSettings: () => void;
  onNotice: (message: string) => void;
};

export function ApiKeyDialog({
  open,
  apiKeys,
  settings,
  onClose,
  onKeysChange,
  onSettingsChange,
  onThemeChange,
  onSaveSettings,
  onNotice
}: ApiKeyDialogProps) {
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [keyToRemove, setKeyToRemove] = useState("");

  const selectedRemoval = useMemo(
    () => apiKeys.find((key) => key.id === keyToRemove),
    [apiKeys, keyToRemove]
  );
  const activeTheme = useMemo(
    () => THEME_OPTIONS.find((theme) => theme.id === settings.theme) || THEME_OPTIONS[0],
    [settings.theme]
  );

  if (!open) {
    return null;
  }

  function handleAddKey() {
    try {
      const created = addApiKey(newKey, newLabel);
      const keys = readApiKeys();
      onKeysChange(keys);
      onSettingsChange({
        ...settings,
        selectedApiKeyId: settings.selectedApiKeyId || created.id
      });
      setNewKey("");
      setNewLabel("");
      onNotice("API key saved locally");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save API key");
    }
  }

  function handleRemoveKey() {
    if (!selectedRemoval) {
      return;
    }

    removeApiKey(selectedRemoval.id);
    const keys = readApiKeys();
    onKeysChange(keys);
    onSettingsChange({
      ...settings,
      selectedApiKeyId:
        settings.selectedApiKeyId === selectedRemoval.id ? keys[0]?.id || "" : settings.selectedApiKeyId
    });
    setKeyToRemove("");
    onNotice("API key removed");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--panel-bg-glass)] px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound size={18} />
            Settings
          </div>
          <button className="icon-button" type="button" title="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section className="space-y-3">
            <div>
              <label className="field-label" htmlFor="new-api-key">
                Gemini API Key
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input
                  id="new-key-label"
                  className="input-field"
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="Label"
                />
                <input
                  id="new-api-key"
                  className="input-field"
                  type="password"
                  autoComplete="off"
                  value={newKey}
                  onChange={(event) => setNewKey(event.target.value)}
                  placeholder="Paste API key"
                />
                <button className="button-primary" type="button" onClick={handleAddKey}>
                  <KeyRound size={16} />
                  Add
                </button>
              </div>
              <p className="field-hint">
                Keys stay in localStorage on this browser and are never saved to Supabase.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                className="input-field"
                value={keyToRemove}
                onChange={(event) => setKeyToRemove(event.target.value)}
              >
                <option value="">No key selected</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.label} - {maskApiKey(key.value)}
                  </option>
                ))}
              </select>
              <button
                className="button-danger"
                type="button"
                disabled={!selectedRemoval}
                onClick={handleRemoveKey}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="model-select">
                Gemini Model
              </label>
              <select
                id="model-select"
                className="input-field"
                value={settings.model}
                onChange={(event) => onSettingsChange({ ...settings, model: event.target.value })}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="active-api-key">
                Active API Key
              </label>
              <select
                id="active-api-key"
                className="input-field"
                value={settings.selectedApiKeyId}
                onChange={(event) =>
                  onSettingsChange({ ...settings, selectedApiKeyId: event.target.value })
                }
              >
                <option value="">No local key selected</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.label} - {maskApiKey(key.value)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <details className="rounded-lg border border-[var(--border-muted)] bg-[var(--panel-elevated)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition hover:bg-[var(--panel-hover)] focus-visible:ring-4 focus-visible:ring-[var(--primary-ring)] [&::-webkit-details-marker]:hidden">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Palette size={17} />
                Advanced Themes
                <span className="chip-muted max-w-[220px] truncate">{activeTheme.name}</span>
              </span>
            </summary>
            <div className="border-t border-[var(--border-muted)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = theme.id === settings.theme;

                  return (
                    <article
                      key={theme.id}
                      data-theme-card={theme.id}
                      className={`rounded-lg border p-3 transition ${
                        isSelected
                          ? "border-[var(--primary-border)] bg-[var(--primary-soft)]"
                          : "border-[var(--border-muted)] bg-[var(--panel-bg)]"
                      }`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="theme-card-symbol" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {theme.name}
                          </h3>
                          <div className="mt-2 flex gap-1.5">
                            {theme.preview.map((color) => (
                              <span
                                key={color}
                                className="h-4 w-4 rounded-full border border-[var(--border-subtle)]"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={17} className="shrink-0 text-[var(--primary-text)]" />
                        )}
                      </div>
                      <button
                        className={isSelected ? "button-secondary h-8 w-full" : "button-secondary h-8 w-full"}
                        type="button"
                        disabled={isSelected}
                        onClick={() => onThemeChange(theme.id)}
                      >
                        {isSelected ? "Selected" : "Apply"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </details>

          <section>
            <label className="field-label" htmlFor="languages-raw">
              Target Languages
            </label>
            <textarea
              id="languages-raw"
              className="input-field min-h-44"
              value={settings.languagesRaw}
              onChange={(event) => onSettingsChange({ ...settings, languagesRaw: event.target.value })}
            />
            <p className="field-hint">Format: code: display name, one language per line.</p>
          </section>

          <section>
            <label className="field-label" htmlFor="default-system-prompt">
              Default System Prompt
            </label>
            <textarea
              id="default-system-prompt"
              className="input-field min-h-64 font-mono text-xs"
              value={settings.systemPrompt}
              onChange={(event) => onSettingsChange({ ...settings, systemPrompt: event.target.value })}
            />
          </section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--panel-bg-glass)] px-5 py-4 backdrop-blur">
          <button className="button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" type="button" onClick={onSaveSettings}>
            <Save size={16} />
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
