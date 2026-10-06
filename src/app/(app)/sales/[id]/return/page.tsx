import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import { SaleReturnForm } from "@/components/sale-return-form";

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAnyPermission(["sell", "manage_stock"]);
  const { id } = await params;
  const sale = await prisma.sale.findFirst({
    where: { id, shopId: user.shopId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  if (!sale) return <div className="content"><h1>Sale not found</h1></div>;

  return (
    <div className="content">
      <h1>Return {sale.invoiceNumber}</h1>
      <p className="muted">Choose quantities to return. Stock will be added back.</p>
      <SaleReturnForm
        saleId={sale.id}
        items={sale.items.map((item) => ({
          id: item.id,
          label: `${item.variant.product.name} · ${item.variant.sku} · Size ${item.variant.size}`,
          sold: item.quantity,
          price: Number(item.unitPrice),
        }))}
      />
    </div>
  );
}

