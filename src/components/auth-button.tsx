"use client";

import type { User } from "@supabase/supabase-js";
import { Cloud, HardDrive, LogIn, LogOut, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SyncStatus } from "@/lib/types";

type AuthButtonProps = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  syncStatus: SyncStatus;
  guestCount: number;
  onImportGuest: () => Promise<void>;
  onNotice: (message: string) => void;
};

function syncLabel(status: SyncStatus) {
  if (status === "loading") return "Loading";
  if (status === "saving") return "Syncing";
  if (status === "error") return "Sync error";
  if (status === "synced") return "Synced";
  return "Idle";
}

export function AuthButton({
  user,
  ready,
  configured,
  syncStatus,
  guestCount,
  onImportGuest,
  onNotice
}: AuthButtonProps) {
  async function signIn() {
    if (!configured) {
      onNotice("Supabase is not configured. Guest mode is active.");
      return;
    }

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });

    if (error) {
      onNotice(error.message);
    }
  }

  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      onNotice(error.message);
      return;
    }

    onNotice("Logged out");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {user ? <Cloud size={15} /> : <HardDrive size={15} />}
        {user ? "Logged in" : "Guest mode"}
      </span>
      <span className="inline-flex h-9 items-center rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        {syncLabel(syncStatus)}
      </span>
      {user && guestCount > 0 && (
        <button className="button-secondary" type="button" onClick={onImportGuest}>
          <UploadCloud size={16} />
          Import guest ({guestCount})
        </button>
      )}
      {user ? (
        <button className="button-secondary" type="button" onClick={signOut}>
          <LogOut size={16} />
          Logout
        </button>
      ) : (
        <button className="button-primary" type="button" disabled={!ready} onClick={signIn}>
          <LogIn size={16} />
          Google login
        </button>
      )}
    </div>
  );
}
