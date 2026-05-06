"use client";

import { create } from "zustand";
import {
  clearGuestPromptItems,
  createGuestPromptItem,
  deleteGuestPromptItem,
  getGuestPromptCount,
  getGuestPromptItems,
  updateGuestPromptItem
} from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { AppMode, PromptItem, PromptItemInput, SyncStatus } from "@/lib/types";

type PromptStoreState = {
  items: PromptItem[];
  mode: AppMode;
  syncStatus: SyncStatus;
  error: string;
  guestCount: number;
  hydrate: (userId?: string | null) => Promise<void>;
  refreshGuestCount: () => void;
  createItem: (input: PromptItemInput, userId?: string | null) => Promise<PromptItem>;
  updateItem: (id: string, input: PromptItemInput, userId?: string | null) => Promise<PromptItem>;
  deleteItem: (id: string, userId?: string | null) => Promise<void>;
  toggleFavorite: (item: PromptItem, userId?: string | null) => Promise<PromptItem>;
  togglePin: (item: PromptItem, userId?: string | null) => Promise<PromptItem>;
  recordUsage: (item: PromptItem, userId?: string | null) => Promise<PromptItem>;
  importGuestToCloud: () => Promise<number>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}

async function fetchCloudPrompts() {
  const response = await fetch("/api/prompts", { cache: "no-store" });
  const payload = await parseResponse<{ items: PromptItem[] }>(response);
  return payload.items;
}

function sortPromptItems(items: PromptItem[]) {
  return [...items].sort((left, right) => {
    if (left.pinned_at || right.pinned_at) {
      return Date.parse(right.pinned_at || "0") - Date.parse(left.pinned_at || "0");
    }

    return Date.parse(right.updated_at) - Date.parse(left.updated_at);
  });
}

async function createCloudPrompt(input: PromptItemInput) {
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await parseResponse<{ item: PromptItem }>(response);
  return payload.item;
}

async function updateCloudPrompt(id: string, input: PromptItemInput) {
  const response = await fetch(`/api/prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await parseResponse<{ item: PromptItem }>(response);
  return payload.item;
}

async function deleteCloudPrompt(id: string) {
  const response = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
  await parseResponse<{ ok: boolean }>(response);
}

async function toggleCloudFavorite(item: PromptItem) {
  const response = await fetch(`/api/prompts/${item.id}/favorite`, {
    method: item.is_favorite ? "DELETE" : "POST"
  });
  const payload = await parseResponse<{ item: PromptItem }>(response);
  return payload.item;
}

async function recordCloudUsage(item: PromptItem) {
  const response = await fetch(`/api/prompts/${item.id}/use`, { method: "POST" });
  const payload = await parseResponse<{ item: PromptItem }>(response);
  return payload.item;
}

async function toggleCloudPin(item: PromptItem) {
  const response = await fetch(`/api/prompts/${item.id}/pin`, {
    method: item.pinned_at ? "DELETE" : "POST"
  });
  const payload = await parseResponse<{ item: PromptItem }>(response);
  return payload.item;
}

export const usePromptStore = create<PromptStoreState>((set, get) => ({
  items: [],
  mode: "guest",
  syncStatus: "idle",
  error: "",
  guestCount: 0,

  async hydrate(userId) {
    set({ syncStatus: "loading", error: "", mode: userId ? "cloud" : "guest" });

    try {
      if (!userId) {
        const guestItems = getGuestPromptItems();
        const publicItems = isSupabaseConfigured() ? await fetchCloudPrompts() : [];
        const items = sortPromptItems([...guestItems, ...publicItems]);
        set({
          items,
          syncStatus: "synced",
          guestCount: guestItems.length,
          mode: "guest"
        });
        return;
      }

      const items = await fetchCloudPrompts();
      set({
        items,
        syncStatus: "synced",
        guestCount: getGuestPromptCount(),
        mode: "cloud"
      });
    } catch (error) {
      set({
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Could not load prompts"
      });
    }
  },

  refreshGuestCount() {
    set({ guestCount: getGuestPromptCount() });
  },

  async createItem(input, userId) {
    set({ syncStatus: "saving", error: "" });

    try {
      const item = userId ? await createCloudPrompt(input) : createGuestPromptItem(input);
      set({
        items: sortPromptItems([item, ...get().items]),
        syncStatus: "synced",
        mode: userId ? "cloud" : "guest",
        guestCount: getGuestPromptCount()
      });
      return item;
    } catch (error) {
      set({
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Could not create prompt"
      });
      throw error;
    }
  },

  async updateItem(id, input, userId) {
    set({ syncStatus: "saving", error: "" });

    try {
      const item = userId ? await updateCloudPrompt(id, input) : updateGuestPromptItem(id, input);
      set({
        items: sortPromptItems(get().items.map((current) => (current.id === id ? item : current))),
        syncStatus: "synced",
        guestCount: getGuestPromptCount()
      });
      return item;
    } catch (error) {
      set({
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Could not update prompt"
      });
      throw error;
    }
  },

  async deleteItem(id, userId) {
    set({ syncStatus: "saving", error: "" });

    try {
      if (userId) {
        await deleteCloudPrompt(id);
      } else {
        deleteGuestPromptItem(id);
      }

      set({
        items: get().items.filter((item) => item.id !== id),
        syncStatus: "synced",
        guestCount: getGuestPromptCount()
      });
    } catch (error) {
      set({
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Could not delete prompt"
      });
      throw error;
    }
  },

  async toggleFavorite(item, userId) {
    if (!userId) {
      return get().updateItem(item.id, { is_favorite: !item.is_favorite }, userId);
    }

    const updated = await toggleCloudFavorite(item);
    set({
      items: sortPromptItems(get().items.map((current) => (current.id === item.id ? updated : current))),
      syncStatus: "synced"
    });
    return updated;
  },

  async togglePin(item, userId) {
    if (item.user_id && item.user_id !== userId) {
      throw new Error("Only the owner can pin this prompt");
    }

    const updated = userId
      ? await toggleCloudPin(item)
      : updateGuestPromptItem(item.id, {
          pinned_at: item.pinned_at ? null : new Date().toISOString()
        });

    set({
      items: sortPromptItems(get().items.map((current) => (current.id === item.id ? updated : current))),
      syncStatus: "synced"
    });
    return updated;
  },

  async recordUsage(item, userId) {
    if (!userId && item.user_id) {
      throw new Error("Authentication required");
    }

    const updated = userId
      ? await recordCloudUsage(item)
      : updateGuestPromptItem(item.id, { usage_count: item.usage_count + 1 });

    set({
      items: sortPromptItems(get().items.map((current) => (current.id === item.id ? updated : current))),
      syncStatus: "synced"
    });
    return updated;
  },

  async importGuestToCloud() {
    const guestItems = getGuestPromptItems();

    if (!guestItems.length) {
      return 0;
    }

    set({ syncStatus: "saving", error: "" });

    try {
      for (const item of guestItems) {
        await createCloudPrompt({
          name: item.name,
          system_prompt: item.system_prompt,
          target_language: item.target_language,
          note: item.note,
          category: item.category,
          tags: item.tags,
          display: item.display,
          pinned_at: item.pinned_at,
          is_favorite: item.is_favorite
        });
      }

      clearGuestPromptItems();
      const cloudItems = await fetchCloudPrompts();
      set({
        items: cloudItems,
        guestCount: 0,
        mode: "cloud",
        syncStatus: "synced"
      });
      return guestItems.length;
    } catch (error) {
      set({
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Could not import guest prompts"
      });
      throw error;
    }
  }
}));
