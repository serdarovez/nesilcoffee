import "server-only";
import type { Submission } from "@prisma/client";

/**
 * WhatsApp Cloud API notifications.
 *
 * Behind WHATSAPP_ENABLED because Meta requires an approved message template
 * before a business can initiate a conversation, and approval takes about a
 * day. With the flag off, everything else works and this is a no-op — turning
 * it on later is an environment change, not a deploy.
 *
 * Business-initiated messages MUST use a template; free-form text is only
 * allowed inside a 24-hour window opened by the customer messaging first.
 * The template is expected to take positional body parameters:
 *
 *   1. what came in ("Заявка на товар" / "Сообщение с сайта")
 *   2. customer name
 *   3. contact details
 *   4. details (product and quantity, or the subject)
 */

const GRAPH_VERSION = "v21.0";

export function isWhatsappConfigured(): boolean {
  return (
    process.env.WHATSAPP_ENABLED === "true" &&
    Boolean(process.env.WHATSAPP_TOKEN) &&
    Boolean(process.env.WHATSAPP_PHONE_ID) &&
    Boolean(process.env.WHATSAPP_TO) &&
    Boolean(process.env.WHATSAPP_TEMPLATE)
  );
}

export type WhatsappResult = { sent: boolean; error?: string };

/** Template parameters reject newlines and runs of spaces, so flatten them. */
function clean(value: string, max = 200): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat || "—";
}

export async function sendWhatsappNotification(
  submission: Submission,
): Promise<WhatsappResult> {
  if (!isWhatsappConfigured()) {
    return { sent: false, error: "WhatsApp отключён" };
  }

  const isOrder = submission.type === "ORDER";
  const contact = [submission.phone, submission.email]
    .filter(Boolean)
    .join(" · ");
  const details = isOrder
    ? `${submission.productName ?? "—"}${submission.quantity ? ` × ${submission.quantity}` : ""}`
    : (submission.subject ?? "—");

  const params = [
    isOrder ? "Заявка на товар" : "Сообщение с сайта",
    clean(submission.name, 60),
    clean(contact, 80),
    clean(details, 120),
  ];

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;

  try {
    // Bounded so a hanging Meta request cannot stall the customer's response.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: process.env.WHATSAPP_TO,
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "ru" },
          components: [
            {
              type: "body",
              parameters: params.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const body = await res.text();
      const message = `WhatsApp ${res.status}: ${body.slice(0, 300)}`;
      console.error(message);
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("WhatsApp send failed:", message);
    return { sent: false, error: message };
  }
}
