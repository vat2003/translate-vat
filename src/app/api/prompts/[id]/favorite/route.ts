import { NextResponse } from "next/server";
import { guardRequest, isUuid, safeErrorResponse } from "@/lib/api-security";
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

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const guard = guardRequest(request, "prompts:favorite", {
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
    return safeErrorResponse("api.prompts.favorite", error, "Could not favorite prompt", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const guard = guardRequest(request, "prompts:favorite", {
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
    return safeErrorResponse("api.prompts.unfavorite", error, "Could not unfavorite prompt", 500);
  }
}
