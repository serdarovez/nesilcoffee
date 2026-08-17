import "server-only";
import { prisma } from "@/server/db";

/**
 * Fixed-window rate limiting backed by the RateLimit table.
 *
 * Postgres rather than in-memory state, because PM2 may run more than one
 * worker and an in-process counter would then allow `limit × workers` attempts.
 * The whole check is a single atomic upsert-and-increment so concurrent
 * requests cannot race past the limit.
 *
 * Used for admin login attempts and, later, the public contact and order forms.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);

  // Every timestamp is produced and compared by Postgres via now(); no
  // JavaScript Date crosses the boundary in either direction.
  //
  // This is deliberate. Passing a JS Date into $queryRaw against a
  // `timestamp`-without-time-zone column round-trips through the server's local
  // UTC offset, so on a UTC+5 machine the window read back five hours longer
  // than it was written — the lockout message told users to wait 301 minutes
  // instead of 1. Computing the remaining seconds in SQL removes the conversion
  // entirely, and also makes the limiter immune to clock skew between the app
  // process and the database.
  const [row] = await prisma.$queryRaw<
    { count: number; retryAfter: number }[]
  >`
    INSERT INTO "RateLimit" ("key", "count", "windowEnd")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowEnd" <= now() THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowEnd" = CASE
        WHEN "RateLimit"."windowEnd" <= now()
          THEN now() + make_interval(secs => ${windowSeconds})
        ELSE "RateLimit"."windowEnd"
      END
    RETURNING
      "count",
      GREATEST(0, CEIL(EXTRACT(EPOCH FROM ("windowEnd" - now()))))::int AS "retryAfter"
  `;

  const count = Number(row?.count ?? 1);

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Number(row?.retryAfter ?? windowSeconds),
  };
}

/** Clear a key after a successful attempt so one success resets the counter. */
export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/** Housekeeping for expired windows; safe to call opportunistically. */
export async function pruneRateLimits(): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: { windowEnd: { lte: new Date() } },
  });
}
