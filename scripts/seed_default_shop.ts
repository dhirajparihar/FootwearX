import { prisma } from "../src/lib/prisma";

async function main() {
  const existing = await prisma.shop.findUnique({ where: { id: "DEFAULT" } });
  if (!existing) {
    await prisma.shop.create({
      data: {
        id: "DEFAULT",
        name: "Default Shop",
      }
    });
    console.log("Created DEFAULT shop");
  } else {
    console.log("DEFAULT shop already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
