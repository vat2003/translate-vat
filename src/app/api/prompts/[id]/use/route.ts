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

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const guard = guardRequest(request, "prompts:use", {
    limit: 120,
    windowMs: 60_000
  });

  if (guard) {
    return guard;
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { data, error } = await supabase.rpc("increment_prompt_item_usage", {
    p_prompt_item_id: id
  });

  if (error) {
    return safeErrorResponse("api.prompts.use", error, "Prompt not found", 404);
  }

  const item = await addFavoriteFlag(supabase, user.id, data as PromptItem);

  return NextResponse.json({ item });
}
