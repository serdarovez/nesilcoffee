/**
 * Display helpers for contact details.
 *
 * Plain module, no `server-only`: these are pure string formatting, and the
 * header's mobile drawer is a client component that renders the same phone
 * numbers and social handles the footer does. They previously lived in
 * src/server/views.ts, which cannot be imported from the client at all — the
 * `server-only` package throws at build time — so keeping them there would
 * have forced the drawer to hard-code what it displays, which is exactly the
 * drift this is undoing.
 */

/** Turn a profile URL into an @handle for display. */
export function socialHandle(url: string): string {
  const last = url.replace(/\/+$/, "").split("/").pop() ?? "";
  return last.startsWith("@") ? last : `@${last}`;
}

/** Public URL for a stored Telegram handle. */
export function telegramHref(handle: string): string {
  return `https://t.me/${handle}`;
}

/** Display form of a WhatsApp number stored as bare digits. */
export function whatsappLabel(digits: string): string {
  return `+${digits}`;
}

/** Strip everything but digits so a display number becomes a tel: href. */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, "")}`;
}
