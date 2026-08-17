import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Next's dev server re-evaluates modules on every hot reload; without the
 * global cache each reload would open a fresh connection pool until Postgres
 * refuses new connections. In production the module is evaluated once, so the
 * global is only populated outside production to keep the prod path clean.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
