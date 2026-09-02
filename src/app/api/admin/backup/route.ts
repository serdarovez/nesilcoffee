import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getApiUser } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { uploadRoot } from "@/server/media";
import { ZipWriter } from "@/server/zip";

const run = promisify(execFile);

/** The dump is a few hundred KB; this only guards against a runaway process. */
const MAX_BUFFER = 256 * 1024 * 1024;
const TIMEOUT_MS = 120_000;

/**
 * Download a complete backup from the admin: the database and every uploaded
 * file, in one ZIP.
 *
 * A dump on its own is not a backup of this site. Every image lives outside the
 * database — the rows only hold `/uploads/…` paths — so restoring SQL alone
 * would bring back a site whose pictures are all missing. The two have to
 * travel together to be worth anything.
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
 *    so the right one is looked up and used when it exists;
 *  - the images come from UPLOAD_DIR, so a server that stores them elsewhere is
 *    still backed up correctly.
 *
 * The dump runs to completion before anything is sent, so the failure modes
 * that actually happen — a version mismatch, a refused connection — are still a
 * readable JSON error rather than a truncated download that already sent 200.
 * The images are streamed after that, because they grow without limit and
 * holding the whole archive in memory would not.
 *
 * Not included: .env. It holds the database password, the session secret and
 * the mail credentials in plain text, and this file is downloaded through a
 * browser, lands in a downloads folder and gets forwarded to people. Server
 * configuration is reproducible from deploy/; leaked credentials are not.
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

/** Every file under `dir`, as paths relative to it. Depth-first, dirs included. */
async function walk(dir: string, base = dir): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // An unreadable subdirectory should cost its own files, not the backup.
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

/** Already-compressed formats, where deflate spends CPU for nothing. */
const PRECOMPRESSED = /\.(webp|jpe?g|png|avif|gif|mp4|woff2?)$/i;

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

  // Run the dump before sending anything, so its failures are still reportable.
  let dump: Buffer;
  try {
    const bin = await resolvePgDump();
    const { stdout } = await run(
      bin,
      ["--no-owner", "--no-privileges", connection],
      { maxBuffer: MAX_BUFFER, timeout: TIMEOUT_MS, encoding: "buffer" },
    );
    dump = stdout;
  } catch (error) {
    // pg_dump writes the useful part to stderr — a version mismatch, a refused
    // connection — so pass it through instead of a generic failure the admin
    // cannot act on. When the binary is missing entirely there is no stderr at
    // all, only a spawn error, so fall back to that rather than to a message
    // that says nothing.
    const stderr =
      typeof error === "object" && error && "stderr" in error
        ? String((error as { stderr: unknown }).stderr ?? "")
        : "";
    const detail =
      stderr.trim().split("\n").slice(-3).join(" ").slice(0, 300) ||
      (error instanceof Error ? error.message.slice(0, 300) : "");

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

  const root = uploadRoot();
  const uploads = existsSync(root) ? await walk(root) : [];
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new ZipWriter((chunk) => controller.enqueue(new Uint8Array(chunk)));

      try {
        await zip.addFile("database.sql", dump);

        await zip.addFile(
          "README.txt",
          Buffer.from(
            [
              `Резервная копия NesilCoffee от ${stamp}`,
              "",
              "database.sql — полный дамп базы (pg_dump).",
              `uploads/ — все загруженные файлы (${uploads.length} шт.).`,
              "",
              "Как восстановить:",
              "  1) psql \"$DATABASE_URL\" < database.sql",
              "  2) скопировать содержимое uploads/ в каталог UPLOAD_DIR на сервере",
              "",
              "В копию намеренно не входит .env — там пароли и ключи.",
              "Настройки сервера восстанавливаются из каталога deploy/ в репозитории.",
            ].join("\n"),
            "utf8",
          ),
        );

        for (const rel of uploads) {
          const full = path.join(root, rel);
          try {
            const [content, info] = await Promise.all([
              readFile(full),
              stat(full),
            ]);
            // Forward slashes: the ZIP spec requires them, and Windows reads
            // them correctly while the reverse is not true.
            await zip.addFile(`uploads/${rel.split(path.sep).join("/")}`, content, {
              compress: !PRECOMPRESSED.test(rel),
              mtime: info.mtime,
            });
          } catch {
            // A file deleted between listing and reading is not a reason to
            // abandon an otherwise complete backup.
          }
        }

        zip.finish();
        controller.close();
      } catch (error) {
        console.error("Backup stream failed:", error);
        // Headers are long gone by now; aborting is what tells the browser the
        // download is incomplete rather than handing over a truncated archive
        // that looks fine until someone tries to restore from it.
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="nesilcoffee-backup-${stamp}.zip"`,
      // A backup must never sit in a proxy or browser cache.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
