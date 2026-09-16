import { cookies } from "next/headers";
import type { Customer, LoyaltyAccount } from "@ucp/core";
import { data } from "./data.ts";
import { randomToken, sign, verifySignature } from "./crypto.ts";

/**
 * Sessions.
 *
 * A signed, stateless token in an httpOnly cookie. Stateless keeps sign-in
 * cheap and horizontally scalable; the trade-off is that a token cannot be
 * revoked before it expires, which is why the lifetime is 30 days rather
 * than open-ended and why a `v` field is carried so a global invalidation
 * is possible by bumping it.
 *
 * The cookie is httpOnly (so XSS cannot read it), SameSite=Lax (so a
 * cross-site form post cannot ride it), and Secure in production.
 */

const SESSION_COOKIE = "ucp_session";
const CSRF_COOKIE = "ucp_csrf";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** Bump to invalidate every issued session at once. */
const TOKEN_VERSION = 1;

interface TokenPayload {
  sub: string;
  exp: number;
  v: number;
}

function encode(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if (!verifySignature(body, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<TokenPayload>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.v !== TOKEN_VERSION) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return { sub: payload.sub, exp: payload.exp, v: payload.v };
  } catch {
    return null;
  }
}

const secure = process.env.NODE_ENV === "production";

export async function createSession(customerId: string): Promise<void> {
  const store = await cookies();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;

  store.set(SESSION_COOKIE, encode({ sub: customerId, exp, v: TOKEN_VERSION }), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  // Double-submit CSRF token. Readable by JavaScript on purpose — the
  // client echoes it in a header, and an attacker on another origin can
  // neither read the cookie nor set the header.
  store.set(CSRF_COOKIE, randomToken(), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return decode(store.get(SESSION_COOKIE)?.value)?.sub ?? null;
}

export interface SessionContext {
  customer: Customer;
  loyalty: LoyaltyAccount | undefined;
}

/** Resolves the signed-in customer, or null. Never throws. */
export async function getSession(): Promise<SessionContext | null> {
  const customerId = await getCustomerId();
  if (!customerId) return null;

  const customer = await data.customers.getCustomer(customerId);
  if (!customer) return null;

  const loyalty = await data.loyalty.getAccount(customerId);
  // The password hash must never cross into a server component's payload,
  // where it would be serialised into the HTML.
  const { passwordHash: _omit, ...safe } = customer;
  return { customer: safe as Customer, loyalty };
}

/**
 * CSRF check for mutating requests.
 *
 * Verifies the header matches the cookie, and that the Origin (when the
 * browser sends one) matches the host. Both, because the double-submit
 * cookie alone is defeated by a subdomain-injection attack and the Origin
 * check alone is unavailable on some older clients.
 */
export async function verifyCsrf(request: Request): Promise<boolean> {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-ucp-csrf");

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const host = request.headers.get("host");
      if (host && new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }

  // Requests from signed-out visitors carry no CSRF cookie; those routes
  // are guarded by the Origin check above and by requiring a session.
  if (!cookieToken) return true;
  return Boolean(headerToken) && headerToken === cookieToken;
}

export { SESSION_COOKIE, CSRF_COOKIE };
