import { prisma } from "@/lib/prisma";
import { POS } from "@/components/pos";
import { requireUser } from "@/lib/auth";

export default async function POSPage() {
  const user = await requireUser();
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, currentStock: { gt: 0 } },
    include: { product: { include: { brand: true } } },
    orderBy: { product: { name: "asc" } },
    take: 500
  });

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    take: 100
  });

  return (
    <div className="content" style={{ padding: "10px" }}>
      <h1 style={{ display: "none" }}>Billing</h1>
      <POS 
        variants={variants.map(v => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode ?? "",
          name: `${v.product.brand.name} ${v.product.name}`,
          size: v.size,
          color: v.color ?? "",
          stock: v.currentStock,
          price: Number(v.sellingPrice)
        }))} 
        customers={customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? "",
        }))}
      />
    </div>
  );
}
