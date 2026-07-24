import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.platformConfig.upsert({
    where: { id: 1 },
    create: { id: 1, commissionPercent: 8, fundReleaseWindowDays: 5 },
    update: {},
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@surplusflooring.example";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Platform Admin",
      accountType: "INDIVIDUAL",
      adminRole: "ADMIN",
      emailVerifiedAt: new Date(),
    },
    update: { adminRole: "ADMIN" },
  });

  console.log(`Seeded platform config and admin user (${adminEmail}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
