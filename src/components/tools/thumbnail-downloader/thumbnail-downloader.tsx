"use client";

import { Download, Image as ImageIcon, Link, Search, X } from "lucide-react";
import NextImage from "next/image";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type ThumbnailQuality = {
  id: string;
  label: string;
  size: string;
};

const THUMBNAIL_QUALITIES: ThumbnailQuality[] = [
  { id: "maxresdefault", label: "HD", size: "1280x720" },
  { id: "sddefault", label: "SD", size: "640x480" },
  { id: "hqdefault", label: "High", size: "480x360" },
  { id: "mqdefault", label: "Medium", size: "320x180" },
  { id: "default", label: "Default", size: "120x90" }
];

function extractVideoId(value: string) {
  const input = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const watchId = url.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const routeIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));

      if (routeIndex >= 0) {
        return parts[routeIndex + 1] || "";
      }
    }
  } catch {
    const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || "";
  }

  return "";
}

function isValidVideoId(videoId: string) {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

function thumbnailUrl(videoId: string, quality: string, download = false) {
  const params = new URLSearchParams({
    videoId,
    quality
  });

  if (download) {
    params.set("download", "1");
  }

  return `/api/youtube-thumbnail?${params.toString()}`;
}

export function ThumbnailDownloader() {
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState("");
  const [selectedQuality, setSelectedQuality] = useState(THUMBNAIL_QUALITIES[0].id);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const selectedOption = useMemo(
    () => THUMBNAIL_QUALITIES.find((quality) => quality.id === selectedQuality) ?? THUMBNAIL_QUALITIES[0],
    [selectedQuality]
  );
  const previewUrl = videoId ? thumbnailUrl(videoId, selectedQuality) : "";
  const downloadUrl = videoId ? thumbnailUrl(videoId, selectedQuality, true) : "";

  useEffect(() => {
    setImageError(false);
  }, [selectedQuality, videoId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextVideoId = extractVideoId(input);

    if (!isValidVideoId(nextVideoId)) {
      setVideoId("");
      setError("Enter a valid YouTube URL or video ID.");
      return;
    }

    setVideoId(nextVideoId);
    setError("");
  }

  function clearInput() {
    setInput("");
    setVideoId("");
    setError("");
    setImageError(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-elevated)] p-4 shadow-panel">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <label className="field-label" htmlFor="thumbnail-url">
                YouTube Link
              </label>
              <div className="relative">
                <Link
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                  size={16}
                />
                <input
                  id="thumbnail-url"
                  className="input-field pr-10 pl-10"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {input && (
                  <button
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-subtle)] transition hover:bg-[var(--panel-hover)] hover:text-[var(--text-primary)]"
                    type="button"
                    title="Clear"
                    onClick={clearInput}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {error && <p className="mt-2 text-sm font-medium text-[var(--danger-text)]">{error}</p>}
            </div>

            <div className="flex items-end">
              <button className="button-primary h-11 w-full lg:w-auto" type="submit">
                <Search size={16} />
                Load thumbnail
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-muted)] bg-[var(--panel-muted)] p-1">
            {THUMBNAIL_QUALITIES.map((quality) => (
              <button
                key={quality.id}
                className={`min-w-fit rounded-md px-3 py-2 text-sm font-semibold transition ${
                  selectedQuality === quality.id
                    ? "bg-[var(--panel-elevated)] text-[var(--primary-text)] shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-primary)]"
                }`}
                type="button"
                onClick={() => setSelectedQuality(quality.id)}
              >
                {quality.label}
                <span className="ml-1 text-xs font-medium text-[var(--text-subtle)]">{quality.size}</span>
              </button>
            ))}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-elevated)] p-4 shadow-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Preview</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {videoId
                ? `${selectedOption.label} thumbnail - ${selectedOption.size}`
                : "Paste a YouTube link to preview available thumbnail sizes."}
            </p>
          </div>

          {videoId && (
            <a className="button-primary h-10" href={downloadUrl}>
              <Download size={16} />
              Download Image
            </a>
          )}
        </div>

        {videoId ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border-muted)] bg-[var(--panel-muted)]">
            {imageError ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center text-sm text-[var(--text-muted)]">
                <ImageIcon className="mb-3 text-[var(--text-subtle)]" size={42} />
                <strong className="mb-1 text-[var(--text-primary)]">Thumbnail not available</strong>
                <span>Try another quality for this video.</span>
              </div>
            ) : (
              <NextImage
                key={`${videoId}-${selectedQuality}`}
                src={previewUrl}
                alt={`${selectedOption.label} YouTube thumbnail`}
                width={1280}
                height={720}
                unoptimized
                className="block max-h-[72vh] w-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--panel-bg)] p-8 text-center text-sm text-[var(--text-muted)]">
            <ImageIcon className="mb-4 text-[var(--primary-text)]" size={48} />
            <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Ready to fetch</h3>
            <p>Enter a YouTube link, then click Load thumbnail.</p>
          </div>
        )}
      </section>
    </div>
  );
}
