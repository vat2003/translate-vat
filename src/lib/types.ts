export const DEFAULT_MODEL = "gemini-1.5-flash";

export const DEFAULT_LANGUAGES = `pt: Portuguese (Bo Dao Nha)
nl: Dutch (Ha Lan)
ko: Korean (Han Quoc)
ru: Russian (Nga)
ja: Japanese (Nhat Ban)
fr: French (Phap)
sv: Swedish (Thuy Dien)
es: Spanish (Tay Ban Nha)
de: German (Duc)`;

export const DEFAULT_SYSTEM_PROMPT = `You are a professional YouTube metadata translator.
Translate the following TITLE, DESCRIPTION, and HASHTAGS into the specified TARGET LANGUAGES.

REQUIREMENTS (STRICT):
1. ACCURATE TRANSLATION & ZERO ENGLISH: Translate EVERYTHING, including terms like "DOG TV", "Dog Cartoon", or "TV for Dogs", into the natural equivalent of the target language. DO NOT leave these terms in English. The final title and description must be 100% in the target language.
2. PRESERVE STRUCTURE: Keep the EXACT original meaning, paragraph structure, and bullet points. DO NOT rewrite, summarize, or move information around (e.g., do not move footer info to the top). Translate sentence-by-sentence faithfully.
3. BRAND HASHTAGS ONLY: Translate descriptive hashtags (like #dogmusic) into the target language. ONLY keep specific channel/brand names IF they are formatted as hashtags (e.g., #ANS, #maxandmilotv). Format all as valid hashtags (no spaces).
4. COPYRIGHT & FOOTERS: If you encounter URLs, domain names, or copyright notices (e.g., "Copyright by...", "ansnetwork.org"), REMOVE THEM entirely from the output.
5. LENGTH: Title MUST be <= 100 characters. Description MUST be <= 5000 characters.
6. FORMAT: Return ONLY valid JSON format strictly matching the schema. Escape all newlines in the description with \\n to prevent JSON parsing errors. DO NOT output plain text.
7. COMPLETENESS: Include ALL target languages. DO NOT omit any core content.

TARGET LANGUAGES:
{{TARGET_LIST}}

OUTPUT FORMAT (STRICT):
{
{{OUTPUT_FORMAT}}
}

INPUT:
TITLE:
{{TITLE}}

DESCRIPTION:
{{DESC}}`;

export type AppMode = "guest" | "cloud";

export type SyncStatus = "idle" | "loading" | "saving" | "synced" | "error";

export type ThemeMode = "light" | "dark";

export type LanguageOption = {
  code: string;
  label: string;
};

export type GeneratedResult = {
  code: string;
  label: string;
  title: string;
  description: string;
};

export type PromptItem = {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  system_prompt: string;
  target_language: string;
  note: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type PromptItemInput = {
  title?: string;
  description?: string;
  system_prompt?: string;
  target_language?: string;
  note?: string;
  category?: string;
  tags?: string[];
  is_favorite?: boolean;
};

export type AppSettings = {
  model: string;
  languagesRaw: string;
  systemPrompt: string;
  selectedApiKeyId: string;
  theme: ThemeMode;
};

export type GeneratePayload = {
  apiKey: string;
  model: string;
  title: string;
  description: string;
  systemPrompt: string;
  targetLanguages: LanguageOption[];
};
