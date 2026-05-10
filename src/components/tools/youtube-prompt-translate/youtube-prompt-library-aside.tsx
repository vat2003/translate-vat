"use client";

import { PromptList } from "@/components/prompt-list";
import type { PromptItem } from "@/lib/types";

type YoutubePromptLibraryAsideProps = {
  items: PromptItem[];
  currentUserId: string | null;
  activeItemId: string | null;
  usingItemId: string | null;
  search: string;
  isOpen: boolean;
  refreshing: boolean;
  onSearchChange: (value: string) => void;
  onOpenChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelect: (item: PromptItem) => void;
  onUse: (item: PromptItem) => void;
  onDelete: (item: PromptItem) => void;
  onToggleFavorite: (item: PromptItem) => void;
  onTogglePin: (item: PromptItem) => void;
};

export function YoutubePromptLibraryAside({
  items,
  currentUserId,
  activeItemId,
  usingItemId,
  search,
  isOpen,
  refreshing,
  onSearchChange,
  onOpenChange,
  onRefresh,
  onSelect,
  onUse,
  onDelete,
  onToggleFavorite,
  onTogglePin
}: YoutubePromptLibraryAsideProps) {
  return (
    <aside className="hidden min-h-0 border-l border-[var(--border-subtle)] bg-[var(--panel-bg)] xl:block xl:max-h-screen">
      <PromptList
        items={items}
        currentUserId={currentUserId}
        activeItemId={activeItemId}
        usingItemId={usingItemId}
        search={search}
        isOpen={isOpen}
        refreshing={refreshing}
        onSearchChange={onSearchChange}
        onOpenChange={onOpenChange}
        onRefresh={onRefresh}
        onSelect={onSelect}
        onUse={onUse}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        onTogglePin={onTogglePin}
      />
    </aside>
  );
}
