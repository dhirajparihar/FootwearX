"use client";
import { useMemo, useState, useTransition } from "react";
import { completeSale } from "@/app/actions/sales";

type Variant = { id: string; sku: string; barcode: string; name: string; size: string; color: string; stock: number; price: number };
type Customer = { id: string; name: string; phone: string };

export function POS({ variants, customers }: { variants: Variant[], customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [isSplit, setIsSplit] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ CASH: 0, UPI: 0, CARD: 0 });
  const [isUdhaar, setIsUdhaar] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [dueDate, setDueDate] = useState<string>("");
  
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");
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
    // Sort sizes numerically if possible
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

  function checkout() {
    start(async () => {
      let payments = [];
      let finalDueDate = undefined;

      if (isUdhaar) {
        if (!customerId) return alert("Please select a customer for Udhaar.");
        if (!dueDate) return alert("Please select a due date for Udhaar.");
        const paid = Number(amountPaid) || 0;
        if (paid > total) return alert("Amount paid cannot exceed total.");
        if (paid > 0) payments.push({ method: payment, amount: paid });
        finalDueDate = new Date(dueDate);
      } else if (isSplit) {
        if (splitAmounts.CASH > 0) payments.push({ method: "CASH" as const, amount: splitAmounts.CASH });
        if (splitAmounts.UPI > 0) payments.push({ method: "UPI" as const, amount: splitAmounts.UPI });
        if (splitAmounts.CARD > 0) payments.push({ method: "CARD" as const, amount: splitAmounts.CARD });
        
        const splitTotal = payments.reduce((sum, p) => sum + p.amount, 0);
        if (splitTotal !== total) {
          return alert(`Split payment total (₹${splitTotal}) must exactly equal the bill total (₹${total}).`);
        }
      } else {
        payments.push({ method: payment, amount: total });
      }

      const r = await completeSale({
        customerId: customerId || undefined,
        items: lines.map(x => ({ variantId: x.id, quantity: x.qty, unitPrice: x.price })),
        discount,
        tax: 0,
        payments,
        dueDate: finalDueDate,
      });
      if (r.ok) {
        window.location.href = `/sales/${r.saleId}`;
      } else alert(r.error);
    });
  }

  // UI styling
  return (
    <div className="pos-container">
      {/* CSS specific to POS */}
      <style dangerouslySetInnerHTML={{__html: `
        .pos-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 300px; }
        .search-bar { font-size: 16px; padding: 14px; border-radius: 12px; }
        .product-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .sizes-row { display: flex; gap: 8px; overflow-x: auto; padding-top: 10px; margin-top: 10px; border-top: 1px solid #f3f4f6; }
        .size-btn { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px; height: 60px; border: 1px solid var(--border); border-radius: 10px; background: #f9fafb; font-size: 16px; font-weight: bold; }
        .size-btn:hover { background: #e5e7eb; }
        .size-btn.disabled { opacity: 0.4; pointer-events: none; }
        .size-stock { font-size: 11px; color: var(--muted); font-weight: normal; margin-top: 2px;}
        .cart-sticky { position: fixed; bottom: 64px; left: 0; right: 0; background: white; border-top: 1px solid var(--border); padding: 16px; box-shadow: 0 -4px 10px rgba(0,0,0,0.05); z-index: 90; display: flex; flex-direction: column; gap: 10px; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin-bottom: 8px; }
        .qty-controls { display: flex; align-items: center; gap: 12px; background: #f3f4f6; border-radius: 20px; padding: 4px 12px; }
        .qty-btn { background: none; border: none; font-size: 18px; font-weight: bold; cursor: pointer; color: var(--primary); }
        .checkout-btn { width: 100%; font-size: 18px; font-weight: bold; padding: 16px; border-radius: 12px; background: #15803d; color: white; border: none; }
        .customer-select { padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: white; width: 100%; font-size: 14px; }
        .payment-tabs { display: flex; gap: 8px; margin-top: 8px; }
        .payment-tab { flex: 1; padding: 10px; text-align: center; border: 1px solid var(--border); border-radius: 8px; background: white; font-weight: bold; cursor: pointer; }
        .payment-tab.active { background: #111827; color: white; border-color: #111827; }
        @media (min-width: 768px) {
          .pos-container { flex-direction: row; padding-bottom: 20px; }
          .products-pane { flex: 1; }
          .cart-sticky { position: sticky; top: 20px; width: 400px; height: fit-content; border-radius: 12px; border: 1px solid var(--border); bottom: auto; }
        }
      `}} />

      <div className="products-pane">
        <input 
          autoFocus 
          className="input search-bar" 
          placeholder="🔍 Search product, code or scan barcode" 
          value={q} 
          onChange={e => setQ(e.target.value)}
        />
        
        <div style={{ marginTop: '16px' }}>
          {grouped.map(group => (
            <div className="product-card" key={`${group.name}-${group.color}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{group.name}</strong>
                  {group.color && <div className="muted" style={{ fontSize: '14px' }}>{group.color}</div>}
                </div>
                <strong style={{ fontSize: '16px' }}>₹{group.price.toLocaleString("en-IN")}</strong>
              </div>
              
              <div className="sizes-row">
                {group.sizes.map(v => (
                  <button 
                    key={v.id} 
                    className={`size-btn ${v.stock === 0 ? 'disabled' : ''}`}
                    onClick={() => add(v)}
                  >
                    {v.size}
                    <div className="size-stock">{v.stock} left</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <p className="muted" style={{ padding: '20px', textAlign: 'center' }}>No products found.</p>}
        </div>
      </div>

      <div className="cart-sticky">
        <select 
          className="customer-select" 
          value={customerId} 
          onChange={e => setCustomerId(e.target.value)}
        >
          <option value="">Walk-in Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
          ))}
        </select>

        {lines.length > 0 && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '10px 0', paddingRight: '5px' }}>
            {lines.map(x => (
              <div className="cart-item" key={x.id}>
                <div>
                  <strong>{x.name} - Size {x.size}</strong><br/>
                  <span className="muted">₹{x.price}</span>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => dec(x.id)}>−</button>
                  <strong style={{ minWidth: '20px', textAlign: 'center' }}>{x.qty}</strong>
                  <button className="qty-btn" onClick={() => add(x)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="muted">Subtotal</span>
          <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span className="muted">Discount</span>
          <input 
            style={{ width: '80px', padding: '4px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)' }} 
            type="number" 
            min="0" 
            value={discount || ""} 
            placeholder="0"
            onChange={e => setDiscount(Number(e.target.value) || 0)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '8px', background: !isUdhaar ? '#111827' : 'white', color: !isUdhaar ? 'white' : 'black', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold' }}
            onClick={() => { setIsUdhaar(false); setIsSplit(false); }}
          >
            Paid in Full
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '8px', background: isUdhaar ? '#111827' : 'white', color: isUdhaar ? 'white' : 'black', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold' }}
            onClick={() => { setIsUdhaar(true); setIsSplit(false); }}
          >
            Udhaar (Credit)
          </button>
        </div>

        {!isUdhaar && !isSplit && (
          <div className="payment-tabs">
            {(["CASH", "UPI", "CARD"] as const).map(p => (
              <button 
                key={p} 
                className={`payment-tab ${payment === p ? 'active' : ''}`}
                onClick={() => setPayment(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {!isUdhaar && isSplit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {(["CASH", "UPI", "CARD"] as const).map(p => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ width: '60px', fontWeight: 'bold' }}>{p}</span>
                <input 
                  style={{ width: '120px', padding: '6px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)' }} 
                  type="number" 
                  min="0" 
                  value={splitAmounts[p] || ""} 
                  placeholder="0"
                  onChange={e => setSplitAmounts({ ...splitAmounts, [p]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        )}

        {isUdhaar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#b45309' }}>Amount Paid Now</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fde68a', background: 'white' }}
                  value={payment}
                  onChange={e => setPayment(e.target.value as any)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
                <input 
                  style={{ width: '90px', padding: '6px', textAlign: 'right', borderRadius: '4px', border: '1px solid #fde68a' }} 
                  type="number" 
                  min="0"
                  max={total}
                  value={amountPaid} 
                  placeholder="0"
                  onChange={e => setAmountPaid(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#b45309' }}>Udhaar Balance</span>
              <strong style={{ fontSize: '16px', color: '#b45309' }}>₹{(total - (Number(amountPaid) || 0)).toLocaleString("en-IN")}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#b45309' }}>Due Date</span>
              <input 
                type="date"
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fde68a' }}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {!isUdhaar && (
          <div style={{ textAlign: 'right', marginTop: '4px' }}>
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', fontSize: '13px', padding: 0 }}
              onClick={() => setIsSplit(!isSplit)}
            >
              {isSplit ? "Cancel Split Payment" : "Split Payment (Cash + UPI)"}
            </button>
          </div>
        )}

        <button 
          className="checkout-btn" 
          disabled={pending || !lines.length || (isUdhaar && (!customerId || !dueDate))} 
          onClick={checkout}
          style={{ marginTop: '12px' }}
        >
          {pending ? "Processing…" : `COMPLETE SALE`}
        </button>
      </div>
    </div>
  );
}
