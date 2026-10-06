"use client";

import { useMemo, useState, useTransition } from "react";
import { completeSale } from "@/app/actions/sales";
import { ProductPicker } from "./pos/product-picker";
import { BillCart } from "./pos/bill-cart";
import { PaymentSheet } from "./pos/payment-sheet";
import { toast } from "sonner";

export type Variant = { id: string; sku: string; barcode: string; name: string; size: string; color: string; stock: number; price: number };
export type Customer = { id: string; name: string; phone: string };

export function POS({ variants, customers }: { variants: Variant[], customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [pending, start] = useTransition();

  // Group variants by name + color
  const grouped = useMemo(() => {
    const x = q.trim().toLowerCase();
    const filtered = x ? variants.filter(v => `${v.name} ${v.sku} ${v.barcode} ${v.size} ${v.color}`.toLowerCase().includes(x)) : variants;
    
    const map = new Map<string, { name: string, price: number, color: string, sizes: Variant[] }>();
    for (const v of filtered) {
      const key = `${v.name}-${v.color}`;
      if (!map.has(key)) map.set(key, { name: v.name, price: v.price, color: v.color, sizes: [] });
      map.get(key)!.sizes.push(v);
    }
    
    map.forEach(group => {
      group.sizes.sort((a, b) => {
        const na = parseFloat(a.size);
        const nb = parseFloat(b.size);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.size.localeCompare(b.size);
      });
    });
    return Array.from(map.values());
  }, [q, variants]);

  const lines = Object.entries(cart).map(([id, qty]) => {
    const v = variants.find(x => x.id === id)!;
    return { ...v, qty };
  });
  
  const subtotal = lines.reduce((n, x) => n + x.qty * x.price, 0);
  const total = Math.max(0, subtotal - discount);

  function add(v: Variant) {
    setCart(c => ({ ...c, [v.id]: Math.min((c[v.id] ?? 0) + 1, v.stock) }));
  }

  function dec(id: string) {
    setCart(c => {
      const n = { ...c };
      if ((n[id] ?? 0) <= 1) delete n[id];
      else n[id]--;
      return n;
    });
  }

  function handleCheckout(payload: {
    payments: { method: "CASH" | "UPI" | "CARD" | "OTHER", amount: number }[];
    dueDate?: Date;
  }) {
    start(async () => {
      const r = await completeSale({
        customerId: customerId || undefined,
        items: lines.map(x => ({ variantId: x.id, quantity: x.qty, unitPrice: x.price })),
        discount,
        tax: 0,
        payments: payload.payments,
        dueDate: payload.dueDate,
      });
      if (r.ok) {
        window.location.href = `/sales/${r.saleId}`;
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <ProductPicker 
          q={q} 
          setQ={setQ} 
          grouped={grouped} 
          onAdd={add} 
        />
      </div>

      <div className="lg:w-[400px]">
        <div className="sticky top-[88px] space-y-4">
          <BillCart 
            lines={lines}
            customers={customers}
            customerId={customerId}
            setCustomerId={setCustomerId}
            discount={discount}
            setDiscount={setDiscount}
            subtotal={subtotal}
            total={total}
            onAdd={add}
            onDec={dec}
            onCheckout={() => setIsPaymentOpen(true)}
          />
        </div>
      </div>

      <PaymentSheet 
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={total}
        hasCustomer={!!customerId}
        pending={pending}
        onComplete={handleCheckout}
      />
    </div>
  );
}
