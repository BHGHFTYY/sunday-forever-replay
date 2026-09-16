import { NextResponse } from "next/server";

/**
 * Shared API response helpers.
 *
 * One error shape across every route, so the client never has to guess how
 * a failure is expressed. Internal error text never reaches the response —
 * the code is stable and machine-readable, and the message the customer
 * sees is chosen client-side from the dictionary in their own language.
 */

export type ApiErrorCode =
  | "bad_request"
  | "unauthorised"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "csrf"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "server_error";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorised: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  csrf: 403,
  server_error: 500,
};

export function apiError(
  code: ApiErrorCode,
  details?: Record<string, unknown>,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json({ error: code, ...details }, { status: STATUS[code], headers });
}

export function apiOk<T>(body: T, headers?: HeadersInit): NextResponse {
  return NextResponse.json(body, { headers });
}

/** Parses a JSON body, capped so a huge payload cannot exhaust memory. */
export async function readJson<T>(request: Request, maxBytes = 64 * 1024): Promise<T | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;

  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Coerces an untrusted value into a bounded positive integer. */
export function toBoundedInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}
