import { NextResponse } from "next/server";
import { JSON_BODY_LIMIT_BYTES, guardRequest, safeErrorResponse } from "@/lib/api-security";
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

  const guard = guardRequest(request, "feedback:create", {
    limit: 5,
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

  const input = (await request.json().catch(() => ({}))) as FeedbackInput;
  const topic = VALID_TOPICS.has(input.topic || "") ? input.topic! : "Feedback";
  const message = input.message?.trim() || "";

  if (!message) {
    return badRequest("Feedback message is required");
  }

  if (message.length > 5000 || (input.subject?.length || 0) > 200 || (input.pageUrl?.length || 0) > 2000) {
    return badRequest("Feedback is too large");
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
    return safeErrorResponse("api.feedback.create", error, "Could not send feedback", 500);
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
