import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags } from "@/lib/prompt-utils";
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
  if (input.system_prompt !== undefined) payload.system_prompt = input.system_prompt;
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
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const item = await addFavoriteFlag(supabase, user.id, data as PromptItem);

  return NextResponse.json({ item });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const input = (await request.json()) as PromptItemInput;
  const { data, error } = await supabase
    .from("prompt_items")
    .update(toUpdatePayload(input))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (input.is_favorite !== undefined) {
    await setFavorite(supabase, user.id, id, Boolean(input.is_favorite));
  }

  const item = await addFavoriteFlag(supabase, user.id, data as PromptItem);

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { error } = await supabase.from("prompt_items").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
