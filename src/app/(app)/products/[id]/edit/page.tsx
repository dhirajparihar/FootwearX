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
      where: { id,
          shopId: user.shopId
    },
      include: {
        variants: {
          orderBy: { size: "asc" },
        },
      },
    }),
    prisma.brand.findMany({ where: { isActive: true,
        shopId: user.shopId
    }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true,
        shopId: user.shopId
    }, orderBy: { name: "asc" } }),
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

  return (
    <div className="content">
      <h1>Edit Product & Size Variants</h1>
      <p className="muted">
        Update master details for {product.name} or adjust pricing and active status for individual sizes.
      </p>

      <EditProductForm
        product={formattedProduct}
        brands={brands}
        categories={categories}
        updateAction={updateProductDetails}
      />
    </div>
  );
}
