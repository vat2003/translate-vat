"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search, Star, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/prompt-utils";
import type { PromptItem } from "@/lib/types";

type PromptListProps = {
  items: PromptItem[];
  activeItemId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: PromptItem) => void;
  onDelete: (item: PromptItem) => void;
  onToggleFavorite: (item: PromptItem) => void;
  isOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
};

function matchesSearch(item: PromptItem, search: string) {
  const term = search.trim().toLowerCase();

  if (!term) {
    return true;
  }

  return [item.name, item.note, item.category, item.tags.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(term);
}

export function PromptList({
  items,
  activeItemId,
  search,
  onSearchChange,
  onSelect,
  onDelete,
  onToggleFavorite,
  isOpen: controlledIsOpen,
  onOpenChange
}: PromptListProps) {
  const [localIsOpen, setLocalIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? localIsOpen;
  const setIsOpen = onOpenChange ?? setLocalIsOpen;
  const filteredItems = items.filter((item) => matchesSearch(item, search));

  return (
    <section
      className={`relative h-full min-h-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
        isOpen ? "w-full" : "w-12"
      }`}
    >
      <button
        className="icon-button absolute right-1.5 top-3 z-10"
        type="button"
        title={isOpen ? "Hide prompt library" : "Show prompt library"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div
        className={`flex h-full min-h-0 min-w-72 flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-200 p-4 pr-14 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Prompt Library</h2>
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {filteredItems.length}
            </span>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
            <input
              className="input-field pl-10"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search prompts"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No prompts
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className={`rounded-lg border p-3 transition ${
                  activeItemId === item.id
                    ? "border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-500/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    className="min-w-0 flex-1 text-left"
                    type="button"
                    onClick={() => onSelect(item)}
                  >
                    <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {item.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {item.note || item.system_prompt || "No note"}
                    </p>
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    title={item.is_favorite ? "Unfavorite" : "Favorite"}
                    onClick={() => onToggleFavorite(item)}
                  >
                    <Star size={16} fill={item.is_favorite ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.category && (
                    <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                      {item.category}
                    </span>
                  )}
                  <span>{item.target_language === "all" ? "All languages" : item.target_language}</span>
                  <span>{item.display}</span>
                  <span>{item.usage_count} uses</span>
                  <span>{formatDateTime(item.updated_at)}</span>
                </div>

                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
                  <button className="button-secondary h-9" type="button" onClick={() => onSelect(item)}>
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button className="button-secondary h-9" type="button" onClick={() => onDelete(item)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
