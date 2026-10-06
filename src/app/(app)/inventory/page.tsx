import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, PlusSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { StockListClient } from "@/components/inventory/stock-list-client";

const PAGE_SIZE = 50;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1) || 1, 1);

  const [products, totalModels] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, shopId: user.shopId },
      select: {
        id: true,
        name: true,
        brand: { select: { name: true } },
        variants: {
          orderBy: { size: "asc" },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            currentStock: true,
            minimumStock: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where: { isActive: true, shopId: user.shopId } }),
  ]);

  products.forEach((product) => {
    product.variants.sort((a, b) => {
      const na = parseFloat(a.size), nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const lowStockCount = products.reduce(
    (acc, product) => acc + product.variants.filter((variant) => variant.currentStock <= variant.minimumStock && variant.currentStock > 0).length,
    0
  );
  const outOfStockCount = products.reduce(
    (acc, product) => acc + product.variants.filter((variant) => variant.currentStock === 0).length,
    0
  );
  const totalPairs = products.reduce(
    (acc, product) => acc + product.variants.reduce((sum, variant) => sum + variant.currentStock, 0),
    0
  );

  const serialized = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand.name,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.currentStock,
      minStock: variant.minimumStock,
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
            <Link href="/inventory/movements" prefetch={false}>
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Ledger
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inventory/adjust" prefetch={false}>
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
