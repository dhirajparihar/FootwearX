"use server";

import { redirect } from "next/navigation";
import {
  adjustStock,
  damageStock,
  receivePurchase,
  returnSale,
  returnPurchase,
} from "@/services/inventory";
import { requirePermission } from "@/lib/auth";

export async function adjust(formData: FormData) {
  const user = await requirePermission("manage_stock");
  await adjustStock({
    variantId: String(formData.get("variantId")),
    delta: Number(formData.get("delta")),
    note: String(formData.get("note") || ""),
    userId: user.id,
    shopId: user.shopId,
  });
  redirect("/inventory");
}

export async function damage(formData: FormData) {
  const user = await requirePermission("manage_stock");
  await damageStock({
    variantId: String(formData.get("variantId")),
    quantity: Number(formData.get("quantity")),
    note: String(formData.get("note") || "Damage"),
    userId: user.id,
    shopId: user.shopId,
  });
  redirect("/inventory");
}

export async function createPurchase(input: Omit<Parameters<typeof receivePurchase>[0], "userId" | "shopId">) {
  const user = await requirePermission("manage_stock");
  return receivePurchase({ ...input, userId: user.id, shopId: user.shopId });
}

export async function createSaleReturn(input: Omit<Parameters<typeof returnSale>[0], "userId" | "shopId">) {
  const user = await requirePermission("sell");
  return returnSale({ ...input, userId: user.id, shopId: user.shopId });
}

export async function createPurchaseReturn(input: Omit<Parameters<typeof returnPurchase>[0], "userId" | "shopId">) {
  const user = await requirePermission("manage_stock");
  return returnPurchase({ ...input, userId: user.id, shopId: user.shopId });
}
