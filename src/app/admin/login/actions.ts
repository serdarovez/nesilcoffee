"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyPassword, fakeVerify } from "@/server/auth/password";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { consumeRateLimit, clearRateLimit } from "@/server/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Read the caller's address. nginx is configured to pass X-Forwarded-For, and
 * the leftmost entry is the original client. Falls back to the direct
 * connection header when running without a proxy.
 */
async function clientContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent") };
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // One deliberately vague message for every failure mode below, so the form
  // never reveals whether an email is registered.
  const invalid: LoginState = { error: "Неверный e-mail или пароль" };

  if (!parsed.success) return invalid;
  const { email, password } = parsed.data;

  const { ip, userAgent } = await clientContext();

  // Two independent limits: one stops a single address spraying many accounts,
  // the other stops a botnet converging on one account from many addresses.
  const byIp = await consumeRateLimit(`login:ip:${ip ?? "unknown"}`, LIMIT, WINDOW_MS);
  const byEmail = await consumeRateLimit(`login:email:${email}`, LIMIT, WINDOW_MS);

  if (!byIp.ok || !byEmail.ok) {
    const wait = Math.ceil(
      Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60,
    );
    return {
      error: `Слишком много попыток входа. Попробуйте через ${wait} мин.`,
    };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    // Spend comparable CPU so a missing account is not measurably faster.
    await fakeVerify();
    return invalid;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return invalid;

  await clearRateLimit(`login:ip:${ip ?? "unknown"}`);
  await clearRateLimit(`login:email:${email}`);

  const token = await createSession(user.id, { ip, userAgent });
  await setSessionCookie(token);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Outside any try/catch: redirect() signals by throwing, and catching it
  // here would silently turn a successful login into a no-op.
  redirect("/admin");
}
