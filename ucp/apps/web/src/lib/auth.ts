import { DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD } from "@ucp/data";
import type { Customer } from "@ucp/core";
import { data } from "./data.ts";
import { hashPassword, verifyPassword } from "./crypto.ts";

/**
 * Credential verification.
 *
 * Password hashes live in the customer store, not in the repository. The
 * demo account's hash is derived once at first use from a password that is
 * printed on the sign-in screen — it is sample data, not a secret, and
 * generating it at runtime keeps a committed hash out of the codebase
 * where it could be mistaken for a real one.
 */

const hashes = new Map<string, string>();
let seeded: Promise<void> | null = null;

async function seedDemoCredentials(): Promise<void> {
  seeded ??= (async () => {
    hashes.set(DEMO_CUSTOMER_EMAIL.toLowerCase(), await hashPassword(DEMO_CUSTOMER_PASSWORD));
  })();
  return seeded;
}

export interface AuthResult {
  ok: boolean;
  customer?: Customer;
}

/**
 * Verifies an email and password.
 *
 * Runs the password derivation whether or not the account exists, so the
 * response time does not reveal which emails are registered. The failure
 * message is identical in both cases for the same reason.
 */
export async function verifyCredentials(email: string, password: string): Promise<AuthResult> {
  await seedDemoCredentials();

  const normalised = email.trim().toLowerCase();
  const customer = await data.customers.getCustomerByEmail(normalised);
  const stored = hashes.get(normalised) ?? customer?.passwordHash;

  const valid = await verifyPassword(password, stored);
  if (!valid || !customer) return { ok: false };

  const { passwordHash: _omit, ...safe } = customer;
  return { ok: true, customer: safe as Customer };
}

export async function registerCredentials(email: string, password: string): Promise<void> {
  hashes.set(email.trim().toLowerCase(), await hashPassword(password));
}

/** Basic strength floor. Length carries far more weight than composition. */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 10) problems.push("too_short");
  if (/^\d+$/.test(password)) problems.push("digits_only");
  if (/^(.)\1+$/.test(password)) problems.push("repeated");
  return problems;
}

export function isValidEmail(value: string): boolean {
  // Deliberately permissive: over-strict email regexes reject valid
  // addresses, and the real check is whether mail to it is delivered.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Saudi mobile numbers, in the formats customers actually type. */
export function normaliseSaudiPhone(value: string): string | null {
  const digits = value.replace(/[\s()\-]/g, "");
  const match = /^(?:\+966|00966|966|0)?(5\d{8})$/.exec(digits);
  return match ? `+966${match[1]}` : null;
}
