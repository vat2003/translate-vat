import { NextResponse } from "next/server";
import { JSON_BODY_LIMIT_BYTES, guardRequest, isUuid, safeErrorResponse } from "@/lib/api-security";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags, stripHiddenPromptSection } from "@/lib/prompt-utils";
import type { PromptDisplay, PromptItem, PromptItemInput } from "@/lib/types";

export const runtime = "nodejs";

type SupabaseClient = Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function normalizeDisplay(value: PromptItemInput["display"]): PromptDisplay {
  return value === "public" ? "public" : "private";
}

function toUpdatePayload(input: PromptItemInput) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (input.name !== undefined || input.title !== undefined) {
    payload.name = input.name?.trim() || input.title?.trim() || "Untitled suggestion";
  }
  if (input.system_prompt !== undefined) payload.system_prompt = stripHiddenPromptSection(input.system_prompt);
  if (input.target_language !== undefined) payload.target_language = input.target_language || "all";
  if (input.note !== undefined) payload.note = input.note;
  if (input.category !== undefined) payload.category = input.category;
  if (input.tags !== undefined) payload.tags = normalizeTags(input.tags);
  if (input.display !== undefined) payload.display = normalizeDisplay(input.display);
  if (input.pinned_at !== undefined) payload.pinned_at = input.pinned_at;

  return payload;
}

async function addFavoriteFlag(supabase: SupabaseClient, userId: string, item: PromptItem) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("prompt_item_id")
    .eq("user_id", userId)
    .eq("prompt_item_id", item.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { ...item, is_favorite: Boolean(data) };
}

async function setFavorite(
  supabase: SupabaseClient,
  userId: string,
  promptItemId: string,
  isFavorite: boolean
) {
  const query = isFavorite
    ? supabase
        .from("user_favorites")
        .upsert(
          { user_id: userId, prompt_item_id: promptItemId },
          { onConflict: "user_id,prompt_item_id", ignoreDuplicates: true }
        )
    : supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("prompt_item_id", promptItemId);

  const { error } = await query;

  if (error) {
    throw error;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { data, error } = await supabase
    .from("prompt_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return safeErrorResponse("api.prompts.get", error, "Prompt not found", 404);
  }

  const item = await addFavoriteFlag(supabase, user.id, data as PromptItem);

  return NextResponse.json({ item });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const guard = guardRequest(request, "prompts:update", {
    limit: 60,
    windowMs: 60_000,
    maxBodyBytes: JSON_BODY_LIMIT_BYTES
  });

  if (guard) {
    return guard;
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  let input: PromptItemInput;

  try {
    input = (await request.json()) as PromptItemInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("prompt_items")
    .update(toUpdatePayload(input))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return safeErrorResponse("api.prompts.update", error, "Could not update prompt", 500);
  }

  if (input.is_favorite !== undefined) {
    await setFavorite(supabase, user.id, id, Boolean(input.is_favorite));
  }

  const item = await addFavoriteFlag(supabase, user.id, data as PromptItem);

  return NextResponse.json({ item });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const guard = guardRequest(request, "prompts:delete", {
    limit: 60,
    windowMs: 60_000
  });

  if (guard) {
    return guard;
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { error } = await supabase.from("prompt_items").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return safeErrorResponse("api.prompts.delete", error, "Could not delete prompt", 500);
  }

  return NextResponse.json({ ok: true });
}
