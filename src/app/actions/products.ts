"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const singleProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    modelCode: z.string().optional(),
    brandId: z.string().uuid("Select a valid brand"),
    categoryId: z.string().uuid("Select a valid category"),
    gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]),
    size: z.string().min(1, "Size is required"),
    color: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional(),
    purchasePrice: z.coerce.number().nonnegative("Price cannot be negative"),
    sellingPrice: z.coerce.number().nonnegative("Price cannot be negative"),
    mrp: z.coerce.number().nonnegative("MRP cannot be negative"),
    openingStock: z.coerce.number().int().nonnegative(),
    minimumStock: z.coerce.number().int().nonnegative(),
  })
  .refine((data) => data.mrp >= data.sellingPrice, {
    message: "MRP should be greater than or equal to selling price",
    path: ["mrp"],
  });

const variantItemSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  openingStock: z.number().int().nonnegative(),
  minimumStock: z.number().int().nonnegative(),
});

const batchProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  modelCode: z.string().optional(),
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]),
  variants: z.array(variantItemSchema).min(1, "At least one size variant is required"),
});

export async function createProduct(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const data = singleProductSchema.parse(Object.fromEntries(formData.entries()));

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        shopId: user.shopId,
        name: data.name,
        modelCode: data.modelCode || undefined,
        brandId: data.brandId,
        categoryId: data.categoryId,
        gender: data.gender,
      },
    });

    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        sku: data.sku,
        barcode: data.barcode || undefined,
        size: data.size,
        color: data.color || undefined,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        mrp: data.mrp,
        currentStock: data.openingStock,
        minimumStock: data.minimumStock,
      },
    });

    if (data.openingStock > 0) {
      await tx.stockMovement.create({
        data: {
          shopId: user.shopId,
          variantId: variant.id,
          type: "ADJUSTMENT_IN",
          quantity: data.openingStock,
          referenceType: "ADJUSTMENT",
          note: "Opening stock",
          createdBy: user.id,
        },
      });
    }

    await audit(tx, {
      userId: user.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      newData: { name: data.name, sku: data.sku },
    });
  });

  redirect("/products");
}

export async function createBatchProduct(input: unknown) {
  try {
    const user = await requireRole(["OWNER", "MANAGER"]);
    const data = batchProductSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          shopId: user.shopId,
          name: data.name,
          modelCode: data.modelCode || undefined,
          brandId: data.brandId,
          categoryId: data.categoryId,
          gender: data.gender,
        },
      });

      for (const vData of data.variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: vData.sku,
            barcode: vData.barcode || undefined,
            size: vData.size,
            color: vData.color || undefined,
            purchasePrice: vData.purchasePrice,
            sellingPrice: vData.sellingPrice,
            mrp: vData.mrp,
            currentStock: vData.openingStock,
            minimumStock: vData.minimumStock,
          },
        });

        if (vData.openingStock > 0) {
          await tx.stockMovement.create({
            data: {
              shopId: user.shopId,
              variantId: variant.id,
              type: "ADJUSTMENT_IN",
              quantity: vData.openingStock,
              referenceType: "ADJUSTMENT",
              note: "Batch opening stock",
              createdBy: user.id,
            },
          });
        }
      }

      await audit(tx, {
        userId: user.id,
        action: "PRODUCT_BATCH_CREATED",
        entityType: "Product",
        entityId: product.id,
        newData: { name: data.name, variantCount: data.variants.length },
      });

      return product;
    });

    return { ok: true as const, productId: result.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create product batch.",
    };
  }
}

// ── Inline Brand/Category creation ──────────────────────────────────────────

export async function createBrand(name: string) {
  try {
    const user = await requireRole(["OWNER", "MANAGER"]);
    const trimmed = name.trim();
    if (!trimmed) return { ok: false as const, error: "Brand name is required." };

    const brand = await prisma.brand.upsert({
      where: { shopId_name: { shopId: user.shopId, name: trimmed } },
      update: { isActive: true },
      create: { shopId: user.shopId, name: trimmed },
    });

    return { ok: true as const, brand: { id: brand.id, name: brand.name } };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create brand.",
    };
  }
}

export async function createCategory(name: string) {
  try {
    const user = await requireRole(["OWNER", "MANAGER"]);
    const trimmed = name.trim();
    if (!trimmed) return { ok: false as const, error: "Category name is required." };

    const category = await prisma.category.upsert({
      where: { shopId_name: { shopId: user.shopId, name: trimmed } },
      update: { isActive: true },
      create: { shopId: user.shopId, name: trimmed },
    });

    return { ok: true as const, category: { id: category.id, name: category.name } };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}

// ── Existing actions ─────────────────────────────────────────────────────────

export async function updateProductDetails(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);

  const productId = String(formData.get("productId"));
  const name = String(formData.get("name")).trim();
  const modelCode = String(formData.get("modelCode") || "").trim();
  const brandId = String(formData.get("brandId"));
  const categoryId = String(formData.get("categoryId"));
  const gender = String(formData.get("gender")) as "MEN" | "WOMEN" | "UNISEX" | "KIDS";

  if (!productId || !name || !brandId || !categoryId) {
    throw new Error("Missing required product details");
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { id: productId, shopId: user.shopId },
      data: {
        name,
        modelCode: modelCode || null,
        brandId,
        categoryId,
        gender,
      },
    });

    await audit(tx, {
      userId: user.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: productId,
      newData: { name, modelCode, gender },
    });
  });

  redirect(`/products/${productId}/edit`);
}

export async function updateVariant(input: {
  variantId: string;
  sku: string;
  barcode?: string;
  size: string;
  color?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  minimumStock: number;
  isActive: boolean;
}) {
  try {
    const user = await requireRole(["OWNER", "MANAGER"]);

    await prisma.$transaction(async (tx) => {
      const current = await tx.productVariant.findFirst({
        where: { id: input.variantId, product: { is: { shopId: user.shopId } } },
      });
      if (!current) throw new Error("Variant not found.");

      await tx.productVariant.update({
        where: { id: input.variantId },
        data: {
          sku: input.sku,
          barcode: input.barcode || null,
          size: input.size,
          color: input.color || null,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          mrp: input.mrp,
          minimumStock: input.minimumStock,
          isActive: input.isActive,
        },
      });

      await audit(tx, {
        userId: user.id,
        action: "VARIANT_UPDATED",
        entityType: "ProductVariant",
        entityId: input.variantId,
        oldData: { sku: current.sku, sellingPrice: Number(current.sellingPrice) },
        newData: { sku: input.sku, sellingPrice: input.sellingPrice },
      });
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update variant.",
    };
  }
}

export async function addVariantToProduct(input: {
  productId: string;
  sku: string;
  barcode?: string;
  size: string;
  color?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  openingStock: number;
  minimumStock: number;
}) {
  try {
    const user = await requireRole(["OWNER", "MANAGER"]);

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: input.productId, shopId: user.shopId } });
      if (!product) throw new Error("Product not found.");

      const variant = await tx.productVariant.create({
        data: {
          productId: input.productId,
          sku: input.sku,
          barcode: input.barcode || undefined,
          size: input.size,
          color: input.color || undefined,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          mrp: input.mrp,
          currentStock: input.openingStock,
          minimumStock: input.minimumStock,
        },
      });

      if (input.openingStock > 0) {
        await tx.stockMovement.create({
          data: {
            shopId: user.shopId,
            variantId: variant.id,
            type: "ADJUSTMENT_IN",
            quantity: input.openingStock,
            referenceType: "ADJUSTMENT",
            note: "Opening stock for added variant",
            createdBy: user.id,
          },
        });
      }

      await audit(tx, {
        userId: user.id,
        action: "VARIANT_ADDED",
        entityType: "ProductVariant",
        entityId: variant.id,
        newData: { productId: input.productId, sku: input.sku, size: input.size },
      });
    });

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to add size variant.",
    };
  }
}
