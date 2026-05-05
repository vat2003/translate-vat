"use client";

import { RefreshCw } from "lucide-react";

type PromptLibraryReloadButtonProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export function PromptLibraryReloadButton({
  refreshing,
  onRefresh
}: PromptLibraryReloadButtonProps) {
  return (
    <button
      className="icon-button"
      type="button"
      title="Reload prompt library"
      disabled={refreshing}
      onClick={onRefresh}
    >
      <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
    </button>
  );
}
