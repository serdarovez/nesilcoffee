import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { createSubmission } from "@/server/submissions";
import { pick } from "@/lib/i18n-field";

/**
 * Order requests from the product modal.
 *
 * These are B2B enquiries, not checkout: no prices, no stock, no payment. The
 * modal previously simulated success with a setTimeout and discarded the order
 * entirely — this endpoint is what makes it real.
 */
const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  comment: z.string().trim().max(5000).optional().or(z.literal("")),
  quantity: z.number().int().min(1).max(9999),
  productId: z.string().trim().max(40).optional(),
  productName: z.string().trim().min(1).max(200),
  locale: z.string().trim().max(5).optional(),
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

  // Trust the id, not the name: resolve the product server-side so the logged
  // name is the real one even if the client sent something else.
  let productId: string | null = null;
  let productName = data.productName;

  if (data.productId) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (product) {
      productId = product.id;
      productName = pick(product.name, data.locale ?? "ru", data.productName);
    }
  }

  const result = await createSubmission({
    type: "ORDER",
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    message: data.comment || null,
    productId,
    productName,
    quantity: data.quantity,
    locale: data.locale ?? "ru",
    honeypot: data.website,
    renderedAt: data.renderedAt,
  });

  if (!result.ok) {
    if (result.reason === "rate-limited") {
      return NextResponse.json(
        { error: "Слишком много заявок. Попробуйте позже." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
