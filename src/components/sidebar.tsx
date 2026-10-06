import Link from "next/link";
export function Sidebar({role}:{role:string}){
  return (
    <aside className="app-nav">
      <div className="logo desktop-only">FootwearX</div>
      <Link href="/dashboard"><span className="icon">🏠</span><span>Home</span></Link>
      <Link href="/pos"><span className="icon">🧾</span><span>Billing</span></Link>
      <Link href="/products"><span className="icon">👟</span><span>Products</span></Link>
      <Link href="/inventory"><span className="icon">📦</span><span>Stock</span></Link>
      <Link href="/more" className="mobile-only"><span className="icon">☰</span><span>More</span></Link>

      <div className="desktop-only desktop-nav-group">
        <Link href="/purchases"><span className="icon">🚚</span><span>Purchases</span></Link>
        <Link href="/sales"><span className="icon">💳</span><span>Sales</span></Link>
        <Link href="/udhaar"><span className="icon">📝</span><span>Udhaar</span></Link>
        <Link href="/customers"><span className="icon">👤</span><span>Customers</span></Link>
        <Link href="/suppliers"><span className="icon">🏢</span><span>Suppliers</span></Link>
        <Link href="/reports"><span className="icon">📈</span><span>Reports</span></Link>
        <Link href="/settings"><span className="icon">⚙️</span><span>Settings</span></Link>
        {role !== "STAFF" && <Link href="/inventory/movements"><span className="icon">📒</span><span>Stock History</span></Link>}
      </div>
    </aside>
  );
}
