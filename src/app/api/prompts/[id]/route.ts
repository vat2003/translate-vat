import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags } from "@/lib/prompt-utils";
import type { PromptItemInput } from "@/lib/types";

export const runtime = "nodejs";

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

function toUpdatePayload(input: PromptItemInput) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (input.title !== undefined) payload.title = input.title.trim() || "Untitled prompt";
  if (input.description !== undefined) payload.description = input.description;
  if (input.system_prompt !== undefined) payload.system_prompt = input.system_prompt;
  if (input.target_language !== undefined) payload.target_language = input.target_language || "all";
  if (input.note !== undefined) payload.note = input.note;
  if (input.category !== undefined) payload.category = input.category;
  if (input.tags !== undefined) payload.tags = normalizeTags(input.tags);
  if (input.is_favorite !== undefined) payload.is_favorite = Boolean(input.is_favorite);

  return payload;
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
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ item: data });
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

  return NextResponse.json({ item: data });
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
