import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import type { Prisma } from "../../generated/prisma/client";

function money(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export async function adjustStock(input: {
  variantId: string;
  delta: number;
  userId: string;
  note?: string;
}) {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error("Stock adjustment must be a non-zero integer.");
  }

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      select: { id: true, currentStock: true, purchasePrice: true },
    });

    if (!variant) {
      throw new Error("SKU not found.");
    }

    if (input.delta < 0 && variant.currentStock < Math.abs(input.delta)) {
      throw new Error("Insufficient stock.");
    }

    const updated = await tx.productVariant.updateMany({
      where: {
        id: variant.id,
        ...(input.delta < 0 ? { currentStock: { gte: Math.abs(input.delta) } } : {}),
      },
      data: { currentStock: { increment: input.delta } },
    });

    if (updated.count !== 1) {
      throw new Error("Stock changed concurrently. Please retry.");
    }

    const movement = await tx.stockMovement.create({
      data: {
        variantId: variant.id,
        type: input.delta > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
        quantity: input.delta,
        referenceType: "ADJUSTMENT",
        unitCost: variant.purchasePrice,
        note: input.note,
        createdBy: input.userId,
      },
    });

    await audit(tx, {
      userId: input.userId,
      action: "STOCK_ADJUSTMENT",
      entityType: "ProductVariant",
      entityId: variant.id,
      newData: { delta: input.delta, note: input.note },
    });

    return movement;
  });
}

export async function damageStock(input: {
  variantId: string;
  quantity: number;
  note?: string;
  userId: string;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Damage quantity must be a positive integer.");
  }

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      select: { currentStock: true, purchasePrice: true },
    });

    if (!variant || variant.currentStock < input.quantity) {
      throw new Error("Insufficient stock.");
    }

    const updated = await tx.productVariant.updateMany({
      where: { id: input.variantId, currentStock: { gte: input.quantity } },
      data: { currentStock: { decrement: input.quantity } },
    });

    if (updated.count !== 1) {
      throw new Error("Stock changed concurrently. Please retry.");
    }

    return tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        type: "DAMAGE",
        quantity: -input.quantity,
        unitCost: variant.purchasePrice,
        note: input.note || "Damage",
        createdBy: input.userId,
      },
    });
  });
}

export async function receivePurchase(input: {
  supplierId: string;
  invoiceNumber: string;
  userId: string;
  items: Array<{ variantId: string; quantity: number; unitCost: number }>;
  discount?: number;
  tax?: number;
}) {
  if (!input.items.length) {
    throw new Error("Purchase must contain items.");
  }

  return prisma.$transaction(async (tx) => {
    const unique = new Set(input.items.map((x) => x.variantId));
    if (unique.size !== input.items.length) {
      throw new Error("Duplicate SKU found in purchase order.");
    }

    let subtotal = 0;
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.unitCost < 0) {
        throw new Error("Invalid purchase item details.");
      }
      subtotal += item.quantity * item.unitCost;
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant || !variant.isActive) {
        throw new Error("SKU not found or is inactive.");
      }
    }

    const discount = money(input.discount ?? 0);
    const tax = money(input.tax ?? 0);
    const total = money(subtotal - discount + tax);

    if (discount < 0 || discount > subtotal) {
      throw new Error("Invalid discount amount.");
    }

    const purchase = await tx.purchase.create({
      data: {
        supplierId: input.supplierId,
        createdBy: input.userId,
        invoiceNumber: input.invoiceNumber,
        purchaseDate: new Date(),
        subtotal,
        discount,
        tax,
        total,
        status: "COMPLETED",
      },
    });

    for (const item of input.items) {
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: money(item.quantity * item.unitCost),
        },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          currentStock: { increment: item.quantity },
          purchasePrice: item.unitCost,
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "PURCHASE",
          quantity: item.quantity,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          unitCost: item.unitCost,
          createdBy: input.userId,
        },
      });
    }

    await audit(tx, {
      userId: input.userId,
      action: "PURCHASE_RECEIVED",
      entityType: "Purchase",
      entityId: purchase.id,
      newData: { invoiceNumber: purchase.invoiceNumber, total },
    });

    return purchase;
  });
}

export async function createSale(input: {
  customerId?: string;
  userId: string;
  items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  payments: Array<{
    method: "CASH" | "UPI" | "CARD" | "OTHER";
    amount: number;
    referenceNumber?: string;
  }>;
  discount?: number;
  tax?: number;
}) {
  if (!input.items.length) throw new Error("Cart is empty.");
  if (!input.payments.length) throw new Error("Payment is required.");

  return prisma.$transaction(async (tx) => {
    const unique = new Set(input.items.map((x) => x.variantId));
    if (unique.size !== input.items.length) {
      throw new Error("Duplicate SKU in cart.");
    }

    let subtotal = 0;
    const variants: Array<{ id: string; purchasePrice: Prisma.Decimal }> = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.unitPrice < 0) {
        throw new Error("Invalid sale item line.");
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { id: true, currentStock: true, isActive: true, purchasePrice: true },
      });

      if (!variant || !variant.isActive) {
        throw new Error("SKU not found or is inactive.");
      }

      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, isActive: true, currentStock: { gte: item.quantity } },
        data: { currentStock: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new Error("Insufficient stock for selected SKU.");
      }

      variants.push(variant);
      subtotal += item.quantity * item.unitPrice;
    }

    const discount = money(input.discount ?? 0);
    const tax = money(input.tax ?? 0);
    const total = money(subtotal - discount + tax);

    if (discount < 0 || discount > subtotal) {
      throw new Error("Invalid discount amount.");
    }

    const paid = money(input.payments.reduce((sum, p) => sum + p.amount, 0));
    if (Math.abs(paid - total) > 0.009) {
      throw new Error(`Total payment ₹${paid.toFixed(2)} must equal net total ₹${total.toFixed(2)}.`);
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Customer not found.");
    }

    const settings = await tx.shopSettings.findFirst();
    if (!settings) throw new Error("Shop settings not configured.");

    const updatedSettings = await tx.shopSettings.update({
      where: { id: settings.id },
      data: { nextInvoiceNo: { increment: 1 } },
    });
    const invoiceNo = updatedSettings.nextInvoiceNo - 1;
    const invoiceNumber = `${settings.invoicePrefix}-${String(invoiceNo).padStart(6, "0")}`;

    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        customerId: input.customerId,
        createdBy: input.userId,
        subtotal,
        discount,
        tax,
        total,
        status: "COMPLETED",
      },
    });

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: money(item.quantity * item.unitPrice),
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALE",
          quantity: -item.quantity,
          referenceType: "SALE",
          referenceId: sale.id,
          unitCost: variants[i].purchasePrice,
          createdBy: input.userId,
        },
      });
    }

    for (const payment of input.payments) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: payment.method,
          amount: money(payment.amount),
          referenceNumber: payment.referenceNumber,
        },
      });
    }

    await audit(tx, {
      userId: input.userId,
      action: "SALE_COMPLETED",
      entityType: "Sale",
      entityId: sale.id,
      newData: { invoiceNumber, total },
    });

    return sale;
  });
}

export async function returnSale(input: {
  saleId: string;
  userId: string;
  items: Array<{ saleItemId: string; quantity: number }>;
  reason?: string;
}) {
  if (!input.items.length) throw new Error("Return must contain items.");

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: input.saleId },
      include: { items: true },
    });

    if (!sale || sale.status !== "COMPLETED") {
      throw new Error("Sale record not found.");
    }

    let refund = 0;
    const saleReturn = await tx.saleReturn.create({
      data: {
        saleId: sale.id,
        createdBy: input.userId,
        reason: input.reason,
        refundAmount: 0,
      },
    });

    for (const itemInput of input.items) {
      const item = sale.items.find((i) => i.id === itemInput.saleItemId);
      if (!item || !Number.isInteger(itemInput.quantity) || itemInput.quantity <= 0) {
        throw new Error("Invalid return item quantity.");
      }

      const already = await tx.saleReturnItem.aggregate({
        _sum: { quantity: true },
        where: { saleItemId: item.id },
      });

      const returned = Number(already._sum.quantity ?? 0);
      if (returned + itemInput.quantity > item.quantity) {
        throw new Error("Returned quantity cannot exceed original quantity sold.");
      }

      refund += itemInput.quantity * Number(item.unitPrice);

      await tx.saleReturnItem.create({
        data: {
          saleReturnId: saleReturn.id,
          saleItemId: item.id,
          variantId: item.variantId,
          quantity: itemInput.quantity,
        },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { currentStock: { increment: itemInput.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALE_RETURN",
          quantity: itemInput.quantity,
          referenceType: "SALE_RETURN",
          referenceId: saleReturn.id,
          createdBy: input.userId,
        },
      });
    }

    refund = money(refund);
    const updated = await tx.saleReturn.update({
      where: { id: saleReturn.id },
      data: { refundAmount: refund },
    });

    await audit(tx, {
      userId: input.userId,
      action: "SALE_RETURN",
      entityType: "SaleReturn",
      entityId: saleReturn.id,
      newData: { refund },
    });

    return updated;
  });
}

export async function returnPurchase(input: {
  purchaseId: string;
  userId: string;
  items: Array<{ purchaseItemId: string; quantity: number }>;
  reason?: string;
}) {
  if (!input.items.length) throw new Error("Return must contain items.");

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: input.purchaseId },
      include: { items: true },
    });

    if (!purchase || purchase.status !== "COMPLETED") {
      throw new Error("Purchase order not found.");
    }

    let refund = 0;
    const purchaseReturn = await tx.purchaseReturn.create({
      data: {
        purchaseId: purchase.id,
        createdBy: input.userId,
        reason: input.reason,
        refundAmount: 0,
      },
    });

    for (const itemInput of input.items) {
      const item = purchase.items.find((i) => i.id === itemInput.purchaseItemId);
      if (!item || !Number.isInteger(itemInput.quantity) || itemInput.quantity <= 0) {
        throw new Error("Invalid return item details.");
      }

      const already = await tx.purchaseReturnItem.aggregate({
        _sum: { quantity: true },
        where: { purchaseItemId: item.id },
      });

      if (Number(already._sum.quantity ?? 0) + itemInput.quantity > item.quantity) {
        throw new Error("Returned quantity exceeds purchased quantity.");
      }

      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, currentStock: { gte: itemInput.quantity } },
        data: { currentStock: { decrement: itemInput.quantity } },
      });

      if (updated.count !== 1) {
        throw new Error("Insufficient inventory for purchase return.");
      }

      refund += itemInput.quantity * Number(item.unitCost);

      await tx.purchaseReturnItem.create({
        data: {
          purchaseReturnId: purchaseReturn.id,
          purchaseItemId: item.id,
          variantId: item.variantId,
          quantity: itemInput.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "PURCHASE_RETURN",
          quantity: -itemInput.quantity,
          referenceType: "PURCHASE_RETURN",
          referenceId: purchaseReturn.id,
          createdBy: input.userId,
        },
      });
    }

    refund = money(refund);
    const updated = await tx.purchaseReturn.update({
      where: { id: purchaseReturn.id },
      data: { refundAmount: refund },
    });

    await audit(tx, {
      userId: input.userId,
      action: "PURCHASE_RETURN",
      entityType: "PurchaseReturn",
      entityId: purchaseReturn.id,
      newData: { refund },
    });

    return updated;
  });
}
