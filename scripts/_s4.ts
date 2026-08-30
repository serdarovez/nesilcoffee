import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.adminUser.findFirstOrThrow({ where: { isActive: true } });
  const token = randomBytes(32).toString("base64url");
  await prisma.adminSession.create({
    data: { tokenHash: createHash("sha256").update(token).digest("hex"), userId: user.id,
            expiresAt: new Date(Date.now() + 900_000), userAgent: "claude-verification-temp" },
  });
  console.log("TOKEN=" + token);
  await prisma.$disconnect();
}
main();
