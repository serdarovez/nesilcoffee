import "server-only";
import { redirect } from "next/navigation";
import type { AdminUser, Role } from "@prisma/client";
import { getSessionUser } from "@/server/auth/session";

/**
 * Authorization guards.
 *
 * These are called from the admin layout AND from the top of every Server
 * Action. The layout alone is not sufficient: Next compiles each exported
 * Server Action into a directly reachable POST endpoint, so an action that
 * relies on its page having been guarded is callable without ever rendering
 * that page. The Next data-security guide is explicit about this — "treat
 * Server Actions as reachable via direct POST requests and verify
 * authentication and authorization inside each one".
 */

/** Require a signed-in admin, redirecting to the login page if absent. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Require a specific role. EDITOR-level users are rejected from ADMIN areas. */
export async function requireRole(role: Role): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/admin?forbidden=1");
  }
  return user;
}

/**
 * Guard for Route Handlers, which must answer with a status code rather than a
 * redirect. Returns null when unauthenticated so the caller can 401.
 */
export async function getApiUser(): Promise<AdminUser | null> {
  return getSessionUser();
}
