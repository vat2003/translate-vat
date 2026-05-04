"use client";

import { KeyRound, Settings, Sparkles } from "lucide-react";
import { maskApiKey, type LocalApiKey } from "@/lib/api-key-store";
import type { LanguageOption, PromptItem } from "@/lib/types";
import { LanguageSelector } from "@/components/language-selector";

type PromptEditorProps = {
  title: string;
  description: string;
  systemPrompt: string;
  selectedLanguage: string;
  selectedApiKeyId: string;
  model: string;
  apiKeys: LocalApiKey[];
  languages: LanguageOption[];
  promptChoices: PromptItem[];
  generating: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onGenerate: () => void;
  onOpenSettings: () => void;
};

export function PromptEditor({
  title,
  description,
  systemPrompt,
  selectedLanguage,
  selectedApiKeyId,
  model,
  apiKeys,
  languages,
  promptChoices,
  generating,
  onTitleChange,
  onDescriptionChange,
  onSystemPromptChange,
  onLanguageChange,
  onApiKeyChange,
  onGenerate,
  onOpenSettings
}: PromptEditorProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-3">
        <div>
          <label className="field-label" htmlFor="active-key-editor">
            API Key
          </label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
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
          <label className="field-label" htmlFor="prompt-choice">
            System Prompt
          </label>
          <select
            id="prompt-choice"
            className="input-field mb-2"
            value=""
            onChange={(event) => {
              const item = promptChoices.find((choice) => choice.id === event.target.value);
              if (item?.system_prompt) {
                onSystemPromptChange(item.system_prompt);
              }
            }}
          >
            <option value="">Use current prompt</option>
            {promptChoices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.title}
              </option>
            ))}
          </select>
          <textarea
            className="input-field min-h-64 font-mono text-xs"
            value={systemPrompt}
            onChange={(event) => onSystemPromptChange(event.target.value)}
          />
        </div>
      </div>

      <button className="button-primary h-12 w-full text-base" type="button" disabled={generating} onClick={onGenerate}>
        <Sparkles size={18} />
        {generating ? "Generating..." : "Generate"}
      </button>
    </section>
  );
}
