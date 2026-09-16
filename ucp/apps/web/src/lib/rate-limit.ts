/**
 * Fixed-window rate limiting.
 *
 * In-process and therefore per-instance: correct for a single node, and
 * explicitly the wrong shape for a horizontally scaled deployment, which
 * needs Redis or the edge platform's own limiter. The call sites do not
 * change when that happens — only this file does.
 *
 * It exists mainly to blunt credential stuffing against sign-in and abuse
 * of the prescription upload endpoint.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Stops the map growing without bound on a long-lived process. */
function sweep(now: number): void {
  if (windows.size < 5000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client identity.
 *
 * `x-forwarded-for` is trusted only because this app is expected to sit
 * behind a proxy that sets it; a direct-to-internet deployment must not
 * trust it, and would use the socket address instead.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

export function resetRateLimitsForTests(): void {
  windows.clear();
}
