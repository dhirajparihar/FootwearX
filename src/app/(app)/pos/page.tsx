import { prisma } from "@/lib/prisma";
import { POS } from "@/components/pos";

export default async function POSPage() {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, currentStock: { gt: 0 } },
    include: { product: { include: { brand: true } } },
    orderBy: { product: { name: "asc" } },
    take: 200
  });

  return (
    <div className="content">
      <h1>POS</h1>
      <p className="muted">Search/select an SKU and complete the sale.</p>
      <POS variants={variants.map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode ?? "",
        name: `${v.product.brand.name} ${v.product.name}`,
        size: v.size,
        color: v.color ?? "",
        stock: v.currentStock,
        price: Number(v.sellingPrice)
      }))} />
    </div>
  );
}
