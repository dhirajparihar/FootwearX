import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
  const { id } = await params;
  
  const customer = await prisma.customer.findFirst({
    where: { id,
        shopId: user.shopId
    },
    include: {
      sales: {
        include: {
          items: { include: { variant: { include: { product: { include: { brand: true } } } } } },
          payments: true,
          returns: { include: { items: true } }
        },
        orderBy: { saleDate: 'desc' }
      }
    }
  });

  if (!customer) notFound();

  let lifetimeValue = 0;
  let totalPending = 0;
  let sizes = new Map<string, number>();

  customer.sales.forEach(sale => {
    const saleTotal = Number(sale.total);
    const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
    const returned = sale.returns.reduce((s, r) => s + Number(r.refundAmount), 0);
    
    lifetimeValue += (saleTotal - returned);
    if (paid < saleTotal - 0.01) {
      totalPending += (saleTotal - paid);
    }

    sale.items.forEach(i => {
      sizes.set(i.variant.size, (sizes.get(i.variant.size) || 0) + i.quantity);
    });
  });

  const bestSize = Array.from(sizes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  return (
    <div className="content">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: "4px" }}>{customer.name}</h1>
          <p className="muted">{customer.phone} {customer.email ? `• ${customer.email}` : ''}</p>
        </div>
        <Link href="/customers" className="btn">Back to Customers</Link>
      </div>

      <div className="grid grid-3" style={{ marginTop: "16px", marginBottom: "24px" }}>
        <div className="card">
          <div className="metric-label">Lifetime Value</div>
          <div className="metric">₹{lifetimeValue.toLocaleString("en-IN")}</div>
        </div>
        <div className="card" style={{ borderLeft: totalPending > 0 ? "4px solid var(--danger)" : "4px solid var(--success)" }}>
          <div className="metric-label">Udhaar Balance</div>
          <div className="metric" style={{ color: totalPending > 0 ? "var(--danger)" : "inherit" }}>
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="card">
          <div className="metric-label">Preferred Size</div>
          <div className="metric">{bestSize}</div>
        </div>
      </div>

      <div className="card">
        <h2>Purchase History</h2>
        {customer.sales.length === 0 ? (
          <p className="muted">No purchases yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.sales.map(sale => {
                  const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
                  const isUdhaar = paid < Number(sale.total) - 0.01;
                  const hasReturns = sale.returns.length > 0;

                  return (
                    <tr key={sale.id}>
                      <td>{format(sale.saleDate, "dd MMM yyyy")}</td>
                      <td><Link href={`/sales/${sale.id}`}>{sale.invoiceNumber}</Link></td>
                      <td>
                        {sale.items.map(i => (
                          <div key={i.id} style={{ fontSize: "12px", marginBottom: "4px" }}>
                            {i.quantity}x {i.variant.product.brand.name} {i.variant.product.name} (Size {i.variant.size})
                          </div>
                        ))}
                      </td>
                      <td>₹{Number(sale.total).toLocaleString("en-IN")}</td>
                      <td>
                        {hasReturns ? (
                          <span className="badge badge-warning">Returned</span>
                        ) : isUdhaar ? (
                          <span className="badge badge-danger">Udhaar</span>
                        ) : (
                          <span className="badge badge-ok">Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
