"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label: string;
  compact?: boolean;
  onError?: (message: string) => void;
};

export function CopyButton({ value, label, compact, onError }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      onError?.("Browser blocked clipboard access");
    }
  }

  return (
    <button
      className={compact ? "icon-button" : "button-secondary"}
      type="button"
      title={label}
      onClick={handleCopy}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {!compact && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
