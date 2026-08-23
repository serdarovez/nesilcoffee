/**
 * Download the MaxMind GeoLite2-Country database used for first-visit language
 * detection (see src/server/geo.ts).
 *
 * Needs a free MaxMind account: sign up at
 * https://www.maxmind.com/en/geolite2/signup, generate a licence key, and put
 * it in .env as MAXMIND_LICENSE_KEY. Re-run this monthly-ish — a stale database
 * still works, it just knows about fewer IP ranges, and an unrecognised address
 * degrades to Accept-Language rather than failing.
 *
 * The download is a .tar.gz. Rather than take a tar dependency for one file,
 * this gunzips with node:zlib and walks the archive directly: tar is a flat
 * sequence of 512-byte headers, each followed by its file's bytes padded to the
 * next 512-byte boundary. That is about thirty lines and no supply chain.
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import process from "node:process";

const EDITION = "GeoLite2-Country";
const OUT_DIR = path.resolve(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, `${EDITION}.mmdb`);

function loadEnv() {
  // Same .env the app reads; no dotenv import so this runs standalone.
  try {
    const text = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    // No .env is fine — the key may come from the real environment.
  }
}

/** Yield each regular file in an uncompressed tar buffer. */
function* tarEntries(buffer) {
  let offset = 0;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    // Two consecutive zero blocks mark the end of the archive.
    if (header.every((byte) => byte === 0)) return;

    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const size = parseInt(
      header.subarray(124, 136).toString("utf8").replace(/\0.*$/, "").trim(),
      8,
    );
    const type = String.fromCharCode(header[156]);
    offset += 512;

    if (Number.isFinite(size)) {
      if (type === "0" || type === "\0") {
        yield { name, data: buffer.subarray(offset, offset + size) };
      }
      // Payloads are padded up to the next 512-byte boundary.
      offset += Math.ceil(size / 512) * 512;
    }
  }
}

async function main() {
  loadEnv();

  const key = process.env.MAXMIND_LICENSE_KEY?.trim();
  if (!key) {
    console.error(
      [
        "MAXMIND_LICENSE_KEY is not set.",
        "",
        "  1. Create a free account: https://www.maxmind.com/en/geolite2/signup",
        "  2. Generate a licence key in your account settings",
        "  3. Add it to .env:  MAXMIND_LICENSE_KEY=...",
        "",
        "Without it the site still works — language detection just falls back",
        "to the browser's Accept-Language header.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const url =
    `https://download.maxmind.com/app/geoip_download` +
    `?edition_id=${EDITION}&license_key=${encodeURIComponent(key)}&suffix=tar.gz`;

  console.log(`Downloading ${EDITION}…`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(
      `Download failed: ${response.status} ${response.statusText}` +
        (response.status === 401
          ? "\nThat usually means the licence key is wrong or expired."
          : ""),
    );
    process.exit(1);
  }

  const archive = gunzipSync(Buffer.from(await response.arrayBuffer()));

  const entry = [...tarEntries(archive)].find((file) =>
    file.name.endsWith(".mmdb"),
  );
  if (!entry) {
    console.error("No .mmdb file inside the archive — aborting.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, entry.data);

  const mb = (entry.data.length / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)} (${mb} MB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
