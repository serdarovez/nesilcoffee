/**
 * Create or update an admin user.
 *
 *   npm run admin:create -- --email you@example.com --name "Имя" [--role ADMIN]
 *
 * Omit --password and the script generates a strong one and prints it once.
 * Re-running with an existing email updates that account's password, name and
 * role, which doubles as password reset from the server console.
 */

import { config as loadEnv } from "dotenv";
loadEnv();

import { randomBytes } from "node:crypto";
import { PrismaClient, type Role } from "@prisma/client";
import { hash, type Algorithm } from "@node-rs/argon2";

/** Argon2id; see the note in src/server/auth/password.ts about const enums. */
const ARGON2ID = 2 as Algorithm;

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function generatePassword(): string {
  // base64url of 18 bytes → 24 chars, no ambiguous punctuation to mistype.
  return randomBytes(18).toString("base64url");
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const roleArg = (arg("role")?.toUpperCase() ?? "ADMIN") as Role;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Usage: npm run admin:create -- --email <email> --name <name> [--role ADMIN|EDITOR]");
    process.exit(1);
  }
  if (!name) {
    console.error("Missing --name");
    process.exit(1);
  }
  if (roleArg !== "ADMIN" && roleArg !== "EDITOR") {
    console.error(`Invalid --role "${roleArg}". Use ADMIN or EDITOR.`);
    process.exit(1);
  }

  const provided = arg("password");
  if (provided && provided.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const password = provided ?? generatePassword();

  const passwordHash = await hash(password, {
    algorithm: ARGON2ID,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const existing = await prisma.adminUser.findUnique({ where: { email } });

  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role: roleArg, isActive: true },
    create: { email, passwordHash, name, role: roleArg },
  });

  // A password change must not leave old sessions alive.
  if (existing) {
    const { count } = await prisma.adminSession.deleteMany({
      where: { userId: user.id },
    });
    console.log(`\nUpdated existing user — revoked ${count} active session(s).`);
  } else {
    console.log("\nCreated admin user.");
  }

  console.log(`  email: ${user.email}`);
  console.log(`  name:  ${user.name}`);
  console.log(`  role:  ${user.role}`);
  if (!provided) {
    console.log(`\n  password: ${password}`);
    console.log("  ^ shown once — store it in a password manager now.\n");
  }
  console.log("Sign in at /admin/login\n");
}

main()
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
