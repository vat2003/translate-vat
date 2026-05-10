"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { NotePanel } from "@/components/note-panel";
import { PromptEditor } from "@/components/prompt-editor";
import type { LocalApiKey } from "@/lib/api-key-store";
import type { AppSettings, LanguageOption, PromptDisplay, PromptItem } from "@/lib/types";

type PromptStatusSource = "library" | "default" | "custom";

type YoutubePromptTranslateSidebarProps = {
  title: string;
  description: string;
  selectedLanguage: string;
  settings: AppSettings;
  apiKeys: LocalApiKey[];
  languages: LanguageOption[];
  generating: boolean;
  promptStatusLabel: string;
  promptStatusSource: PromptStatusSource;
  selectedPromptChoiceId: string;
  promptChoices: PromptItem[];
  systemPrompt: string;
  usagePromptItem: PromptItem | null;
  promptName: string;
  note: string;
  category: string;
  tagsRaw: string;
  display: PromptDisplay;
  favorite: boolean;
  isSavingPrompt: boolean;
  isEditingPrompt: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onGenerate: () => void;
  onOpenSettings: () => void;
  onPromptChoiceChange: (promptItemId: string) => void;
  onSystemPromptChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onDisplayChange: (value: PromptDisplay) => void;
  onFavoriteChange: (value: boolean) => void;
  onSavePrompt: () => void;
  onNewPrompt: () => void;
};

export function YoutubePromptTranslateSidebar({
  title,
  description,
  selectedLanguage,
  settings,
  apiKeys,
  languages,
  generating,
  promptStatusLabel,
  promptStatusSource,
  selectedPromptChoiceId,
  promptChoices,
  systemPrompt,
  usagePromptItem,
  promptName,
  note,
  category,
  tagsRaw,
  display,
  favorite,
  isSavingPrompt,
  isEditingPrompt,
  onTitleChange,
  onDescriptionChange,
  onLanguageChange,
  onApiKeyChange,
  onGenerate,
  onOpenSettings,
  onPromptChoiceChange,
  onSystemPromptChange,
  onNameChange,
  onNoteChange,
  onCategoryChange,
  onTagsChange,
  onDisplayChange,
  onFavoriteChange,
  onSavePrompt,
  onNewPrompt
}: YoutubePromptTranslateSidebarProps) {
  return (
    <>
      <PromptEditor
        title={title}
        description={description}
        selectedLanguage={selectedLanguage}
        selectedApiKeyId={settings.selectedApiKeyId}
        model={settings.model}
        apiKeys={apiKeys}
        languages={languages}
        generating={generating}
        promptStatusLabel={promptStatusLabel}
        promptStatusSource={promptStatusSource}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onLanguageChange={onLanguageChange}
        onApiKeyChange={onApiKeyChange}
        onGenerate={onGenerate}
        onOpenSettings={onOpenSettings}
      />

      <details className="group border-t border-[var(--border-muted)] pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-1 text-sm font-semibold text-[var(--text-muted)] outline-none transition hover:text-[var(--primary-text)] focus-visible:ring-4 focus-visible:ring-[var(--primary-ring)] [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Advanced
            <span
              className={`max-w-[220px] truncate rounded-md px-2 py-0.5 text-xs font-semibold ${
                usagePromptItem
                  ? "bg-[var(--success-soft)] text-[var(--success-text)]"
                  : "bg-[var(--panel-muted)] text-[var(--text-muted)]"
              }`}
            >
              {promptStatusLabel}
            </span>
          </span>
          <ChevronDown size={17} className="transition group-open:rotate-180" />
        </summary>

        <div className="space-y-5 pt-4">
          <div>
            <label className="field-label" htmlFor="prompt-choice">
              System Prompt
            </label>
            <select
              id="prompt-choice"
              className="input-field mb-2"
              value={selectedPromptChoiceId}
              onChange={(event) => onPromptChoiceChange(event.target.value)}
            >
              <option value="">Custom / current prompt</option>
              {promptChoices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
            <textarea
              className="input-field min-h-64 font-mono text-xs"
              value={systemPrompt}
              onChange={(event) => onSystemPromptChange(event.target.value)}
            />
          </div>

          <NotePanel
            name={promptName}
            note={note}
            category={category}
            tagsRaw={tagsRaw}
            display={display}
            favorite={favorite}
            saving={isSavingPrompt}
            isEditing={isEditingPrompt}
            onNameChange={onNameChange}
            onNoteChange={onNoteChange}
            onCategoryChange={onCategoryChange}
            onTagsChange={onTagsChange}
            onDisplayChange={onDisplayChange}
            onFavoriteChange={onFavoriteChange}
            onSave={onSavePrompt}
            onNew={onNewPrompt}
          />
        </div>
      </details>
    </>
  );
}
