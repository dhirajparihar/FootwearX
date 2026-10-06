import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
    orderBy: { currentStock: "asc" }
  });

  return (
    <div className="content">
      <h1>Inventory</h1>
      <p className="muted">Current stock and reorder signals.</p>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Stock</th><th>Minimum</th><th>Status</th></tr></thead>
            <tbody>
              {variants.map(v => {
                const low = v.currentStock <= v.minimumStock;
                return <tr key={v.id}>
                  <td>{v.product.name}</td><td>{v.sku}</td><td>{v.size}</td><td>{v.currentStock}</td><td>{v.minimumStock}</td>
                  <td><span className={`badge ${low ? "badge-low" : "badge-ok"}`}>{low ? "LOW" : "OK"}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
