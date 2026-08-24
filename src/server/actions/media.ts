"use server";

import { redirect } from "next/navigation";
import { revalidateContent } from "@/server/revalidate";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import { deleteMedia } from "@/server/media";

/**
 * Delete an image from the gallery.
 *
 * The consequences — which products come off the site, which other content
 * loses its picture — are computed by `mediaUsage()` and shown in the confirm
 * dialog before this runs. The deletion itself is never refused; see
 * `deleteMedia` in src/server/media.ts for why.
 */
export async function deleteMediaAction(id: string): Promise<void> {
  await requireAdmin();

  const result = await deleteMedia(id);
  if (!result.deleted) return;

  // An image can be attached to five different kinds of content, and there is
  // no cheap way to know which of them the caller actually touched. Listing the
  // five that can hold a Media reference is still narrower than purging
  // everything, and keeps FAQ, categories and settings caches warm.
  revalidateContent(
    TAGS.products,
    TAGS.homeCarousel,
    TAGS.productsCarousel,
    TAGS.team,
    TAGS.certificates,
  );

  // Back to the plain list: the `?selected=` id in the URL no longer exists.
  redirect("/admin/gallery");
}
