"use client";

import { CheckCircle2, KeyRound, Settings, Sparkles } from "lucide-react";
import { maskApiKey, type LocalApiKey } from "@/lib/api-key-store";
import type { LanguageOption } from "@/lib/types";
import { LanguageSelector } from "@/components/language-selector";

type PromptEditorProps = {
  title: string;
  description: string;
  selectedLanguage: string;
  selectedApiKeyId: string;
  model: string;
  apiKeys: LocalApiKey[];
  languages: LanguageOption[];
  generating: boolean;
  promptStatusLabel: string;
  promptStatusSource: "library" | "default" | "custom";
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onGenerate: () => void;
  onOpenSettings: () => void;
};

export function PromptEditor({
  title,
  description,
  selectedLanguage,
  selectedApiKeyId,
  model,
  apiKeys,
  languages,
  generating,
  promptStatusLabel,
  promptStatusSource,
  onTitleChange,
  onDescriptionChange,
  onLanguageChange,
  onApiKeyChange,
  onGenerate,
  onOpenSettings
}: PromptEditorProps) {
  const isLibraryPrompt = promptStatusSource === "library";

  return (
    <section className="space-y-5">
      <div className="grid gap-3">
        <div>
          <label className="field-label" htmlFor="original-title">
            Title
          </label>
          <input
            id="original-title"
            className="input-field"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Original YouTube title"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="original-description">
            Description
          </label>
          <textarea
            id="original-description"
            className="input-field min-h-52"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Original YouTube description"
          />
        </div>

        <LanguageSelector languages={languages} value={selectedLanguage} onChange={onLanguageChange} />

        <div>
          <label className="field-label" htmlFor="active-key-editor">
            API Key
          </label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                size={16}
              />
              <select
                id="active-key-editor"
                className="input-field pl-10"
                value={selectedApiKeyId}
                onChange={(event) => onApiKeyChange(event.target.value)}
              >
                <option value="">No local key selected</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.label} - {maskApiKey(key.value)}
                  </option>
                ))}
              </select>
            </div>
            <button className="button-secondary" type="button" onClick={onOpenSettings}>
              <Settings size={16} />
              Settings
            </button>
          </div>
          <p className="field-hint">Current model: {model}</p>
        </div>

        <div
          className={`rounded-lg border px-3 py-2 ${
            isLibraryPrompt
              ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]"
              : "border-[var(--border-muted)] bg-[var(--panel-muted)] text-[var(--text-muted)]"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wide">Using prompt</span>
            <strong className="min-w-0 truncate text-sm">{promptStatusLabel}</strong>
          </div>
        </div>
      </div>

      <button className="button-primary h-14 w-full text-base" type="button" disabled={generating} onClick={onGenerate}>
        <Sparkles size={18} />
        {generating ? "Generating..." : "Generate"}
      </button>
    </section>
  );
}
