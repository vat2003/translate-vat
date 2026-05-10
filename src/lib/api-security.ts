import "server-only";

import { NextResponse } from "next/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RequestGuardOptions = RateLimitOptions & {
  maxBodyBytes?: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export const JSON_BODY_LIMIT_BYTES = 32 * 1024;
export const GENERATE_BODY_LIMIT_BYTES = 128 * 1024;

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function safeErrorResponse(
  context: string,
  error: unknown,
  message = "Request failed",
  status = 500
) {
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  return jsonError(message, status);
}

export function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  try {
    const parsed = new URL(value, "https://app.local");

    if (parsed.origin !== "https://app.local") {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}

function contentLengthAllowed(request: Request, maxBodyBytes?: number) {
  if (!maxBodyBytes) {
    return true;
  }

  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return true;
  }

  const size = Number(contentLength);
  return Number.isFinite(size) && size <= maxBodyBytes;
}

function rateLimitAllowed(request: Request, namespace: string, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${namespace}:${getClientIp(request)}`;
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function guardRequest(request: Request, namespace: string, options: RequestGuardOptions) {
  if (!sameOriginRequest(request)) {
    return jsonError("Invalid request origin", 403);
  }

  if (!contentLengthAllowed(request, options.maxBodyBytes)) {
    return jsonError("Request body is too large", 413);
  }

  const rateLimit = rateLimitAllowed(request, namespace, options);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  return null;
}
