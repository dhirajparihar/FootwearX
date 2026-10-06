import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const variants = await prisma.productVariant.findMany({
    include: { product: { include: { brand: true, category: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="content">
      <div className="row">
        <div>
          <h1>Products & SKUs</h1>
          <p className="muted">Manage footwear products, size variants, stock levels, and prices.</p>
        </div>
        <Link className="btn btn-primary" href="/products/new">
          + Add Product (Size-Matrix)
        </Link>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Color</th>
                <th>Price (₹)</th>
                <th>MRP (₹)</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>
                      {v.product.brand.name} {v.product.name}
                    </strong>
                  </td>
                  <td>{v.sku}</td>
                  <td>
                    <span className="badge badge-ok">Size {v.size}</span>
                  </td>
                  <td>{v.color ?? "—"}</td>
                  <td>₹{Number(v.sellingPrice).toLocaleString("en-IN")}</td>
                  <td>₹{Number(v.mrp).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`badge ${v.currentStock <= v.minimumStock ? "badge-low" : "badge-ok"}`}>
                      {v.currentStock}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${v.isActive ? "badge-ok" : "badge-low"}`}>
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/products/${v.productId}/edit`}
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
