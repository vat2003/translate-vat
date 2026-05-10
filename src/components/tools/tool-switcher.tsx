"use client";

import { ChevronDown } from "lucide-react";
import { CREATOR_TOOLS, type CreatorTool } from "@/lib/creator-tools";
import { TOOL_ICONS } from "@/components/tools/tool-icons";

type ToolSwitcherProps = {
  activeTool: CreatorTool;
  activeToolCount: number;
  onToolSelect: (tool: CreatorTool) => void;
};

export function ToolSwitcher({ activeTool, activeToolCount, onToolSelect }: ToolSwitcherProps) {
  const ActiveToolIcon = TOOL_ICONS[activeTool.icon];

  return (
    <nav aria-label="Creator tools">
      <details className="group rounded-lg border border-[var(--border-muted)] bg-[var(--panel-elevated)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 outline-none transition hover:bg-[var(--panel-hover)] focus-visible:ring-4 focus-visible:ring-[var(--primary-ring)] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary-text)]">
              <ActiveToolIcon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                Tools
              </span>
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                {activeTool.name}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="chip-success">{activeToolCount} active</span>
            <ChevronDown size={16} className="text-[var(--text-muted)] transition group-open:rotate-180" />
          </span>
        </summary>

        <div className="max-h-56 overflow-y-auto border-t border-[var(--border-muted)] p-2">
          {CREATOR_TOOLS.map((tool) => {
            const ToolIcon = TOOL_ICONS[tool.icon];
            const isSelectedTool = tool.id === activeTool.id;
            const isComingSoon = tool.status === "coming-soon";

            return (
              <button
                key={tool.id}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition ${
                  isSelectedTool
                    ? "bg-[var(--primary-soft)]"
                    : isComingSoon
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-[var(--panel-hover)]"
                }`}
                type="button"
                disabled={isComingSoon}
                aria-current={isSelectedTool ? "page" : undefined}
                onClick={() => onToolSelect(tool)}
                title={tool.description}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--panel-bg)] text-[var(--primary-text)]">
                  <ToolIcon size={15} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {tool.name}
                </span>
                {isSelectedTool && <span className="chip-success shrink-0">Active</span>}
                {isComingSoon && <span className="chip-muted shrink-0">Developing</span>}
              </button>
            );
          })}
        </div>
      </details>
    </nav>
  );
}
