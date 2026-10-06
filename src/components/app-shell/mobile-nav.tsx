"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Box, Package, Menu } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/pos", label: "Billing", icon: ReceiptText },
    { href: "/products", label: "Products", icon: Box },
    { href: "/inventory", label: "Stock", icon: Package },
    { href: "/more", label: "More", icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 px-2 py-2 safe-area-bottom pb-4">
      <div className="flex justify-around items-center">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
                {isActive && (
                  <span className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
