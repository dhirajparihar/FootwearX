"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Box, Package, Users, Building2, BarChart3, Settings, CreditCard, History } from "lucide-react";

export function DesktopSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/pos", label: "Billing", icon: ReceiptText },
    { href: "/products", label: "Products", icon: Box },
    { href: "/inventory", label: "Stock", icon: Package },
    { href: "/purchases", label: "Purchases", icon: History },
    { href: "/sales", label: "Sales", icon: CreditCard },
    { href: "/udhaar", label: "Udhaar", icon: ReceiptText },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/suppliers", label: "Suppliers", icon: Building2 },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (role !== "STAFF") {
    links.push({ href: "/inventory/movements", label: "Stock History", icon: History });
  }

  return (
    <aside className="hidden md:flex w-[216px] flex-col border-r bg-background/50 h-screen sticky top-0 px-3 py-4 gap-4">
      <div className="px-2">
        <h1 className="text-xl font-semibold tracking-tight">FootwearX</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-2 pb-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs text-primary">{role[0]}</span>
          </div>
          <span className="truncate">{role} User</span>
        </div>
      </div>
    </aside>
  );
}
