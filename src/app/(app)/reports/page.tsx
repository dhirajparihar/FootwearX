import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const [sales, returns, expensesAgg, stock] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      include: { items: { include: { variant: { include: { product: { include: { brand: true } } } } } } }
    }),
    prisma.saleReturn.findMany({
      include: { items: { include: { saleItem: true } } }
    }),
    prisma.expense.aggregate({
      _sum: { amount: true }
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { include: { brand: true } } }
    }),
  ]);

  // Financials
  let grossSales = 0;
  let totalDiscount = 0;
  let cogs = 0;

  const productSales = new Map<string, { name: string, qty: number, rev: number }>();
  const sizeSales = new Map<string, number>();

  sales.forEach(sale => {
    totalDiscount += Number(sale.discount);
    sale.items.forEach(item => {
      const rev = Number(item.total);
      grossSales += rev;
      // Use unitCost if populated, else fallback to variant's purchasePrice just for historical compatibility
      const cost = item.quantity * (Number(item.unitCost) || Number(item.variant.purchasePrice));
      cogs += cost;

      const pName = `${item.variant.product.brand.name} ${item.variant.product.name}`;
      if (!productSales.has(pName)) productSales.set(pName, { name: pName, qty: 0, rev: 0 });
      const pStats = productSales.get(pName)!;
      pStats.qty += item.quantity;
      pStats.rev += rev;

      const size = item.variant.size;
      sizeSales.set(size, (sizeSales.get(size) || 0) + item.quantity);
    });
  });

  let returnAmount = 0;
  let returnCogs = 0;
  returns.forEach(r => {
    returnAmount += Number(r.refundAmount);
    r.items.forEach(item => {
      const cost = item.quantity * (Number(item.saleItem.unitCost) || 0); // fallback 0 if missing
      returnCogs += cost;
    });
  });

  const netSales = grossSales - totalDiscount - returnAmount;
  const netCogs = cogs - returnCogs;
  const grossProfit = netSales - netCogs;
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = grossProfit - totalExpenses;

  // Best Sellers
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topSizes = Array.from(sizeSales.entries()).map(([size, qty]) => ({ size, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const stockValue = stock.reduce((n, x) => n + x.currentStock * Number(x.purchasePrice), 0);
  const deadStock = stock.filter(x => x.currentStock > 0).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Business Reports</h1>
          <p className="muted">Overall financial performance and sales insights.</p>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 16px", borderRadius: "10px", color: "#15803d" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>Net Profit</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>₹{netProfit.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>Profit & Loss</h3>
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Gross Sales</span>
            <strong>₹{grossSales.toLocaleString("en-IN")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Discounts</span>
            <strong style={{ color: "var(--danger)" }}>- ₹{totalDiscount.toLocaleString("en-IN")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Customer Returns</span>
            <strong style={{ color: "var(--danger)" }}>- ₹{returnAmount.toLocaleString("en-IN")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
            <span className="muted">Purchase Cost (COGS)</span>
            <strong style={{ color: "var(--danger)" }}>- ₹{netCogs.toLocaleString("en-IN")}</strong>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
            <strong>Gross Profit</strong>
            <strong>₹{grossProfit.toLocaleString("en-IN")}</strong>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
            <span className="muted">Shop Expenses</span>
            <strong style={{ color: "var(--danger)" }}>- ₹{totalExpenses.toLocaleString("en-IN")}</strong>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", color: netProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
            <strong>Net Profit</strong>
            <strong>₹{netProfit.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <h3 style={{ margin: "0 0 12px 0" }}>Best Selling Products</h3>
            {topProducts.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i !== topProducts.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <span>{p.name}</span>
                <strong>{p.qty} sold</strong>
              </div>
            ))}
            {topProducts.length === 0 && <span className="muted">No sales yet.</span>}
          </div>

          <div className="card">
            <h3 style={{ margin: "0 0 12px 0" }}>Fast Moving Sizes</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {topSizes.map(s => (
                <div key={s.size} style={{ background: "#f9fafb", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>Size {s.size}</div>
                  <div className="muted" style={{ fontSize: "12px" }}>{s.qty} pairs</div>
                </div>
              ))}
              {topSizes.length === 0 && <span className="muted">No sales yet.</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0 }}>Stock Worth</h3>
            <strong style={{ fontSize: "20px" }}>₹{stockValue.toLocaleString("en-IN")}</strong>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: "14px" }}>Total money currently locked in shop inventory (based on cost price).</p>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 12px 0" }}>Dead Stock (Oldest sitting pairs)</h3>
          {deadStock.map((s, i) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i !== deadStock.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <span>{s.product.brand.name} {s.product.name} (Size {s.size})</span>
              <strong className="muted">{s.currentStock} pairs</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
