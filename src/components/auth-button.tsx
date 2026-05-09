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
      <span className="status-pill">
        {user ? <Cloud size={15} /> : <HardDrive size={15} />}
        {user ? "Logged in" : "Guest mode"}
      </span>
      <span className={syncStatus === "error" ? "status-pill-danger" : "status-pill"}>
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
        <button className="button-secondary" type="button" disabled={!ready} onClick={signIn}>
          <LogIn size={16} />
          Google login
        </button>
      )}
    </div>
  );
}
