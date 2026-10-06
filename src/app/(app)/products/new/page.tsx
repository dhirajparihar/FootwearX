import { prisma } from "@/lib/prisma";
import { SizeMatrixForm } from "@/components/products/size-matrix-form";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="content">
      <h1>Add Product (Size-Matrix Batch Creation)</h1>
      <p className="muted">
        Create footwear products with single-click size matrix generation (Sizes 6-12) or custom SKUs.
      </p>

      <SizeMatrixForm brands={brands} categories={categories} />
    </div>
  );
}
