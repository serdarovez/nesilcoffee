/**
 * Helpers for the sanitized-HTML fields (FAQ answers, expert quotes).
 *
 * Plain module, no `server-only`: the admin list renders on the server and the
 * editor's "is this language filled" badge runs on the client, and both need
 * the same answer to "does this markup contain any actual words".
 *
 * Sanitizing happens on the way *in* — see `sanitizeRichText` in
 * src/server/form.ts. Nothing here is a security boundary.
 */

const TAG = /<[^>]*>/g;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * Readable text from stored markup, for list previews and filled-state checks.
 *
 * A regex is the right tool here precisely because this is *not* sanitization:
 * the input is already an allowlisted subset of HTML, and the output is only
 * ever rendered as a text node. Block tags become spaces so `<p>a</p><p>b</p>`
 * reads as "a b" rather than "ab".
 */
export function plainText(html: string): string {
  return html
    .replace(/<\/(p|li|ul|ol)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(TAG, "")
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the markup carries no words — an empty editor is `<p></p>`. */
export function isBlankRichText(html: string): boolean {
  return plainText(html).length === 0;
}
