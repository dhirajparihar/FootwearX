import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { PurchaseReturnForm } from "@/components/purchase-return-form";

export default async function PurchaseReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("manage_stock");
  const { id } = await params;
  const purchase = await prisma.purchase.findFirst({
    where: { id, shopId: user.shopId },
    include: { supplier: true, items: { include: { variant: { include: { product: true } } } } },
  });

  if (!purchase) return <div className="content"><h1>Purchase not found</h1></div>;

  return (
    <div className="content">
      <h1>Supplier return {purchase.invoiceNumber}</h1>
      <p className="muted">Return stock to the supplier.</p>
      <PurchaseReturnForm
        purchaseId={purchase.id}
        items={purchase.items.map((item) => ({
          id: item.id,
          label: `${item.variant.product.name} · ${item.variant.sku} · Size ${item.variant.size}`,
          purchased: item.quantity,
          cost: Number(item.unitCost),
        }))}
      />
    </div>
  );
}
