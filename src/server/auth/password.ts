import "server-only";
import { hash, verify, type Algorithm } from "@node-rs/argon2";

/**
 * `Algorithm` is an ambient const enum, which `isolatedModules` forbids reading
 * at runtime, so the value is pinned numerically. Argon2id is also the library
 * default, but stating it explicitly means an upstream default change cannot
 * silently move us onto a weaker variant.
 */
const ARGON2ID = 2 as Algorithm;

/**
 * Argon2id parameters following the OWASP Password Storage Cheat Sheet's
 * recommended configuration (19 MiB memory, 2 iterations, 1 degree of
 * parallelism). Memory cost is the primary defence against GPU cracking.
 *
 * These values are baked into the encoded hash string, so raising them later
 * does not invalidate existing hashes — `verify` reads the parameters from the
 * stored hash itself.
 */
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

/**
 * Verify a password against a stored hash. Returns false rather than throwing
 * on a malformed hash, so a corrupted row denies access instead of surfacing a
 * 500 that distinguishes it from a wrong password.
 */
export async function verifyPassword(
  storedHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}

/**
 * Burn roughly the same CPU as a real verification when the account does not
 * exist, so response timing does not reveal which emails are registered.
 */
export async function fakeVerify(): Promise<void> {
  await hash("timing-equalisation-placeholder", OPTIONS);
}
