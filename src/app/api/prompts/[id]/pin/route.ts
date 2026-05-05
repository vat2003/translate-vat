import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PromptItem } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type SupabaseClient = Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"];

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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

async function updatePin(
  supabase: SupabaseClient,
  userId: string,
  promptItemId: string,
  pinnedAt: string | null
) {
  const { data, error } = await supabase
    .from("prompt_items")
    .update({ pinned_at: pinnedAt })
    .eq("id", promptItemId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as PromptItem;
}

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const item = await updatePin(supabase, user.id, id, new Date().toISOString());
    return NextResponse.json({ item: await addFavoriteFlag(supabase, user.id, item) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not pin prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  try {
    const item = await updatePin(supabase, user.id, id, null);
    return NextResponse.json({ item: await addFavoriteFlag(supabase, user.id, item) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not unpin prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
