import { NextResponse } from "next/server";
import { z } from "zod";
import { createSubmission } from "@/server/submissions";

/**
 * Contact form.
 *
 * Rewritten from the original fire-and-forget Resend call: submissions are now
 * persisted first and notified second, so a delivery failure no longer loses
 * the enquiry.
 */
const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  locale: z.string().trim().max(5).optional(),
  /** Which button the visitor pressed; defaults to the plain form submit. */
  channel: z.enum(["FORM", "WHATSAPP", "EMAIL"]).optional(),
  // Spam guards — absent for legitimate no-JS submissions, which is fine.
  website: z.string().optional(),
  renderedAt: z.number().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  const result = await createSubmission({
    type: "CONTACT",
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    locale: data.locale ?? "ru",
    channel: data.channel ?? "FORM",
    honeypot: data.website,
    renderedAt: data.renderedAt,
  });

  if (!result.ok) {
    if (result.reason === "rate-limited") {
      return NextResponse.json(
        { error: "Слишком много обращений. Попробуйте позже." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Bot submissions get the same success response as everyone else — telling a
  // bot it was detected only helps it adapt.
  return NextResponse.json({ ok: true });
}
