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

async function getVisibleItem(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from("prompt_items").select("*").eq("id", id).single();

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
    const item = await getVisibleItem(supabase, id);
    const { error } = await supabase
      .from("user_favorites")
      .upsert(
        { user_id: user.id, prompt_item_id: id },
        { onConflict: "user_id,prompt_item_id", ignoreDuplicates: true }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({ item: { ...item, is_favorite: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not favorite prompt";
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
    const item = await getVisibleItem(supabase, id);
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("prompt_item_id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ item: { ...item, is_favorite: false } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not unfavorite prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
