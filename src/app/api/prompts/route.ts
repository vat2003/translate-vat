import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags } from "@/lib/prompt-utils";
import type { PromptItemInput } from "@/lib/types";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function toPromptPayload(input: PromptItemInput, userId: string) {
  return {
    user_id: userId,
    title: input.title?.trim() || "Untitled prompt",
    description: input.description || "",
    system_prompt: input.system_prompt || "",
    target_language: input.target_language || "all",
    note: input.note || "",
    category: input.category || "",
    tags: normalizeTags(input.tags),
    is_favorite: Boolean(input.is_favorite)
  };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const search = request.nextUrl.searchParams.get("q")?.trim();
  let query = supabase
    .from("prompt_items")
    .select("*")
    .eq("user_id", user.id)
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false });

  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    query = query.or(`title.ilike.${term},note.ilike.${term},category.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const input = (await request.json()) as PromptItemInput;
  const { data, error } = await supabase
    .from("prompt_items")
    .insert(toPromptPayload(input, user.id))
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
