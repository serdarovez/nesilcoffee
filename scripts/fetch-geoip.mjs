/**
 * Download the DB-IP Lite country database used for first-visit language
 * detection (see src/server/geo.ts).
 *
 * Free, no account, a plain monthly URL. Its CC BY 4.0 licence requires a
 * visible "IP Geolocation by DB-IP" credit on pages that use it — that credit
 * lives in the footer. Point GEOIP_DB_PATH at the file this writes (the default
 * in .env.example already matches).
 *
 * Re-run monthly-ish: a stale database still works, it just knows about fewer
 * ranges, and an unrecognised address degrades to Accept-Language rather than
 * failing. Any IP-to-country MMDB works, so a different source can be dropped in
 * by hand at GEOIP_DB_PATH without this script.
 */

import { readFileSync, unlinkSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const OUT_DIR = path.resolve(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "dbip-country-lite.mmdb");

/** YYYY-MM for a date, in UTC. */
function yearMonth(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Fetch a URL to a Buffer. Tries node's fetch first — which works on a direct
 * connection, e.g. the server. Node's fetch ignores HTTP(S)_PROXY, so behind a
 * proxy (a VPN like Happ) it times out; there it falls back to curl, which
 * honours the proxy env vars. Returns a Buffer, or { error } on failure.
 */
async function download(url) {
  try {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // A real HTTP status (e.g. 404 for a not-yet-published month) is a
    // definite answer — no point retrying it through curl.
    return { error: `${res.status} ${res.statusText}` };
  } catch {
    // Transport failure (blocked direct route). Try curl, which uses the proxy.
    const tmp = path.join(tmpdir(), `geoip-${process.pid}-${Date.now()}.tmp`);
    const r = spawnSync("curl", ["-fsSL", url, "-o", tmp], { encoding: "utf8" });
    if (r.status !== 0) {
      return {
        error:
          "direct fetch timed out and curl failed: " +
          ((r.stderr || "").trim() || r.error?.message || `exit ${r.status}`),
      };
    }
    try {
      const buf = readFileSync(tmp);
      unlinkSync(tmp);
      return buf;
    } catch (e) {
      return { error: `curl wrote nothing: ${e.message}` };
    }
  }
}

async function main() {
  // DB-IP publishes a new file at the start of each month; for the first day or
  // two the current month can 404, so fall back to the previous month.
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const failures = [];
  for (const month of [yearMonth(now), yearMonth(prev)]) {
    const url = `https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`;
    console.log(`Downloading DB-IP Lite (${month})…`);
    const result = await download(url);
    if (result instanceof Buffer) {
      const mmdb = gunzipSync(result);
      await mkdir(OUT_DIR, { recursive: true });
      await writeFile(OUT_FILE, mmdb);
      const mb = (mmdb.length / 1024 / 1024).toFixed(1);
      console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)} (${mb} MB)`);
      console.log(
        "Remember: DB-IP's CC BY 4.0 licence needs the visible credit in the footer.",
      );
      return;
    }
    failures.push(`${month}: ${result.error}`);
  }

  console.error(
    ["Could not download DB-IP Lite. Tried:", ...failures.map((f) => `  - ${f}`)].join("\n"),
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
