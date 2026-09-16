import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing and token signing.
 *
 * scrypt from Node's own crypto rather than bcrypt or argon2 from npm:
 * it is memory-hard, it is in the standard library, and it removes a
 * native dependency from the deployment. Parameters are stored inside the
 * hash string so they can be raised later without invalidating existing
 * passwords — a hash written with old parameters still verifies, and can
 * be transparently upgraded on next sign-in.
 */

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_PARAMS);
  const { N, r, p } = SCRYPT_PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/**
 * Verifies a password.
 *
 * Always runs the full derivation, even when the stored hash is malformed
 * or absent, so the time taken cannot be used to discover whether an
 * account exists. The comparison itself is constant-time.
 */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const parts = (stored ?? "").split("$");
  const usable = parts.length === 6 && parts[0] === "scrypt";

  const N = usable ? Number(parts[1]) : SCRYPT_PARAMS.N;
  const r = usable ? Number(parts[2]) : SCRYPT_PARAMS.r;
  const p = usable ? Number(parts[3]) : SCRYPT_PARAMS.p;
  const salt = usable ? Buffer.from(parts[4] as string, "base64url") : randomBytes(16);
  const expected = usable ? Buffer.from(parts[5] as string, "base64url") : randomBytes(KEY_LENGTH);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N, r, p, maxmem: SCRYPT_PARAMS.maxmem,
  });

  const match = derived.length === expected.length && timingSafeEqual(derived, expected);
  return usable && match;
}

/**
 * The signing secret.
 *
 * In production this must come from the environment. Falling back to a
 * per-process random value in development is deliberate: it means a
 * missing secret logs everyone out on restart rather than silently
 * signing tokens with a value an attacker could read in the repository.
 */
let developmentSecret: string | null = null;

export function signingSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters in production.",
    );
  }

  developmentSecret ??= randomBytes(32).toString("hex");
  return developmentSecret;
}

export function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

/** Constant-time signature check. */
export function verifySignature(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
