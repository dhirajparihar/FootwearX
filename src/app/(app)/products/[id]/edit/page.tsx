import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProductDetails } from "@/app/actions/products";
import { EditProductForm } from "@/components/products/edit-product-form";
import { requireUser } from "@/lib/auth";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id,
        shopId: user.shopId,
      },
      include: {
        variants: {
          orderBy: { size: "asc" },
        },
      },
    }),
    prisma.brand.findMany({
      where: {
        isActive: true,
        shopId: user.shopId,
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        shopId: user.shopId,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const formattedProduct = {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      purchasePrice: Number(v.purchasePrice),
      sellingPrice: Number(v.sellingPrice),
      mrp: Number(v.mrp),
    })),
  };

  const totalStock = formattedProduct.variants.reduce((sum, variant) => sum + variant.currentStock, 0);
  const activeVariants = formattedProduct.variants.filter((variant) => variant.isActive).length;
  const lowStockCount = formattedProduct.variants.filter(
    (variant) => variant.currentStock <= variant.minimumStock
  ).length;

  return (
    <div className="content">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Catalog / product</p>
          <h1>{product.name}</h1>
          <p className="muted">
            Update product identity, pricing, and size-level availability in one place.
          </p>
        </div>
        <div className="pill">{formattedProduct.variants.length} sizes</div>
      </header>

      <div className="product-summary">
        <div className="stat-card">
          <span className="stat-card__label">Stock on hand</span>
          <span className="stat-card__value">{totalStock}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Active variants</span>
          <span className="stat-card__value">{activeVariants}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Low stock</span>
          <span className="stat-card__value">{lowStockCount}</span>
        </div>
      </div>

      <EditProductForm
        product={formattedProduct}
        brands={brands}
        categories={categories}
        updateAction={updateProductDetails}
      />
    </div>
  );
}
