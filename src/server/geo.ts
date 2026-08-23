import { existsSync } from "node:fs";
import path from "node:path";
import maxmind, { type CountryResponse, type Reader } from "maxmind";

/**
 * Country lookup for first-visit language detection.
 *
 * Reads a local MaxMind GeoLite2-Country database rather than calling a
 * geo API or relying on a CDN header. The site is self-hosted behind nginx, so
 * there is no `CF-IPCountry` to read, and Next removed `NextRequest.geo` in
 * v15. A bundled database also has no third party that can be slow, rate-limit
 * us, or — the deciding factor for this site — be blocked in Turkmenistan, its
 * primary market.
 *
 * Deliberately NOT marked `server-only`: this is imported by src/proxy.ts,
 * which is neither a Server Component nor a client one.
 *
 * Everything here degrades to `null`, which the proxy reads as "no opinion" and
 * falls back to normal Accept-Language negotiation. A missing or corrupt
 * database must never take the site down over a language guess.
 */

const DB_PATH =
  process.env.GEOIP_DB_PATH?.trim() || "./data/GeoLite2-Country.mmdb";

/**
 * One reader for the process lifetime. `maxmind.open` memory-maps the file and
 * is far too expensive to repeat per request; the promise is cached so
 * concurrent first requests share a single open.
 *
 * `null` is a cached *negative*: once we know the database is absent we stop
 * hitting the filesystem on every request.
 */
let readerPromise: Promise<Reader<CountryResponse> | null> | null = null;

function openReader(): Promise<Reader<CountryResponse> | null> {
  if (readerPromise) return readerPromise;

  readerPromise = (async () => {
    // `turbopackIgnore` for the same reason as src/server/media.ts: this is a
    // runtime data path, not a module specifier, and without the hint the
    // bundler traces the whole project into the output.
    const absolute = path.resolve(/*turbopackIgnore: true*/ process.cwd(), DB_PATH);
    if (!existsSync(absolute)) {
      console.warn(
        `[geo] ${absolute} not found — language detection will fall back to Accept-Language. Run "npm run geoip:fetch".`,
      );
      return null;
    }
    try {
      return await maxmind.open<CountryResponse>(absolute);
    } catch (error) {
      console.error("[geo] could not open the GeoIP database:", error);
      return null;
    }
  })();

  return readerPromise;
}

/**
 * The client's IP, taken from the proxy headers nginx sets.
 *
 * `x-forwarded-for` is a comma-separated chain; the left-most entry is the
 * original client. It is trivially spoofable by the client — which is fine
 * here, because the worst an attacker achieves is choosing their own site
 * language. This value must never be used for anything that matters.
 */
function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || null;
}

/**
 * ISO-3166 alpha-2 country for a request, or null when unknown.
 *
 * Private and loopback addresses are not looked up: in development every
 * request comes from ::1, and asking the database about it only produces noise.
 */
export async function countryFromHeaders(
  headers: Headers,
): Promise<string | null> {
  // An explicit override, for local testing and for deployments that would
  // rather have nginx do the lookup with its own GeoIP2 module.
  const header = headers.get("x-country-code")?.trim();
  if (header && /^[A-Za-z]{2}$/.test(header)) return header.toUpperCase();

  const ip = clientIp(headers);
  if (!ip || isPrivate(ip)) return null;

  const reader = await openReader();
  if (!reader) return null;

  try {
    return reader.get(ip)?.country?.iso_code ?? null;
  } catch {
    // Malformed address — not worth a log line on every bot request.
    return null;
  }
}

function isPrivate(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    // Unique-local IPv6.
    ip.toLowerCase().startsWith("fc") ||
    ip.toLowerCase().startsWith("fd")
  );
}
