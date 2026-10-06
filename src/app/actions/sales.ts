"use server";

import { z } from "zod";
import { createSale } from "@/services/inventory";
import { requirePermission } from "@/lib/auth";

const saleSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1, "Cart cannot be empty"),
  customerId: z.string().uuid().optional(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  dueDate: z.coerce.date().optional(),
  payments: z.array(z.object({
    method: z.enum(["CASH", "UPI", "CARD", "OTHER"]),
    amount: z.number().nonnegative(),
    referenceNumber: z.string().optional(),
  })).default([]),
});

export async function completeSale(input: unknown) {
  try {
    const user = await requirePermission("sell");
    const data = saleSchema.parse(input);
    const sale = await createSale({ ...data, userId: user.id, shopId: user.shopId });

    return { ok: true as const, invoiceNumber: sale.invoiceNumber, saleId: sale.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Sale operation failed.",
    };
  }
}
