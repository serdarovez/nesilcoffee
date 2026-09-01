import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getApiUser } from "@/server/auth/guard";
import { prisma } from "@/server/db";

const run = promisify(execFile);
const compress = promisify(gzip);

/** The dump is a few hundred KB; this only guards against a runaway process. */
const MAX_BUFFER = 256 * 1024 * 1024;
const TIMEOUT_MS = 120_000;

/**
 * Download a database dump from the admin.
 *
 * Everything is resolved at request time rather than baked in, so moving the
 * site to another machine — or another database — needs no change here:
 *
 *  - the connection comes from DATABASE_URL, the same value the app itself
 *    runs on, so it cannot drift out of step with the live database;
 *  - `?schema=…`, which Prisma appends and pg_dump rejects outright, is
 *    stripped;
 *  - the pg_dump binary is matched to the server's major version. pg_dump
 *    refuses to touch a server newer than itself, which is the "server version
 *    mismatch" a move to a newer Postgres would otherwise produce. Debian and
 *    Ubuntu keep every installed version under /usr/lib/postgresql/<major>/bin,
 *    so the right one is looked up and used when it exists.
 *
 * Buffered rather than streamed on purpose: this database gzips to tens of
 * kilobytes, and buffering means a failure is still a clean JSON error the
 * admin can read, instead of a truncated download that already sent 200.
 */
export const dynamic = "force-dynamic";

async function serverMajorVersion(): Promise<number | null> {
  try {
    const rows =
      await prisma.$queryRawUnsafe<{ v: string }[]>("show server_version");
    const raw = rows?.[0]?.v ?? "";
    const major = Number.parseInt(raw.split(".")[0] ?? "", 10);
    return Number.isFinite(major) ? major : null;
  } catch {
    return null;
  }
}

/** The pg_dump that can read this server, falling back to whatever is on PATH. */
async function resolvePgDump(): Promise<string> {
  const major = await serverMajorVersion();
  if (major) {
    const versioned = `/usr/lib/postgresql/${major}/bin/pg_dump`;
    if (existsSync(versioned)) return versioned;
  }
  return "pg_dump";
}

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return NextResponse.json(
      { error: "DATABASE_URL не настроен на сервере" },
      { status: 500 },
    );
  }
  const connection = raw.split("?")[0];

  try {
    const bin = await resolvePgDump();
    const { stdout } = await run(
      bin,
      ["--no-owner", "--no-privileges", connection],
      { maxBuffer: MAX_BUFFER, timeout: TIMEOUT_MS, encoding: "buffer" },
    );

    const body = await compress(stdout);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="nesilcoffee-${stamp}.sql.gz"`,
        // A database dump must never sit in a proxy or browser cache.
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    // pg_dump writes the useful part to stderr — a version mismatch, a refused
    // connection — so pass it through instead of a generic failure the admin
    // cannot act on.
    const stderr =
      typeof error === "object" && error && "stderr" in error
        ? String((error as { stderr: unknown }).stderr ?? "")
        : "";
    const detail = stderr.trim().split("\n").slice(-3).join(" ").slice(0, 300);

    console.error("Backup failed:", error);
    return NextResponse.json(
      {
        error: detail
          ? `Не удалось создать резервную копию: ${detail}`
          : "Не удалось создать резервную копию",
      },
      { status: 500 },
    );
  }
}
