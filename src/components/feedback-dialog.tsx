"use client";

import type { User } from "@supabase/supabase-js";
import { MessageSquare, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

type FeedbackDialogProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onNotice: (message: string) => void;
};

export function FeedbackDialog({ open, user, onClose, onNotice }: FeedbackDialogProps) {
  const [topic, setTopic] = useState("Feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTopic("Feedback");
    setSubject("");
    setMessage("");
    setSending(false);
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!user) {
      onNotice("Log in to send feedback");
      return;
    }

    if (!message.trim()) {
      onNotice("Feedback message is required");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          message,
          pageUrl: window.location.href
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not send feedback");
      }

      onNotice("Feedback sent");
      onClose();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not send feedback");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
        role="dialog"
        aria-modal="true"
        aria-label="Feedback"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare size={18} />
            Feedback
          </div>
          <button className="icon-button" type="button" title="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
            <div>
              <label className="field-label" htmlFor="feedback-topic">
                Topic
              </label>
              <select
                id="feedback-topic"
                className="input-field"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value="Feedback">Feedback</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Bug report">Bug report</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="feedback-subject">
                Subject
              </label>
              <input
                id="feedback-subject"
                className="input-field"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="feedback-message">
              Message
            </label>
            <textarea
              id="feedback-message"
              className="input-field min-h-44"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share feedback, suggestions, or bugs you noticed"
            />
            <p className="field-hint">
              Feedback is saved to Supabase with your account email for follow-up.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <button className="button-secondary" type="button" disabled={sending} onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" type="button" disabled={sending} onClick={handleSubmit}>
            <Send size={16} />
            {sending ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
