import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/server/db";
import type { Media } from "@prisma/client";

/**
 * Upload storage.
 *
 * Files are written outside the git working tree — `UPLOAD_DIR` points at
 * /var/www/nesilcoffee/uploads in production — so a redeploy, a fresh clone or
 * a `git clean` cannot destroy them. nginx serves that directory directly at
 * /uploads; in development the route handler at src/app/uploads/[...path]
 * stands in for nginx so the same URLs work locally.
 */

/** Longest edge of a stored image. next/image resizes down from here per request. */
const MAX_DIMENSION = 2400;
const MAX_BYTES = 15 * 1024 * 1024;
const WEBP_QUALITY = 82;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

export class MediaError extends Error {}

/**
 * The `turbopackIgnore` comments below tell the bundler these paths are runtime
 * data, not module specifiers. Without them Turbopack cannot resolve them
 * statically, falls back to tracing the entire project into the build output,
 * and warns accordingly.
 */
export function uploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim() || "./.uploads";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

/**
 * Resolve a public /uploads path to a file on disk, refusing anything that
 * escapes the upload root. Without this check a request for
 * `/uploads/../../.env` would be served happily.
 */
export function resolveUploadPath(segments: string[]): string | null {
  const root = uploadRoot();
  const target = path.resolve(/*turbopackIgnore: true*/ root, ...segments);
  const rel = path.relative(root, target);

  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return target;
}

/**
 * Blur placeholder, using the same recipe as scripts/generate-blur-data.mjs
 * (12px longest edge, JPEG q40) so uploaded images and the pre-generated
 * public/ assets produce visually identical placeholders.
 */
async function makeBlurDataUrl(input: Buffer): Promise<string> {
  const buf = await sharp(input)
    .resize(12, 12, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export type StoreResult = { media: Media; reused: boolean };

/**
 * Normalize an uploaded file to webp, write it under UPLOAD_DIR and record it.
 *
 * Validation is done by decoding with sharp rather than trusting the declared
 * MIME type or the file extension — both are attacker-controlled, and a file
 * sharp cannot decode is not an image regardless of what it claims to be.
 */
export async function storeUpload(
  file: File,
  altText?: string,
): Promise<StoreResult> {
  if (file.size === 0) throw new MediaError("Файл пуст");
  if (file.size > MAX_BYTES) {
    throw new MediaError(
      `Файл слишком большой (максимум ${Math.floor(MAX_BYTES / 1024 / 1024)} МБ)`,
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Decoding is the validation: a file sharp cannot read is not an image,
  // whatever its extension or declared MIME type claims.
  const metadata = await sharp(input, { failOn: "error" })
    .metadata()
    .catch(() => null);

  if (!metadata) {
    throw new MediaError("Не удалось прочитать изображение");
  }

  let pipeline = sharp(input, { failOn: "error" });

  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new MediaError(
      `Неподдерживаемый формат${metadata.format ? `: ${metadata.format}` : ""}`,
    );
  }

  // Strip EXIF (rotation is baked in first so portrait photos stay upright,
  // and location metadata never reaches the public site).
  pipeline = pipeline.rotate();

  if (
    (metadata.width ?? 0) > MAX_DIMENSION ||
    (metadata.height ?? 0) > MAX_DIMENSION
  ) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const { data, info } = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  const blurDataUrl = await makeBlurDataUrl(data);

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${randomBytes(8).toString("hex")}.webp`;
  const publicPath = `/uploads/${folder}/${name}`;

  const absDir = path.join(/*turbopackIgnore: true*/ uploadRoot(), folder);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ absDir, name), data);

  try {
    const media = await prisma.media.create({
      data: {
        path: publicPath,
        width: info.width,
        height: info.height,
        blurDataUrl,
        mimeType: "image/webp",
        bytes: info.size,
        alt: altText?.trim() ? { ru: altText.trim() } : undefined,
      },
    });
    return { media, reused: false };
  } catch (error) {
    // Never leave an orphan file behind if the row could not be written.
    await unlink(path.join(/*turbopackIgnore: true*/ absDir, name)).catch(() => undefined);
    throw error;
  }
}

/**
 * Delete a media row and its file. Rows still referenced by content are kept —
 * the caller is told, rather than silently breaking a product image.
 */
export async function deleteMedia(
  id: string,
): Promise<{ deleted: boolean; usedBy: number }> {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          productImages: true,
          slideOverrides: true,
          heroBackgrounds: true,
          heroProductArt: true,
          teamAvatars: true,
          certificateImages: true,
        },
      },
    },
  });
  if (!media) return { deleted: false, usedBy: 0 };

  const usedBy =
    media._count.productImages +
    media._count.slideOverrides +
    media._count.heroBackgrounds +
    media._count.heroProductArt +
    media._count.teamAvatars +
    media._count.certificateImages;

  if (usedBy > 0) return { deleted: false, usedBy };

  await prisma.media.delete({ where: { id } });

  // Seeded rows point into public/ and are not ours to remove.
  if (media.path.startsWith("/uploads/")) {
    const segments = media.path.replace(/^\/uploads\//, "").split("/");
    const abs = resolveUploadPath(segments);
    if (abs) await unlink(abs).catch(() => undefined);
  }

  return { deleted: true, usedBy: 0 };
}
