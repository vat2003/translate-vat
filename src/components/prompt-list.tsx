"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Pin, Play, Search, Star, Trash2 } from "lucide-react";
import { PromptLibraryReloadButton } from "@/components/prompt-library-reload-button";
import { formatDateTime } from "@/lib/prompt-utils";
import type { PromptItem } from "@/lib/types";

type PromptListProps = {
  items: PromptItem[];
  currentUserId: string | null;
  activeItemId: string | null;
  usingItemId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: PromptItem) => void;
  onUse: (item: PromptItem) => void;
  onDelete: (item: PromptItem) => void;
  onToggleFavorite: (item: PromptItem) => void;
  onTogglePin: (item: PromptItem) => void;
  refreshing: boolean;
  onRefresh: () => void;
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
  currentUserId,
  activeItemId,
  usingItemId,
  search,
  onSearchChange,
  onSelect,
  onUse,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  refreshing,
  onRefresh,
  isOpen: controlledIsOpen,
  onOpenChange
}: PromptListProps) {
  const [localIsOpen, setLocalIsOpen] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const isOpen = controlledIsOpen ?? localIsOpen;
  const setIsOpen = onOpenChange ?? setLocalIsOpen;
  const filteredItems = items.filter(
    (item) =>
      (!item.user_id || item.user_id === currentUserId || item.display === "public") &&
      matchesSearch(item, search)
  );

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
        <div className="border-b border-[var(--border-subtle)] p-4 pr-14">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Prompt Library</h2>
            <div className="flex items-center gap-2">
              <PromptLibraryReloadButton refreshing={refreshing} onRefresh={onRefresh} />
              <span className="chip-muted">
                {filteredItems.length}
              </span>
            </div>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
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
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-muted)]">
              No prompts
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOwner = !item.user_id || item.user_id === currentUserId;
              const requiresLogin = !currentUserId && Boolean(item.user_id);
              const isExpanded = expandedItemId === item.id;
              const isEditing = activeItemId === item.id;
              const isUsing = usingItemId === item.id;

              return (
                <article
                  key={item.id}
                  className={`rounded-lg border p-2.5 transition ${
                    isUsing
                      ? "border-[var(--success-border)] bg-[var(--success-soft)] shadow-[0_10px_26px_var(--success-shadow)]"
                      : isEditing
                        ? "border-[var(--primary-border)] bg-[var(--primary-soft)]"
                      : "border-[var(--border-muted)] bg-[var(--panel-elevated)] hover:border-[var(--border-subtle)] hover:bg-[var(--panel-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left outline-none transition hover:bg-[var(--panel-hover)] focus-visible:ring-4 focus-visible:ring-[var(--primary-ring)]"
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {item.name}
                          </h3>
                          {isUsing && (
                            <span className="chip-success shrink-0 px-1.5 py-0.5 text-[10px] uppercase">
                              Using
                            </span>
                          )}
                          {isEditing && !isUsing && (
                            <span className="chip-primary shrink-0 px-1.5 py-0.5 text-[10px] uppercase">
                              Editing
                            </span>
                          )}
                          {item.pinned_at && (
                            <Pin size={13} className="shrink-0 text-[var(--primary-text)]" fill="currentColor" />
                          )}
                          {item.is_favorite && (
                            <Star
                              size={13}
                              className="shrink-0 text-[var(--warning-text)]"
                              fill="currentColor"
                            />
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <span className="chip-muted px-1.5 py-0.5">
                            {item.target_language === "all" ? "All languages" : item.target_language}
                          </span>
                          {item.category && <span className="truncate">{item.category}</span>}
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-[var(--text-subtle)] transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    <button
                      className={
                        isUsing
                          ? "button-secondary h-8 border-[var(--success-border)] bg-[var(--success-soft)] px-2 text-[var(--success-text)]"
                          : "button-secondary h-8 px-2"
                      }
                      type="button"
                      title={requiresLogin ? "Log in to use public prompts" : "Use prompt"}
                      disabled={requiresLogin}
                      onClick={() => onUse(item)}
                    >
                      <Play size={14} />
                      {isUsing ? "Using" : "Use"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-3 border-t border-[var(--border-muted)] px-1 pt-3">
                      {(item.note || item.system_prompt) && (
                        <div>
                          <strong className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                            Preview
                          </strong>
                          <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[var(--panel-muted)] p-2 text-xs leading-5 text-[var(--text-muted)]">
                            {item.note || item.system_prompt}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        {item.category && (
                          <span className="chip-muted">
                            {item.category}
                          </span>
                        )}
                        <span>{item.display}</span>
                        {item.pinned_at && <span>Pinned</span>}
                        <span>{item.usage_count} uses</span>
                        <span>{formatDateTime(item.updated_at)}</span>
                      </div>

                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="chip-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-end gap-2">
                        {isOwner && (
                          <button className="button-secondary h-9" type="button" onClick={() => onSelect(item)}>
                            <Pencil size={15} />
                            Edit
                          </button>
                        )}
                        {isOwner && (
                          <button
                            className="button-secondary h-9"
                            type="button"
                            title={item.pinned_at ? "Unpin" : "Pin"}
                            onClick={() => onTogglePin(item)}
                          >
                            <Pin size={15} fill={item.pinned_at ? "currentColor" : "none"} />
                            {item.pinned_at ? "Unpin" : "Pin"}
                          </button>
                        )}
                        <button
                          className="button-secondary h-9"
                          type="button"
                          title={
                            requiresLogin
                              ? "Log in to favorite public prompts"
                              : item.is_favorite
                                ? "Unfavorite"
                                : "Favorite"
                          }
                          disabled={requiresLogin}
                          onClick={() => onToggleFavorite(item)}
                        >
                          <Star size={15} fill={item.is_favorite ? "currentColor" : "none"} />
                          {item.is_favorite ? "Unfavorite" : "Favorite"}
                        </button>
                        {isOwner && (
                          <button className="button-secondary h-9" type="button" onClick={() => onDelete(item)}>
                            <Trash2 size={15} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
