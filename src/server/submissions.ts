import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { consumeRateLimit } from "@/server/rate-limit";
import { sendSubmissionEmail } from "@/server/notify/email";
import { sendWhatsappNotification } from "@/server/notify/whatsapp";
import type { Submission, SubmissionType } from "@prisma/client";

/**
 * Shared pipeline for the contact form and the order modal.
 *
 * The submission is written to Postgres BEFORE any notification is attempted,
 * so a bounced email or an expired WhatsApp token can never lose a lead — the
 * admin inbox is the system of record, and delivery is best-effort on top.
 */

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
/** Anything submitted faster than a human could read the form is a bot. */
const MIN_FILL_MS = 3000;

export type SubmissionInput = {
  type: SubmissionType;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  locale: string;
  /** Hidden field; only bots fill it. */
  honeypot?: string | null;
  /** Client timestamp of when the form was rendered. */
  renderedAt?: number | null;
};

export type SubmissionOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "rate-limited"; retryAfterSeconds: number }
  | { ok: false; reason: "invalid" };

export async function requestContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
  };
}

export async function createSubmission(
  input: SubmissionInput,
): Promise<SubmissionOutcome> {
  const { ip, userAgent } = await requestContext();

  const limit = await consumeRateLimit(
    `form:${ip ?? "unknown"}`,
    LIMIT,
    WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      ok: false,
      reason: "rate-limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  // Two silent bot signals. Both are STORED and flagged rather than dropped, so
  // a false positive is recoverable from the admin inbox instead of vanishing.
  const trippedHoneypot = Boolean(input.honeypot?.trim());
  const tooFast =
    typeof input.renderedAt === "number" &&
    Number.isFinite(input.renderedAt) &&
    Date.now() - input.renderedAt < MIN_FILL_MS;

  const isSpam = trippedHoneypot || tooFast;

  const submission = await prisma.submission.create({
    data: {
      type: input.type,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message ?? null,
      productId: input.productId ?? null,
      productName: input.productName ?? null,
      quantity: input.quantity ?? null,
      locale: input.locale,
      ip,
      userAgent,
      isSpam,
    },
  });

  // Suspected spam is recorded but never notified — the whole point is to keep
  // it out of the mailbox and off the phone.
  if (!isSpam) {
    await notify(submission);
  }

  return { ok: true, id: submission.id };
}

/**
 * Best-effort delivery. Email and WhatsApp are attempted independently so one
 * failing does not suppress the other, and the outcome is recorded on the row
 * for the admin inbox to display.
 */
export async function notify(submission: Submission): Promise<void> {
  const [email, whatsapp] = await Promise.all([
    sendSubmissionEmail(submission),
    sendWhatsappNotification(submission),
  ]);

  const errors = [
    email.sent ? null : email.error,
    whatsapp.sent ? null : whatsapp.error,
  ].filter(Boolean);

  await prisma.submission
    .update({
      where: { id: submission.id },
      data: {
        notifiedEmail: email.sent,
        notifiedWhatsapp: whatsapp.sent,
        notifyError: errors.length ? errors.join(" | ") : null,
      },
    })
    .catch(() => undefined);
}
