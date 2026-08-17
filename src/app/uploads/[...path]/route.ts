import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { resolveUploadPath } from "@/server/media";

/**
 * Serves uploaded files in development.
 *
 * In production nginx aliases /uploads straight to disk and this handler is
 * never reached — the request does not get as far as Node. It exists so the
 * same /uploads/** URLs resolve locally, where there is no nginx, without the
 * app needing environment-specific image paths.
 */

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // resolveUploadPath rejects anything escaping the upload root, so a crafted
  // "../.." cannot reach outside it.
  const abs = resolveUploadPath(segments);
  if (!abs) return new NextResponse("Not found", { status: 404 });

  const ext = abs.slice(abs.lastIndexOf(".")).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(abs);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(abs),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      // Filenames are content-random and never reused, so a long immutable
      // cache is safe; replacing an image always yields a new path.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
