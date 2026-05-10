import { NextResponse, type NextRequest } from "next/server";
import { JSON_BODY_LIMIT_BYTES, guardRequest, safeErrorResponse } from "@/lib/api-security";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTags, stripHiddenPromptSection } from "@/lib/prompt-utils";
import type { PromptDisplay, PromptItem, PromptItemInput } from "@/lib/types";

export const runtime = "nodejs";

type SupabaseClient = Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"];

function normalizeDisplay(value: PromptItemInput["display"]): PromptDisplay {
  return value === "public" ? "public" : "private";
}

function normalizeSearchTerm(value: string) {
  return value
    .slice(0, 80)
    .replace(/[(),]/g, " ")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
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
    system_prompt: stripHiddenPromptSection(input.system_prompt || ""),
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

  const guard = guardRequest(request, "prompts:list", {
    limit: 120,
    windowMs: 60_000
  });

  if (guard) {
    return guard;
  }

  const { supabase, user } = await getAuthenticatedUser();

  const search = request.nextUrl.searchParams.get("q")?.trim();
  const favoritesOnly = request.nextUrl.searchParams.get("favorites") === "1";
  let query = supabase
    .from("prompt_items")
    .select("*")
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  query = user ? query.or(`display.eq.public,user_id.eq.${user.id}`) : query.eq("display", "public");

  if (favoritesOnly) {
    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const favoriteIds = await getFavoriteIds(supabase, user.id);

    if (!favoriteIds.length) {
      return NextResponse.json({ items: [] });
    }

    query = query.in("id", favoriteIds);
  }

  if (search) {
    const term = `%${normalizeSearchTerm(search)}%`;
    query = query.or(`name.ilike.${term},note.ilike.${term},category.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    return safeErrorResponse("api.prompts.list", error, "Could not load prompts", 500);
  }

  const items = user
    ? await addFavoriteFlags(supabase, user.id, (data || []) as PromptItem[])
    : ((data || []) as PromptItem[]).map((item) => ({ ...item, is_favorite: false }));

  return NextResponse.json({
    items
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const guard = guardRequest(request, "prompts:create", {
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
    .insert(toPromptPayload(input, user.id))
    .select("*")
    .single();

  if (error) {
    return safeErrorResponse("api.prompts.create", error, "Could not create prompt", 500);
  }

  if (input.is_favorite) {
    await setFavorite(supabase, user.id, data.id);
  }

  const [item] = await addFavoriteFlags(supabase, user.id, [data as PromptItem]);

  return NextResponse.json({ item }, { status: 201 });
}
