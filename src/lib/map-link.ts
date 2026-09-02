/**
 * Pull a map pin out of whatever an editor pasted.
 *
 * Google hands out several shapes depending on where you copied from — the
 * desktop address bar, the Share button, the mobile app, a "directions to"
 * link — and an editor should not have to know which one they have. Every
 * shape that carries coordinates is read here; the one that does not (the
 * maps.app.goo.gl shortener) has to be resolved over the network first, which
 * is why `parseMapLink` reports that case separately instead of failing.
 *
 * Plain module, no server-only: the admin form uses it to show a live preview
 * of the pin before saving, and the action uses it again to validate.
 */

export type MapPin = { lat: number; lng: number };

export type MapLinkResult =
  | { kind: "pin"; pin: MapPin }
  /** A shortener. Carries no coordinates; someone has to follow it. */
  | { kind: "short"; url: string }
  | { kind: "empty" }
  | { kind: "unrecognised" };

/** Latitude is ±90, longitude ±180 — anything else came from a bad match. */
function valid(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    // 0,0 is in the Atlantic and is what a failed parse tends to produce.
    !(lat === 0 && lng === 0)
  );
}

/**
 * Ordered because the shapes overlap: a place URL usually contains BOTH an
 * `@lat,lng` viewport centre and a `!3d…!4d…` pin, and they are not the same
 * point — the viewport is where the camera sits, the pin is the place itself.
 * The pin wins.
 */
const PATTERNS: RegExp[] = [
  // !3d<lat>!4d<lng> — the actual place, inside a /place/ URL's data blob.
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  // ?q=lat,lng or ?query=lat,lng or ?destination=lat,lng or ?ll=lat,lng
  /[?&](?:q|query|destination|ll|center|sll)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
  // @lat,lng,17z — the map viewport in a desktop URL.
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
];

/** Bare "37.848, 58.566" typed straight into the box. */
const BARE = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

export function parseMapLink(input: string | null | undefined): MapLinkResult {
  const text = (input ?? "").trim();
  if (!text) return { kind: "empty" };

  const bare = text.match(BARE);
  if (bare) {
    const lat = Number(bare[1]);
    const lng = Number(bare[2]);
    if (valid(lat, lng)) return { kind: "pin", pin: { lat, lng } };
  }

  for (const pattern of PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (valid(lat, lng)) return { kind: "pin", pin: { lat, lng } };
    }
  }

  // Every Google shortener host. These 302 to a URL that does carry the
  // coordinates, so the caller can resolve them; nothing can be read here.
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(text)) {
    return { kind: "short", url: text };
  }

  return { kind: "unrecognised" };
}

/** Embed URL for the contacts-page iframe, matching the head-office banner. */
export function mapEmbedUrl(pin: MapPin, zoom = 17, type = "h"): string {
  const params = new URLSearchParams({
    q: `${pin.lat},${pin.lng}`,
    z: String(zoom),
    t: type,
    output: "embed",
  });
  return `https://www.google.com/maps?${params}`;
}

/** "Open in Maps" / directions, which opens the native app on a phone. */
export function mapDirectionsUrl(pin: MapPin): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${pin.lat},${pin.lng}`,
  )}`;
}
