import { prisma } from "@/lib/prisma";
import { SizeMatrixForm } from "@/components/products/size-matrix-form";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
        <p className="text-muted-foreground mt-1">
          Create footwear products with single-click size matrix generation (Sizes 6-12) or custom SKUs.
        </p>
      </div>

      <SizeMatrixForm brands={brands} categories={categories} />
    </div>
  );
}
