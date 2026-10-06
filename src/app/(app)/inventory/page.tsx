import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, PlusSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { StockListClient } from "@/components/inventory/stock-list-client";

export default async function InventoryPage() {
  const user = await requireUser();
  const products = await prisma.product.findMany({
    where: { isActive: true, shopId: user.shopId },
    include: {
      brand: true,
      variants: { orderBy: { size: "asc" } }
    },
    orderBy: { name: "asc" },
  });

  // Sort sizes numerically
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size), nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const totalModels = products.length;
  const lowStockCount = products.reduce(
    (acc, p) => acc + p.variants.filter(v => v.currentStock <= v.minimumStock && v.currentStock > 0).length,
    0
  );
  const outOfStockCount = products.reduce(
    (acc, p) => acc + p.variants.filter(v => v.currentStock === 0).length,
    0
  );
  const totalPairs = products.reduce(
    (acc, p) => acc + p.variants.reduce((s, v) => s + v.currentStock, 0),
    0
  );

  const serialized = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand.name,
    variants: p.variants.map(v => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock: v.currentStock,
      minStock: v.minimumStock,
    })),
  }));

  return (
    <div className="space-y-4 pb-20 sm:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground">{totalModels} models · {totalPairs.toLocaleString("en-IN")} total pairs</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/movements">
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Ledger
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inventory/adjust">
              <PlusSquare className="h-4 w-4 mr-1.5" />
              Adjust
            </Link>
          </Button>
        </div>
      </div>

      {/* Compact stat strip */}
      <div className="grid grid-cols-3 divide-x rounded-xl border bg-background overflow-hidden">
        <div className="flex flex-col items-center justify-center py-3 px-2">
          <span className="text-2xl font-bold tabular-nums">{totalModels}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Models</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-2">
          <span className="text-2xl font-bold tabular-nums text-orange-600">{lowStockCount}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Low Stock</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-2">
          <span className="text-2xl font-bold tabular-nums text-destructive">{outOfStockCount}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Out of Stock</span>
        </div>
      </div>

      <StockListClient products={serialized} />
    </div>
  );
}
