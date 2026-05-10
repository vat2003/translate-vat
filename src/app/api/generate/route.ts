import { NextResponse } from "next/server";
import { GENERATE_BODY_LIMIT_BYTES, guardRequest, safeErrorResponse } from "@/lib/api-security";
import { buildPrompt, extractJsonText } from "@/lib/prompt-utils";
import type { GeneratePayload, GeneratedResult } from "@/lib/types";

export const runtime = "nodejs";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const SUPPORTED_GEMINI_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-3-flash-preview"
]);

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validatePayload(payload: Partial<GeneratePayload>) {
  if (!payload.apiKey?.trim()) {
    return "Missing API key";
  }

  if (!payload.title?.trim() || !payload.description?.trim()) {
    return "Title and description are required";
  }

  if (!payload.systemPrompt?.trim()) {
    return "System prompt is required";
  }

  if (!payload.targetLanguages?.length) {
    return "Select at least one target language";
  }

  if (payload.targetLanguages.length > 50) {
    return "Too many target languages";
  }

  if (!payload.model?.trim()) {
    return "Model is required";
  }

  if (!SUPPORTED_GEMINI_MODELS.has(payload.model.trim())) {
    return "Unsupported model";
  }

  if (payload.title.length > 500 || payload.description.length > 30000 || payload.systemPrompt.length > 30000) {
    return "Request body is too large";
  }

  return null;
}

export async function POST(request: Request) {
  const guard = guardRequest(request, "generate", {
    limit: 20,
    windowMs: 60_000,
    maxBodyBytes: GENERATE_BODY_LIMIT_BYTES
  });

  if (guard) {
    return guard;
  }

  let payload: GeneratePayload;

  try {
    payload = (await request.json()) as GeneratePayload;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return badRequest(validationError);
  }

  const apiKey = payload.apiKey.trim();
  const model = payload.model.trim();
  const finalPrompt = buildPrompt(
    payload.systemPrompt,
    payload.title.trim(),
    payload.description.trim(),
    payload.targetLanguages
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
      cache: "no-store"
    });

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      return badRequest(data.error?.message || "Gemini API request failed", response.status);
    }

    const outputText = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!outputText) {
      return badRequest("Gemini returned an empty response", 502);
    }

    const parsed = JSON.parse(extractJsonText(outputText)) as Record<
      string,
      { title?: string; description?: string }
    >;

    const results: GeneratedResult[] = payload.targetLanguages
      .map((language) => ({
        code: language.code,
        label: language.label,
        title: String(parsed[language.code]?.title || ""),
        description: String(parsed[language.code]?.description || "")
      }))
      .filter((item) => item.title || item.description);

    if (!results.length) {
      return badRequest("The model response did not match the requested language schema", 502);
    }

    return NextResponse.json({ results });
  } catch (error) {
    return safeErrorResponse("api.generate", error, "Generation failed", 500);
  }
}
