import { NextResponse } from "next/server";
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

  if (!payload.model?.trim()) {
    return "Model is required";
  }

  return null;
}

export async function POST(request: Request) {
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
    const message = error instanceof Error ? error.message : "Generation failed";
    return badRequest(message, 500);
  }
}
