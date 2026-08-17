"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/server/auth/session";

/**
 * Sign out: delete the session row so the token is dead server-side, then clear
 * the cookie. Removing only the cookie would leave a still-valid session in the
 * database that anyone holding the token could keep using.
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
