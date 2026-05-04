"use client";

import { FilePlus2, Save, Star } from "lucide-react";

type NotePanelProps = {
  activeTitle: string;
  note: string;
  category: string;
  tagsRaw: string;
  favorite: boolean;
  saving: boolean;
  isEditing: boolean;
  onNoteChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onFavoriteChange: (value: boolean) => void;
  onSave: () => void;
  onNew: () => void;
};

export function NotePanel({
  activeTitle,
  note,
  category,
  tagsRaw,
  favorite,
  saving,
  isEditing,
  onNoteChange,
  onCategoryChange,
  onTagsChange,
  onFavoriteChange,
  onSave,
  onNew
}: NotePanelProps) {
  return (
    <section className="space-y-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {isEditing ? "Editing prompt" : "Prompt note"}
          </h2>
          {isEditing && (
            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{activeTitle}</p>
          )}
        </div>
        <button className="button-secondary" type="button" onClick={onNew}>
          <FilePlus2 size={16} />
          New
        </button>
      </div>

      <div>
        <label className="field-label" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          className="input-field min-h-28"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Internal note"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            className="input-field"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            placeholder="Translation"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="tags">
            Tags
          </label>
          <input
            id="tags"
            className="input-field"
            value={tagsRaw}
            onChange={(event) => onTagsChange(event.target.value)}
            placeholder="youtube, title"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className={
            favorite
              ? "button-secondary border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              : "button-secondary"
          }
          type="button"
          onClick={() => onFavoriteChange(!favorite)}
        >
          <Star size={16} fill={favorite ? "currentColor" : "none"} />
          Favorite
        </button>
        <button className="button-primary" type="button" disabled={saving} onClick={onSave}>
          <Save size={16} />
          {isEditing ? "Update" : "Save"}
        </button>
      </div>
    </section>
  );
}
