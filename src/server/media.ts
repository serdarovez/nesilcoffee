import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
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

/**
 * Sanitize the filename the browser handed us before storing it.
 *
 * This value is only ever rendered as text, never used to build a path — the
 * file on disk is named from `randomBytes` — but it is fully attacker
 * controlled, so strip directory separators and control characters and cap the
 * length rather than trusting it.
 */
function cleanOriginalName(name: string): string | undefined {
  const cleaned = name
    .split(/[\\/]/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);
  return cleaned || undefined;
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
  originalName?: string,
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
        // `publicPath` is random hex, so this is the only human-readable
        // handle the gallery can show. Capped because it is display-only and
        // the client controls it.
        originalName: cleanOriginalName(originalName ?? file.name),
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

/* -------------------------------------------------------------------------- */
/*  Usage and deletion                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One place an image is currently attached.
 *
 * `disables` is the part that matters: a product cannot render without a
 * photo, so losing its image takes it off the site. Every other consumer —
 * team avatars, certificates, both carousels — already guards for a missing
 * image and keeps working, so the gallery can say so plainly instead of
 * warning about all six the same way.
 */
export type MediaUsage = {
  kind:
    | "product"
    | "homeSlide"
    | "heroBackground"
    | "heroProductArt"
    | "teamMember"
    | "certificate"
    | "expert";
  id: string;
  label: string;
  disables: boolean;
  /** Admin screen this usage can be edited on. */
  href: string;
};

const KIND_LABEL: Record<MediaUsage["kind"], string> = {
  product: "Товар",
  homeSlide: "Слайдер на главной",
  heroBackground: "Слайдер продукции — фон",
  heroProductArt: "Слайдер продукции — изображение товара",
  teamMember: "Команда",
  certificate: "Сертификат",
  expert: "Эксперт",
};

/** Human-readable prefix for the confirm modal, e.g. "Товар «Intenso»". */
export function usageTitle(usage: MediaUsage): string {
  return `${KIND_LABEL[usage.kind]} «${usage.label}»`;
}

/**
 * Everywhere this image is attached right now.
 *
 * Six separate queries rather than one `include` on Media: the relations point
 * the other way, and counting them via `_count` (as the previous version did)
 * cannot produce the per-item names the confirm dialog has to show.
 */
export async function mediaUsage(id: string): Promise<MediaUsage[]> {
  const [
    products,
    homeSlides,
    heroBackgrounds,
    heroArt,
    team,
    certificates,
    experts,
  ] = await Promise.all([
      prisma.product.findMany({
        where: { imageId: id },
        select: { id: true, name: true },
      }),
      prisma.homeSlide.findMany({
        where: { imageOverrideId: id },
        select: { id: true, product: { select: { name: true } } },
      }),
      prisma.productsHeroSlide.findMany({
        where: { bgImageId: id },
        select: { id: true, title: true, product: { select: { name: true } } },
      }),
      prisma.productsHeroSlide.findMany({
        where: { productImageId: id },
        select: { id: true, title: true, product: { select: { name: true } } },
      }),
      prisma.teamMember.findMany({
        where: { avatarId: id },
        select: { id: true, name: true },
      }),
      prisma.certificate.findMany({
        where: { imageId: id },
        select: { id: true, name: true },
      }),
      prisma.expert.findMany({
        where: { photoId: id },
        select: { id: true, name: true },
      }),
    ]);

  // The admin is Russian-only, so every label resolves against `ru`.
  const slideLabel = (s: {
    title: unknown;
    product: { name: unknown } | null;
  }): string =>
    pick(s.title, "ru") ||
    (s.product ? pick(s.product.name, "ru") : "") ||
    "Без названия";

  return [
    ...products.map((p) => ({
      kind: "product" as const,
      id: p.id,
      label: pick(p.name, "ru") || "Без названия",
      disables: true,
      href: `/admin/products/${p.id}`,
    })),
    ...homeSlides.map((s) => ({
      kind: "homeSlide" as const,
      id: s.id,
      label: s.product ? pick(s.product.name, "ru") : "Слайд",
      disables: false,
      href: `/admin/carousel-home/${s.id}`,
    })),
    ...heroBackgrounds.map((s) => ({
      kind: "heroBackground" as const,
      id: s.id,
      label: slideLabel(s),
      disables: false,
      href: `/admin/carousel-products/${s.id}`,
    })),
    ...heroArt.map((s) => ({
      kind: "heroProductArt" as const,
      id: s.id,
      label: slideLabel(s),
      disables: false,
      href: `/admin/carousel-products/${s.id}`,
    })),
    ...team.map((m) => ({
      kind: "teamMember" as const,
      id: m.id,
      label: pick(m.name, "ru") || "Без имени",
      disables: false,
      href: `/admin/team/${m.id}`,
    })),
    ...certificates.map((c) => ({
      kind: "certificate" as const,
      id: c.id,
      label: pick(c.name, "ru") || "Без названия",
      disables: false,
      href: `/admin/certificates/${c.id}`,
    })),
    // The card renders without a photo, so this detaches rather than hides —
    // and it could not hide anyway: the pair is fixed and always rendered.
    ...experts.map((e) => ({
      kind: "expert" as const,
      id: e.id,
      label: pick(e.name, "ru") || "Без имени",
      disables: false,
      href: "/admin/experts",
    })),
  ];
}

export type MediaDeletion = {
  deleted: boolean;
  /** Names of the products taken off the site by this delete. */
  disabledProducts: string[];
};

/**
 * Delete a media row, its file, and every reference to it.
 *
 * Deletion is never refused. Each of the six relations is declared
 * `onDelete: SetNull`, so removing the row detaches it everywhere in one
 * statement; the only extra work is deactivating the products that just lost
 * their photo, because an imageless product cannot render. That is the same
 * invariant `saveProduct`/`toggleProduct` enforce — see
 * src/server/actions/products.ts.
 */
export async function deleteMedia(id: string): Promise<MediaDeletion> {
  const media = await prisma.media.findUnique({
    where: { id },
    select: { path: true },
  });
  if (!media) return { deleted: false, disabledProducts: [] };

  // Read before the delete: afterwards the foreign keys are already NULL and
  // there is no way to recover which products were affected.
  const affected = await prisma.product.findMany({
    where: { imageId: id },
    select: { id: true, name: true },
  });

  await prisma.$transaction([
    prisma.media.delete({ where: { id } }),
    ...(affected.length > 0
      ? [
          prisma.product.updateMany({
            where: { id: { in: affected.map((p) => p.id) } },
            data: { isActive: false },
          }),
        ]
      : []),
  ]);

  // Seeded rows point into public/ and are not ours to remove.
  if (media.path.startsWith("/uploads/")) {
    const segments = media.path.replace(/^\/uploads\//, "").split("/");
    const abs = resolveUploadPath(segments);
    if (abs) await unlink(abs).catch(() => undefined);
  }

  return {
    deleted: true,
    disabledProducts: affected.map((p) => pick(p.name, "ru") || "Без названия"),
  };
}
