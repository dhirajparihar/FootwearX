import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProductListClient } from "@/components/products/product-list-client";

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await prisma.product.findMany({
    include: {
      brand: true,
      category: true,
      variants: { orderBy: { size: "asc" } }
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    where: { shopId: user.shopId }
  });

  // Sort sizes numerically
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size), nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const serialized = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand.name,
    category: p.category.name,
    gender: p.gender,
    isActive: p.isActive,
    price: p.variants[0] ? Number(p.variants[0].sellingPrice) : 0,
    totalStock: p.variants.reduce((s, v) => s + v.currentStock, 0),
    variantCount: p.variants.length,
    variants: p.variants.map(v => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.currentStock,
      minStock: v.minimumStock,
    })),
  }));

  return (
    <div className="space-y-4 pb-20 sm:pb-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} models in catalogue</p>
        </div>
        <Button asChild size="sm">
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductListClient products={serialized} />
    </div>
  );
}
