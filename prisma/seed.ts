import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const isCloudDb = connectionString.includes("render.com") || connectionString.includes("sslmode=");
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "My Footwear Shop",
      phone: "",
      address: "Bhopal, Madhya Pradesh",
      settings: {
        create: {
          invoicePrefix: "INV",
          currency: "INR"
        }
      }
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      shopId: shop.id,
      passwordHash: hashPassword("ChangeMe123!"),
      role: "OWNER",
      isActive: true
    },
    create: {
      shopId: shop.id,
      name: "Shop Owner",
      email: "owner@example.com",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "OWNER"
    }
  });

  const brand = await prisma.brand.upsert({
    where: { name: "Nike" },
    update: {},
    create: { name: "Nike" }
  });

  const category = await prisma.category.upsert({
    where: { name: "Sports Shoes" },
    update: {},
    create: { name: "Sports Shoes" }
  });

  const product = await prisma.product.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      brandId: brand.id,
      categoryId: category.id,
      name: "Air Max Demo",
      gender: "UNISEX"
    }
  });

  for (const [size, sku] of [["8", "NIKE-AM8"], ["9", "NIKE-AM9"], ["10", "NIKE-AM10"]] as const) {
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: product.id,
        sku,
        size,
        barcode: sku + "01",
        purchasePrice: 3000,
        sellingPrice: 4999,
        mrp: 5499,
        currentStock: 10,
        minimumStock: 2
      }
    });
  }

  await prisma.supplier.upsert({
    where: { id: "00000000-0000-0000-0000-000000000020" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Demo Supplier",
      phone: "9999999999"
    }
  });

  console.log(`Seeded ${owner.email} / ChangeMe123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

