"use client";

import type { User } from "@supabase/supabase-js";
import { MessageSquare } from "lucide-react";
import NextImage from "next/image";
import { AuthButton } from "@/components/auth-button";
import { CopyButton } from "@/components/copy-button";
import { PromptList } from "@/components/prompt-list";
import { TOOL_ICONS } from "@/components/tools/tool-icons";
import type { CreatorTool } from "@/lib/creator-tools";
import type { GeneratedResult, LanguageOption, PromptItem, SyncStatus } from "@/lib/types";

type LatestExchange = {
  request: unknown;
  response: unknown;
};

type PromptLibraryHandlers = {
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSelect: (item: PromptItem) => void;
  onUse: (item: PromptItem) => void;
  onDelete: (item: PromptItem) => void;
  onToggleFavorite: (item: PromptItem) => void;
  onTogglePin: (item: PromptItem) => void;
};

type YoutubePromptTranslateToolProps = PromptLibraryHandlers & {
  tool: CreatorTool;
  selectedLanguage: string;
  selectedTargetLanguages: LanguageOption[];
  user: User | null;
  authReady: boolean;
  supabaseConfigured: boolean;
  syncStatus: SyncStatus;
  guestCount: number;
  storeError: string;
  generationError: string;
  generating: boolean;
  latestExchange: LatestExchange | null;
  results: GeneratedResult[];
  items: PromptItem[];
  activeItemId: string | null;
  usagePromptItemId: string | null;
  search: string;
  isPromptLibraryRefreshing: boolean;
  onFeedbackOpen: () => void;
  onImportGuest: () => Promise<void>;
  onNotice: (message: string) => void;
};

export function YoutubePromptTranslateTool({
  tool,
  selectedLanguage,
  selectedTargetLanguages,
  user,
  authReady,
  supabaseConfigured,
  syncStatus,
  guestCount,
  storeError,
  generationError,
  generating,
  latestExchange,
  results,
  items,
  activeItemId,
  usagePromptItemId,
  search,
  isPromptLibraryRefreshing,
  onFeedbackOpen,
  onImportGuest,
  onNotice,
  onSearchChange,
  onRefresh,
  onSelect,
  onUse,
  onDelete,
  onToggleFavorite,
  onTogglePin
}: YoutubePromptTranslateToolProps) {
  const ActiveToolIcon = TOOL_ICONS[tool.icon];
  const latestRequestJson = latestExchange ? JSON.stringify(latestExchange.request, null, 2) : "";
  const latestResponseJson = latestExchange ? JSON.stringify(latestExchange.response, null, 2) : "";

  return (
    <>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--app-bg-glass)] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary-text)]">
              <ActiveToolIcon className="mr-1.5 inline align-[-3px]" size={14} />
              {tool.name}
            </p>
            <h2 className="text-lg font-bold">Output</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {selectedLanguage === "all"
                ? `${selectedTargetLanguages.length} target languages`
                : selectedTargetLanguages[0]?.label || "No language"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <button className="button-secondary" type="button" onClick={onFeedbackOpen}>
                <MessageSquare size={16} />
                Feedback
              </button>
            )}
            <AuthButton
              user={user}
              ready={authReady}
              configured={supabaseConfigured}
              syncStatus={syncStatus}
              guestCount={guestCount}
              onImportGuest={onImportGuest}
              onNotice={onNotice}
            />
          </div>
        </div>
        {(storeError || generationError) && (
          <div className="mt-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger-text)]">
            {generationError || storeError}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {generating && (
          <div className="mb-4 rounded-lg border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--primary-text)]">
            Generating metadata...
          </div>
        )}

        {latestExchange && (
          <div className="mb-4 flex flex-wrap gap-2">
            <CopyButton value={latestRequestJson} label="Copy Request" onError={onNotice} />
            <CopyButton value={latestResponseJson} label="Copy Response" onError={onNotice} />
          </div>
        )}

        {results.length > 0 ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(350px,1fr))]">
            {results.map((item) => (
              <article
                key={item.code}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-elevated)] p-4 shadow-panel"
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
                  <h3 className="min-w-0 truncate text-base font-bold text-[var(--primary-text)]">
                    {item.label}
                  </h3>
                  <span className="chip-muted uppercase">{item.code}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <strong className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Title</strong>
                      <CopyButton value={item.title} label="Copy title" compact onError={onNotice} />
                    </div>
                    <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--panel-muted)] p-3 text-sm leading-6">
                      {item.title}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <strong className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        Description
                      </strong>
                      <CopyButton value={item.description} label="Copy description" compact onError={onNotice} />
                    </div>
                    <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border-muted)] bg-[var(--panel-muted)] p-3 text-sm leading-6">
                      {item.description}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--panel-bg)] p-8 text-center text-sm text-[var(--text-muted)]">
            <NextImage
              src="/screaming-tom-lizard.gif"
              alt=""
              width={112}
              height={112}
              unoptimized
              className="mb-5 h-24 w-24 rounded-lg object-cover opacity-85"
            />
            <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Ready to generate</h3>
            <p>Enter a title and description, then click Generate.</p>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] xl:hidden">
        <div className="h-[560px]">
          <PromptList
            items={items}
            currentUserId={user?.id ?? null}
            activeItemId={activeItemId}
            usingItemId={usagePromptItemId}
            search={search}
            refreshing={isPromptLibraryRefreshing}
            onSearchChange={onSearchChange}
            onRefresh={onRefresh}
            onSelect={onSelect}
            onUse={onUse}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onTogglePin={onTogglePin}
          />
        </div>
      </div>
    </>
  );
}
