"use client";

import { useMemo, useState, useTransition } from "react";
import { completeSale } from "@/app/actions/sales";
import { ProductPicker } from "@/components/pos/product-picker";
import { BillCart } from "@/components/pos/bill-cart";
import { PaymentSheet } from "@/components/pos/payment-sheet";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, ShoppingBag } from "lucide-react";

export type Variant = { id: string; sku: string; barcode: string; name: string; size: string; color: string; stock: number; price: number };
export type Customer = { id: string; name: string; phone: string };

export function POS({ variants, customers }: { variants: Variant[], customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [pending, start] = useTransition();

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
    <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-32px)] overflow-hidden -m-4 sm:-m-6">
      {/* LEFT: Product Workspace */}
      <div className="flex-1 flex flex-col bg-muted/10">
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          <ProductPicker 
            q={q} 
            setQ={setQ} 
            grouped={grouped} 
            onAdd={add} 
          />
        </div>
        
        {/* MOBILE: Floating Cart Bottom Bar */}
        <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 p-3 bg-background border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40 safe-area-bottom pb-4 sm:pb-3">
          {lines.length > 0 ? (
            <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
              <SheetTrigger asChild>
                <button className="w-full flex items-center justify-between bg-primary text-primary-foreground p-4 rounded-xl font-medium shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">{lines.length} Items</span>
                    <span className="text-xl font-bold">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-lg">
                    Review Bill <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col rounded-t-2xl border-x-0 border-t-0 border-b-0">
                <BillCart 
                  lines={lines} customers={customers} customerId={customerId} setCustomerId={setCustomerId}
                  discount={discount} setDiscount={setDiscount} subtotal={subtotal} total={total}
                  onAdd={add} onDec={dec} onCheckout={() => { setIsMobileCartOpen(false); setIsPaymentOpen(true); }}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-3 font-medium bg-muted/50 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
              Scan or tap products to build bill
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Desktop Bill Cart */}
      <div className="hidden lg:flex w-[420px] shrink-0 border-l bg-background flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
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
