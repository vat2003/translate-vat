import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags } from "@/lib/prompt-utils";
import type { PromptDisplay, PromptItem, PromptItemInput } from "@/lib/types";

export const runtime = "nodejs";

type SupabaseClient = Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"];

function normalizeDisplay(value: PromptItemInput["display"]): PromptDisplay {
  return value === "public" ? "public" : "private";
}

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function toPromptPayload(input: PromptItemInput, userId: string) {
  return {
    user_id: userId,
    name: input.name?.trim() || input.title?.trim() || "Untitled suggestion",
    system_prompt: input.system_prompt || "",
    target_language: input.target_language || "all",
    note: input.note || "",
    category: input.category || "",
    tags: normalizeTags(input.tags),
    display: normalizeDisplay(input.display),
    pinned_at: input.pinned_at ?? null
  };
}

async function addFavoriteFlags(supabase: SupabaseClient, userId: string, items: PromptItem[]) {
  if (!items.length) {
    return items;
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select("prompt_item_id")
    .eq("user_id", userId)
    .in(
      "prompt_item_id",
      items.map((item) => item.id)
    );

  if (error) {
    throw error;
  }

  const favoriteIds = new Set((data || []).map((item) => item.prompt_item_id));
  return items.map((item) => ({ ...item, is_favorite: favoriteIds.has(item.id) }));
}

async function getFavoriteIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("prompt_item_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data || []).map((item) => item.prompt_item_id);
}

async function setFavorite(supabase: SupabaseClient, userId: string, promptItemId: string) {
  const { error } = await supabase
    .from("user_favorites")
    .upsert({ user_id: userId, prompt_item_id: promptItemId }, { onConflict: "user_id,prompt_item_id" });

  if (error) {
    throw error;
  }
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
  const favoritesOnly = request.nextUrl.searchParams.get("favorites") === "1";
  let query = supabase
    .from("prompt_items")
    .select("*")
    .or(`display.eq.public,user_id.eq.${user.id}`)
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (favoritesOnly) {
    const favoriteIds = await getFavoriteIds(supabase, user.id);

    if (!favoriteIds.length) {
      return NextResponse.json({ items: [] });
    }

    query = query.in("id", favoriteIds);
  }

  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    query = query.or(`name.ilike.${term},note.ilike.${term},category.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = await addFavoriteFlags(supabase, user.id, (data || []) as PromptItem[]);

  return NextResponse.json({
    items
  });
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

  if (input.is_favorite) {
    await setFavorite(supabase, user.id, data.id);
  }

  const [item] = await addFavoriteFlags(supabase, user.id, [data as PromptItem]);

  return NextResponse.json({ item }, { status: 201 });
}
