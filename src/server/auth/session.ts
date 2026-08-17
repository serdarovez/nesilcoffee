import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import type { AdminUser } from "@prisma/client";

export const SESSION_COOKIE = "nesil_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Slide the expiry forward once a session is more than half spent. */
const RENEW_AFTER_MS = SESSION_TTL_MS / 2;

/**
 * Sessions are opaque 256-bit random tokens. The cookie carries the raw token;
 * the database stores only its SHA-256, so a database leak cannot be replayed
 * as a live session.
 *
 * The token is not additionally signed: a signature would let us reject
 * malformed cookies without a database round trip, but it adds no security
 * here — an attacker cannot forge a token that exists in the sessions table,
 * and the lookup is a single indexed query. Hence no SESSION_SECRET.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionContext = {
  ip?: string | null;
  userAgent?: string | null;
};

/** Create a session row and return the raw token to hand to the browser. */
export async function createSession(
  userId: string,
  context: SessionContext = {},
): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    },
  });

  return token;
}

/**
 * Resolve the current session to its user, or null.
 *
 * Expired rows are deleted on encounter rather than merely ignored, which keeps
 * the table from growing without needing a scheduled cleanup job.
 */
export async function getSessionUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession
      .delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }

  // A deactivated account loses every existing session immediately, without
  // waiting for them to expire.
  if (!session.user.isActive) return null;

  if (session.expiresAt.getTime() - Date.now() < RENEW_AFTER_MS) {
    await prisma.adminSession
      .update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      })
      .catch(() => undefined);
  }

  return session.user;
}

/**
 * Attach the session cookie. Only callable from a Server Action or Route
 * Handler — Next cannot set cookies while rendering a Server Component.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** Delete the current session server-side and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

/** Revoke one session by id — used by the session list in the admin. */
export async function revokeSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: { id: sessionId, userId },
  });
}

/** Revoke every session for a user, e.g. after a password change. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { userId } });
}
