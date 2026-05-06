import { SYSTEM_PROMPT_REQUEST_TEMPLATE } from "@/lib/types";
import type { LanguageOption, PromptItem, PromptItemInput } from "@/lib/types";

const HIDDEN_PROMPT_SECTION_PATTERN =
  /(?:\r?\n)*TARGET LANGUAGES:\s*\r?\n\{\{TARGET_LIST\}\}[\s\S]*$/;

export function parseLanguages(raw: string): LanguageOption[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, ...labelParts] = line.split(":");
      return {
        code: code.trim(),
        label: labelParts.join(":").trim()
      };
    })
    .filter((item) => item.code.length > 0 && item.label.length > 0);
}

export function buildPrompt(
  template: string,
  title: string,
  description: string,
  targetLanguages: LanguageOption[]
) {
  const visiblePrompt = stripHiddenPromptSection(template);
  const targetList = targetLanguages.map((language) => language.code).join(", ");
  const outputFormat = targetLanguages
    .map((language) => `  "${language.code}": { "title": "...", "description": "..." }`)
    .join(",\n");

  return [visiblePrompt, SYSTEM_PROMPT_REQUEST_TEMPLATE]
    .filter(Boolean)
    .join("\n\n")
    .replaceAll("{{TARGET_LIST}}", targetList)
    .replaceAll("{{OUTPUT_FORMAT}}", outputFormat)
    .replaceAll("{{TITLE}}", title)
    .replaceAll("{{DESC}}", description);
}

export function stripHiddenPromptSection(value: string) {
  return value.replace(HIDDEN_PROMPT_SECTION_PATTERN, "").trim();
}

export function extractJsonText(value: string) {
  const withoutFence = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return withoutFence.slice(firstBrace, lastBrace + 1);
  }

  return withoutFence;
}

export function normalizeTags(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizePromptItem(input: PromptItemInput & Partial<PromptItem>): PromptItem {
  const now = new Date().toISOString();

  return {
    id: input.id || crypto.randomUUID(),
    user_id: input.user_id ?? null,
    name: input.name?.trim() || input.title?.trim() || "Untitled suggestion",
    system_prompt: stripHiddenPromptSection(input.system_prompt ?? ""),
    target_language: input.target_language ?? "all",
    note: input.note ?? "",
    category: input.category ?? "",
    tags: normalizeTags(input.tags),
    display: input.display ?? "private",
    usage_count: Number(input.usage_count ?? 0),
    pinned_at: input.pinned_at ?? null,
    is_favorite: Boolean(input.is_favorite),
    created_at: input.created_at || now,
    updated_at: input.updated_at || now
  };
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
