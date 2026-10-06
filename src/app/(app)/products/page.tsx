import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { 
      brand: true, 
      category: true,
      variants: {
        orderBy: { size: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Helper to sort sizes numerically
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size);
      const nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  return (
    <div className="content">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: "4px" }}>Products</h1>
          <p className="muted">Manage your catalog and stock across all sizes.</p>
        </div>
        <Link className="btn btn-primary" href="/products/new" style={{ fontWeight: "bold" }}>
          + Add Product
        </Link>
      </div>

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        {products.map((p) => {
          // Assume price is the same across variants for simplicity of display
          const price = p.variants[0]?.sellingPrice || 0;
          const color = p.variants.find(v => v.color)?.color;
          const totalStock = p.variants.reduce((acc, v) => acc + v.currentStock, 0);

          return (
            <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--border)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>{p.brand.name} {p.name}</h3>
                  <div className="chips">
                    <span className="badge badge-ok">{p.category.name}</span>
                    <span className="badge">{p.gender}</span>
                    {color && <span className="badge">{color}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: "18px" }}>₹{Number(price).toLocaleString("en-IN")}</strong>
                  <div className="muted" style={{ fontSize: "12px", marginTop: "2px" }}>Total: {totalStock} pairs</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {p.variants.map(v => (
                  <div key={v.id} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    padding: "6px 12px", 
                    background: v.currentStock === 0 ? "#fff1f2" : "#f0fdf4", 
                    border: `1px solid ${v.currentStock === 0 ? "#fecdd3" : "#bbf7d0"}`,
                    borderRadius: "8px",
                    color: v.currentStock === 0 ? "#be123c" : "#15803d",
                    fontSize: "14px"
                  }}>
                    <strong>{v.size}</strong>
                    <span style={{ opacity: 0.7 }}>•</span>
                    <span>{v.currentStock}</span>
                  </div>
                ))}
                {p.variants.length === 0 && <span className="muted">No sizes defined</span>}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f3f4f6", textAlign: "right" }}>
                <Link href={`/products/${p.id}/edit`} className="btn btn-secondary" style={{ fontSize: "12px" }}>
                  Edit Product
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
