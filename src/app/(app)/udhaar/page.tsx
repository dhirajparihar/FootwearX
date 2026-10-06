import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function UdhaarPage() {
  const sales = await prisma.sale.findMany({
    where: { 
      status: "COMPLETED",
      dueDate: { not: null }
    },
    include: {
      customer: true,
      payments: true
    },
    orderBy: { dueDate: 'asc' }
  });

  const activeCredits = sales.filter(s => {
    const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return paid < Number(s.total) - 0.01;
  });

  let totalDue = 0;

  return (
    <div className="content">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: "4px" }}>Customer Udhaar</h1>
          <p className="muted">Track pending customer payments and due dates.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        {activeCredits.length === 0 ? (
          <p className="muted">No pending customer payments.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Bill Total</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeCredits.map(sale => {
                  const total = Number(sale.total);
                  const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const due = total - paid;
                  totalDue += due;

                  const isOverdue = sale.dueDate && sale.dueDate < new Date();

                  return (
                    <tr key={sale.id}>
                      <td>
                        <strong>{sale.customer?.name}</strong><br />
                        <span className="muted" style={{ fontSize: "12px" }}>{sale.customer?.phone}</span>
                      </td>
                      <td>
                        <Link href={`/sales/${sale.id}`}>{sale.invoiceNumber}</Link>
                      </td>
                      <td>₹{total.toLocaleString("en-IN")}</td>
                      <td>₹{paid.toLocaleString("en-IN")}</td>
                      <td style={{ color: "var(--danger)", fontWeight: "bold" }}>₹{due.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={isOverdue ? "badge badge-danger" : "badge badge-ok"}>
                          {sale.dueDate ? format(sale.dueDate, "dd MMM yyyy") : "N/A"}
                        </span>
                      </td>
                      <td>
                        <Link href={`/sales/${sale.id}`} className="btn">Collect</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeCredits.length > 0 && (
        <div style={{ marginTop: "16px", padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "18px", color: "#991b1b" }}>Total Udhaar Pending in Market</span>
          <strong style={{ fontSize: "24px", color: "#991b1b" }}>₹{totalDue.toLocaleString("en-IN")}</strong>
        </div>
      )}
    </div>
  );
}
