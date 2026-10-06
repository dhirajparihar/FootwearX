import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CreditCard,
  History,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";

const actions = [
  { href: "/purchases", label: "Purchases", icon: Truck, description: "Supplier invoices and stock intake" },
  { href: "/sales", label: "Sales", icon: ShoppingCart, description: "Billing and sold items" },
  { href: "/udhaar", label: "Udhaar", icon: CreditCard, description: "Outstanding balances and collections" },
  { href: "/customers", label: "Customers", icon: Users, description: "Customer history and dues" },
  { href: "/suppliers", label: "Suppliers", icon: Boxes, description: "Vendor accounts and purchases" },
  { href: "/reports", label: "Reports", icon: BarChart3, description: "Revenue, stock and profit" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Shop configuration and profile" },
];

export default async function MorePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6 p-1 md:p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight">More</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          {user.role}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border bg-muted/60 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{description}</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {user.role !== "STAFF" && (
          <Link
            href="/inventory/movements"
            className="group block rounded-xl border border-dashed bg-muted/30 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border bg-background p-2 text-primary">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Stock history</div>
                  <div className="mt-1 text-xs text-muted-foreground">Inventory movement log and adjustments</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Package className="h-4 w-4 text-primary" />
          Quick access
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the retail operations modules for transactions, stock, customers, and reports from one consistent workflow.
        </p>
      </div>
    </div>
  );
}
