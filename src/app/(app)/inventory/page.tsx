import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { 
      brand: true,
      variants: {
        orderBy: { size: "asc" }
      }
    }
  });

  // Sort sizes numerically within each product
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size);
      const nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const lowStockCount = products.reduce((acc, p) => acc + p.variants.filter(v => v.currentStock <= v.minimumStock).length, 0);

  return (
    <div className="content">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: "4px" }}>Stock</h1>
          <p className="muted">Monitor your inventory levels and low stock alerts.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "16px", marginBottom: "24px" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <div className="metric">{lowStockCount}</div>
          <div className="metric-label">Low Stock Sizes</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="metric">{products.length}</div>
          <div className="metric-label">Active Models</div>
        </div>
      </div>

      <div className="grid grid-2">
        {products.map(p => {
          const hasLowStock = p.variants.some(v => v.currentStock <= v.minimumStock);
          
          return (
            <div key={p.id} className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", border: hasLowStock ? "1px solid #fecdd3" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{p.brand.name} {p.name}</strong>
                {hasLowStock && <span className="badge badge-low" style={{ fontSize: "10px", padding: "2px 6px" }}>Alert</span>}
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {p.variants.map(v => {
                  const isLow = v.currentStock <= v.minimumStock;
                  const isOut = v.currentStock === 0;
                  
                  let bg = "#f3f4f6";
                  let border = "#e5e7eb";
                  let color = "var(--text)";
                  let dot = "✅";

                  if (isOut) {
                    bg = "#fff1f2"; border = "#fecdd3"; color = "#be123c"; dot = "🔴";
                  } else if (isLow) {
                    bg = "#fff7ed"; border = "#ffedd5"; color = "#c2410c"; dot = "🟡";
                  }

                  return (
                    <Link href={`/inventory/adjust?sku=${v.sku}`} key={v.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      padding: "6px 10px", 
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: "6px",
                      color: color,
                      fontSize: "13px",
                      textDecoration: "none"
                    }}>
                      <span style={{ fontSize: "10px" }}>{dot}</span>
                      <strong>{v.size}</strong>
                      <span style={{ opacity: 0.6 }}>•</span>
                      <span>{v.currentStock}</span>
                    </Link>
                  );
                })}
                {p.variants.length === 0 && <span className="muted">No sizes</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
