import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import type { CacheTag } from "@/server/cache-tags";

/**
 * Invalidate the public site AND the admin screen after a mutation.
 *
 * Two different mechanisms are needed because the two sides read differently:
 *
 *  - The public site reads through `unstable_cache`, so it is invalidated by
 *    tag. Without this, visitors keep seeing the old content.
 *
 *  - The admin queries Prisma directly and is never data-cached, but Next still
 *    holds a router cache for the route. An action that mutates and stays on
 *    the same page therefore appears to do nothing: the row is written, and the
 *    list on screen does not change until a manual reload. `revalidatePath`
 *    with `"layout"` covers /admin and everything nested under it, and the docs
 *    are explicit that from a Server Function it "updates the UI immediately
 *    (if viewing the affected path)".
 *
 * Actions that finish with `redirect()` navigate anyway, but they call this too
 * so the destination list is fresh rather than a cached copy.
 */
export function revalidateContent(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, "max");
  revalidatePath("/admin", "layout");
}

/** Refresh the admin UI only — for mutations with no public-facing effect. */
export function revalidateAdmin(): void {
  revalidatePath("/admin", "layout");
}
