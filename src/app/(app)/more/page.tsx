import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function MorePage() {
  const user = await requireUser();
  return (
    <div className="content">
      <h1>More</h1>
      <div className="grid grid-2">
        <Link href="/purchases" className="card row" style={{ fontSize: "16px" }}>
          <span>🚚 Purchases</span>
          <span className="muted">➔</span>
        </Link>
        <Link href="/sales" className="card row" style={{ fontSize: "16px" }}>
          <span>💳 Sales</span>
          <span className="muted">➔</span>
        </Link>
        <Link href="/udhaar" className="card row" style={{ fontSize: "16px", borderColor: "#fde68a", background: "#fef3c7" }}>
          <span style={{ color: "#b45309", fontWeight: "bold" }}>📝 Udhaar (Credit)</span>
          <span className="muted" style={{ color: "#b45309" }}>➔</span>
        </Link>
        <Link href="/customers" className="card row" style={{ fontSize: "16px" }}>
          <span>👤 Customers</span>
          <span className="muted">➔</span>
        </Link>
        <Link href="/suppliers" className="card row" style={{ fontSize: "16px" }}>
          <span>🏢 Suppliers</span>
          <span className="muted">➔</span>
        </Link>
        <Link href="/reports" className="card row" style={{ fontSize: "16px" }}>
          <span>📈 Reports</span>
          <span className="muted">➔</span>
        </Link>
        <Link href="/settings" className="card row" style={{ fontSize: "16px" }}>
          <span>⚙️ Settings</span>
          <span className="muted">➔</span>
        </Link>
        {user.role !== "STAFF" && (
          <Link href="/inventory/movements" className="card row" style={{ fontSize: "16px" }}>
            <span>📒 Stock History</span>
            <span className="muted">➔</span>
          </Link>
        )}
      </div>
    </div>
  );
}
