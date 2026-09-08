import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Identity DB...");

  // Aplikasi terhubung
  await prisma.application.upsert({
    where: { key: "ASET" },
    update: {},
    create: { key: "ASET", name: "Manajemen Aset" },
  });
  await prisma.application.upsert({
    where: { key: "HRIS" },
    update: {},
    create: { key: "HRIS", name: "HRIS" },
  });

  // Company + super admin platform
  const company = await prisma.company.upsert({
    where: { slug: "asiacommerce" },
    update: {},
    create: {
      name: "PT AsiaCommerce",
      slug: "asiacommerce",
      email: "info@asiacommerce.net",
    },
  });

  const password = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@asiacommerce.net" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@asiacommerce.net",
      password,
      isSuperAdmin: true,
      companyId: company.id,
    },
  });

  // Beri admin akses penuh ke ASET
  await prisma.userAppRole.upsert({
    where: {
      userId_applicationKey: { userId: admin.id, applicationKey: "ASET" },
    },
    update: { role: "SUPER_ADMIN" },
    create: { userId: admin.id, applicationKey: "ASET", role: "SUPER_ADMIN" },
  });

  console.log("✅ Seed selesai!");
  console.log("   Login: admin@asiacommerce.net / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
