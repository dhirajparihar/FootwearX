import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProductListClient } from "@/components/products/product-list-client";

const PAGE_SIZE = 50;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1) || 1, 1);

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: user.shopId },
      select: {
        id: true,
        name: true,
        gender: true,
        isActive: true,
        updatedAt: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        variants: {
          orderBy: { size: "asc" },
          select: {
            id: true,
            size: true,
            color: true,
            currentStock: true,
            minimumStock: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where: { shopId: user.shopId } }),
  ]);

  products.forEach((product) => {
    product.variants.sort((a, b) => {
      const na = parseFloat(a.size), nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const serialized = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand.name,
    category: product.category.name,
    gender: product.gender,
    isActive: product.isActive,
    price: product.variants[0] ? Number(product.variants[0].sellingPrice) : 0,
    totalStock: product.variants.reduce((sum, variant) => sum + variant.currentStock, 0),
    variantCount: product.variants.length,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: variant.currentStock,
      minStock: variant.minimumStock,
    })),
  }));

  return (
    <div className="space-y-4 pb-20 sm:pb-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{totalProducts} models in catalogue</p>
        </div>
        <Button asChild size="sm">
          <Link href="/products/new" prefetch={false}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductListClient products={serialized} />
    </div>
  );
}
