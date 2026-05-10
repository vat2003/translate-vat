import { NextResponse, type NextRequest } from "next/server";
import { guardRequest, safeErrorResponse } from "@/lib/api-security";

export const runtime = "nodejs";

const QUALITY_FILES = {
  maxresdefault: "maxresdefault.jpg",
  sddefault: "sddefault.jpg",
  hqdefault: "hqdefault.jpg",
  mqdefault: "mqdefault.jpg",
  default: "default.jpg"
} as const;

type ThumbnailQuality = keyof typeof QUALITY_FILES;

function isVideoId(value: string) {
  return /^[a-zA-Z0-9_-]{11}$/.test(value);
}

function isThumbnailQuality(value: string): value is ThumbnailQuality {
  return value in QUALITY_FILES;
}

export async function GET(request: NextRequest) {
  const guard = guardRequest(request, "youtube-thumbnail", {
    limit: 180,
    windowMs: 60_000
  });

  if (guard) {
    return guard;
  }

  const videoId = request.nextUrl.searchParams.get("videoId") || "";
  const quality = request.nextUrl.searchParams.get("quality") || "";
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

  if (!isVideoId(videoId) || !isThumbnailQuality(quality)) {
    return NextResponse.json({ error: "Invalid thumbnail request" }, { status: 400 });
  }

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${QUALITY_FILES[quality]}`;

  try {
    const response = await fetch(thumbnailUrl, {
      cache: "force-cache",
      redirect: "error",
      next: {
        revalidate: 60 * 60 * 24
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
    }

    const bytes = await response.arrayBuffer();
    const headers = new Headers({
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "X-Content-Type-Options": "nosniff"
    });

    if (shouldDownload) {
      headers.set("Content-Disposition", `attachment; filename="youtube-${videoId}-${quality}.jpg"`);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    return new NextResponse(bytes, { headers });
  } catch (error) {
    return safeErrorResponse("api.youtube-thumbnail", error, "Thumbnail not found", 404);
  }
}
