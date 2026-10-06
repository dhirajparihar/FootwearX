import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const [sales, purchases, stock, moves] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { status: "COMPLETED" },
    }),
    prisma.purchase.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { status: "COMPLETED" },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        currentStock: true,
        purchasePrice: true,
        sellingPrice: true,
        minimumStock: true,
        product: true,
      },
    }),
    prisma.stockMovement.groupBy({
      by: ["type"],
      _sum: { quantity: true },
    }),
  ]);

  const stockValue = stock.reduce(
    (n, x) => n + x.currentStock * Number(x.purchasePrice),
    0
  );
  const retailValue = stock.reduce(
    (n, x) => n + x.currentStock * Number(x.sellingPrice),
    0
  );
  const low = stock.filter((x) => x.currentStock <= x.minimumStock);

  return (
    <div className="content">
      <h1>Reports</h1>

      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="metric-label">Lifetime Sales</div>
          <div className="metric">
            ₹{Number(sales._sum.total ?? 0).toLocaleString("en-IN")}
          </div>
          <p className="muted">{sales._count._all} invoices</p>
        </div>

        <div className="card">
          <div className="metric-label">Lifetime Purchases</div>
          <div className="metric">
            ₹{Number(purchases._sum.total ?? 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="card">
          <div className="metric-label">Cost Stock Value</div>
          <div className="metric">₹{stockValue.toLocaleString("en-IN")}</div>
        </div>

        <div className="card">
          <div className="metric-label">Retail Stock Value</div>
          <div className="metric">₹{retailValue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Low Stock Alerts</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Stock</th>
                <th>Minimum</th>
              </tr>
            </thead>
            <tbody>
              {low.map((x) => (
                <tr key={x.id}>
                  <td>{x.sku}</td>
                  <td>{x.product.name}</td>
                  <td>{x.currentStock}</td>
                  <td>{x.minimumStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Stock Movement Summary</h2>
        <div className="chips">
          {moves.map((m) => (
            <span className="badge badge-ok" key={m.type}>
              {m.type}: {m._sum.quantity ?? 0}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
