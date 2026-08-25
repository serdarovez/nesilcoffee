/**
 * Download the IP-to-country database used for first-visit language detection
 * (see src/server/geo.ts). Two sources, chosen automatically:
 *
 *   - DB-IP Lite (default). Free, no account, a plain monthly URL. This is what
 *     runs when no MaxMind key is set, and what the site is configured for out
 *     of the box. Its CC BY 4.0 licence requires a visible "IP Geolocation by
 *     DB-IP" credit on pages that use it — that credit lives in the footer.
 *
 *   - MaxMind GeoLite2. Used only when MAXMIND_LICENSE_KEY is present. No credit
 *     required, but the account signup rejects VPN addresses. Set both
 *     MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY in .env to use it.
 *
 * Either way, point GEOIP_DB_PATH at the file this writes (the default in
 * .env.example already matches the DB-IP path). Re-run monthly-ish: a stale
 * database still works, it just knows about fewer ranges, and an unrecognised
 * address degrades to Accept-Language rather than failing.
 */

import { readFileSync, unlinkSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const OUT_DIR = path.resolve(process.cwd(), "data");

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
    // No .env is fine — keys may come from the real environment.
  }
}

/** Yield each regular file in an uncompressed tar buffer (MaxMind ships .tar.gz). */
function* tarEntries(buffer) {
  let offset = 0;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
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
      offset += Math.ceil(size / 512) * 512;
    }
  }
}

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

/**
 * DB-IP Lite. The plain .mmdb.gz — no account, no tar. Publishes a new file at
 * the start of each month; for the first day or two the current month may 404,
 * so this falls back to the previous month.
 */
async function fetchDbIp() {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const outFile = path.join(OUT_DIR, "dbip-country-lite.mmdb");

  const failures = [];
  for (const month of [yearMonth(now), yearMonth(prev)]) {
    const url = `https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`;
    console.log(`Downloading DB-IP Lite (${month})…`);
    const result = await download(url);
    if (result instanceof Buffer) {
      const mmdb = gunzipSync(result);
      await mkdir(OUT_DIR, { recursive: true });
      await writeFile(outFile, mmdb);
      const mb = (mmdb.length / 1024 / 1024).toFixed(1);
      console.log(`Wrote ${path.relative(process.cwd(), outFile)} (${mb} MB)`);
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

/** MaxMind GeoLite2 — only when a licence key is configured. */
async function fetchMaxMind(account, key) {
  const EDITION = "GeoLite2-Country";
  const outFile = path.join(OUT_DIR, `${EDITION}.mmdb`);
  console.log(`Downloading ${EDITION}…`);

  // Documented account-ID/key pair first, older key-only URL as fallback.
  const attempts = [];
  if (account) {
    attempts.push({
      label: "account ID + licence key",
      url: `https://download.maxmind.com/geoip/databases/${EDITION}/download?suffix=tar.gz`,
      headers: {
        Authorization: `Basic ${Buffer.from(`${account}:${key}`).toString("base64")}`,
      },
    });
  }
  attempts.push({
    label: "licence key only (legacy)",
    url:
      `https://download.maxmind.com/app/geoip_download` +
      `?edition_id=${EDITION}&license_key=${encodeURIComponent(key)}&suffix=tar.gz`,
    headers: {},
  });

  let response = null;
  const failures = [];
  for (const attempt of attempts) {
    let res;
    try {
      res = await fetch(attempt.url, { headers: attempt.headers, redirect: "manual" });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new Error("redirect without Location");
        res = await fetch(location);
      }
    } catch (error) {
      failures.push(`${attempt.label}: ${error.message}`);
      continue;
    }
    if (res.ok) {
      response = res;
      console.log(`  authenticated with ${attempt.label}`);
      break;
    }
    failures.push(`${attempt.label}: ${res.status} ${res.statusText}`);
  }

  if (!response) {
    console.error(
      [
        "Could not download from MaxMind. Tried:",
        ...failures.map((f) => `  - ${f}`),
        account
          ? "A 401 on both means the credentials were rejected — check the pair."
          : "Set MAXMIND_ACCOUNT_ID as well; MaxMind's current endpoint needs it.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const archive = gunzipSync(Buffer.from(await response.arrayBuffer()));
  const entry = [...tarEntries(archive)].find((f) => f.name.endsWith(".mmdb"));
  if (!entry) {
    console.error("No .mmdb file inside the archive — aborting.");
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(outFile, entry.data);
  const mb = (entry.data.length / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)} (${mb} MB)`);
  console.log(
    `Point GEOIP_DB_PATH at ${path.relative(process.cwd(), outFile)} to use it.`,
  );
}

async function main() {
  loadEnv();
  const account = process.env.MAXMIND_ACCOUNT_ID?.trim();
  const key = process.env.MAXMIND_LICENSE_KEY?.trim();

  if (key) {
    await fetchMaxMind(account, key);
  } else {
    await fetchDbIp();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
