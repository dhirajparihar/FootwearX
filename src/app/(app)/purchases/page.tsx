import { prisma } from "@/lib/prisma";

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    include: { supplier: true, items: true },
    orderBy: { purchaseDate: "desc" },
    take: 100
  });

  return (
    <div className="content">
      <h1>Purchases</h1>
      <p className="muted">Supplier purchases received into stock.</p>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="table-wrap"><table>
          <thead><tr><th>Invoice</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{purchases.map(p => <tr key={p.id}>
            <td>{p.invoiceNumber}</td>
            <td>{p.purchaseDate.toLocaleDateString("en-IN")}</td>
            <td>{p.supplier.name}</td>
            <td>{p.items.reduce((n, i) => n + i.quantity, 0)}</td>
            <td>₹{Number(p.total).toLocaleString("en-IN")}</td>
            <td>{p.status} <a className="btn btn-small" href={`/purchases/${p.id}/return`}>Return</a></td>
          </tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
