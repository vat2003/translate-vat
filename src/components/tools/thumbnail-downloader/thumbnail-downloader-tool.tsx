"use client";

import type { CreatorTool } from "@/lib/creator-tools";
import { TOOL_ICONS } from "@/components/tools/tool-icons";
import { ThumbnailDownloader } from "@/components/tools/thumbnail-downloader/thumbnail-downloader";

type ThumbnailDownloaderToolProps = {
  tool: CreatorTool;
};

export function ThumbnailDownloaderSidebar({ tool }: ThumbnailDownloaderToolProps) {
  return (
    <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--panel-elevated)] p-4">
      <span className="chip-success mb-3">No login required</span>
      <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{tool.name}</h2>
      <p className="text-sm leading-6 text-[var(--text-muted)]">
        Paste a public YouTube link, preview the available thumbnail sizes, then download the image you need.
      </p>
    </div>
  );
}

export function ThumbnailDownloaderTool({ tool }: ThumbnailDownloaderToolProps) {
  const ActiveToolIcon = TOOL_ICONS[tool.icon];

  return (
    <>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--app-bg-glass)] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary-text)]">
              <ActiveToolIcon className="mr-1.5 inline align-[-3px]" size={14} />
              {tool.name}
            </p>
            <h2 className="text-lg font-bold">Download YouTube Thumbnail</h2>
            <p className="text-sm text-[var(--text-muted)]">No login or database storage required.</p>
          </div>
          <span className="chip-success">Local utility</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <ThumbnailDownloader />
      </div>
    </>
  );
}
