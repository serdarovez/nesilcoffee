import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * Replaces the `prisma` key in package.json, which is deprecated and removed in
 * Prisma 7. Note that unlike the package.json form, a config file does not load
 * `.env` automatically — the CLI relies on the ambient environment — so the
 * import below restores that behaviour for local development. In production the
 * variables come from the systemd/PM2 environment instead, where the file is
 * simply absent and the import is a no-op.
 */
import { config as loadEnv } from "dotenv";
loadEnv();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
