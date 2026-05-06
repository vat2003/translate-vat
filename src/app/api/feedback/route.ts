import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const VALID_TOPICS = new Set(["Feedback", "Suggestion", "Bug report"]);

type FeedbackInput = {
  topic?: string;
  subject?: string;
  message?: string;
  pageUrl?: string;
};

function unavailable() {
  return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const input = (await request.json().catch(() => ({}))) as FeedbackInput;
  const topic = VALID_TOPICS.has(input.topic || "") ? input.topic! : "Feedback";
  const message = input.message?.trim() || "";

  if (!message) {
    return badRequest("Feedback message is required");
  }

  const { data, error } = await supabase
    .from("feedback_items")
    .insert({
      user_id: user.id,
      user_email: user.email || "",
      topic,
      subject: input.subject?.trim() || "",
      message,
      page_url: input.pageUrl?.trim() || ""
    })
    .select("id,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
