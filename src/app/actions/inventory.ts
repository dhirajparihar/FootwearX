"use server";

import { redirect } from "next/navigation";
import {
  adjustStock,
  damageStock,
  receivePurchase,
  returnSale,
  returnPurchase,
} from "@/services/inventory";
import { requireRole } from "@/lib/auth";

export async function adjust(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  await adjustStock({
    variantId: String(formData.get("variantId")),
    delta: Number(formData.get("delta")),
    note: String(formData.get("note") || ""),
    userId: user.id,
  });
  redirect("/inventory");
}

export async function damage(formData: FormData) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  await damageStock({
    variantId: String(formData.get("variantId")),
    quantity: Number(formData.get("quantity")),
    note: String(formData.get("note") || "Damage"),
    userId: user.id,
  });
  redirect("/inventory");
}

export async function createPurchase(input: Parameters<typeof receivePurchase>[0]) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  return receivePurchase({ ...input, userId: user.id });
}

export async function createSaleReturn(input: Parameters<typeof returnSale>[0]) {
  const user = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  return returnSale({ ...input, userId: user.id });
}

export async function createPurchaseReturn(input: Parameters<typeof returnPurchase>[0]) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  return returnPurchase({ ...input, userId: user.id });
}
