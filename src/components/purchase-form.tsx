"use client";
import { useState, useTransition } from "react";
import { createPurchase } from "@/app/actions/inventory";

type V = { id: string; label: string; cost: number };

export function PurchaseForm({ suppliers, variants }: { suppliers: { id: string; name: string }[]; variants: V[] }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [invoice, setInvoice] = useState("");
  const [rows, setRows] = useState([{ variantId: variants[0]?.id ?? "", quantity: 1, unitCost: variants[0]?.cost ?? 0 }]);
  
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("OTHER");

  const [pending, start] = useTransition();

  const total = rows.reduce((sum, r) => sum + (r.quantity * r.unitCost), 0);
  const paid = Number(amountPaid) || 0;
  const balance = total - paid;

  function setRow(i: number, k: string, v: string) {
    setRows(r => r.map((x, n) => n === i ? { ...x, [k]: k === "variantId" ? v : Number(v) } : x));
  }

  function submit() {
    if (balance > 0 && !dueDate) return alert("Please set a due date for the pending balance.");

    start(async () => {
      try {
        await createPurchase({
          supplierId,
          invoiceNumber: invoice,
          userId: "",
          items: rows,
          amountPaid: paid,
          paymentMethod,
          dueDate: balance > 0 ? new Date(dueDate) : undefined
        });
        window.location.href = "/purchases";
      } catch (e) {
        alert(e instanceof Error ? e.message : "Purchase failed");
      }
    });
  }

  return (
    <div className="card form-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="grid grid-2">
        <div className="field">
          <label>Supplier</label>
          <select className="select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Supplier invoice</label>
          <input className="input" value={invoice} onChange={e => setInvoice(e.target.value)} required />
        </div>
      </div>

      <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <strong>Items Received</strong>
        {rows.map((r, i) => (
          <div className="line-form" key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select className="select" style={{ flex: 1 }} value={r.variantId} onChange={e => setRow(i, "variantId", e.target.value)}>
              {variants.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <input className="input" style={{ width: "80px" }} type="number" min="1" placeholder="Qty" value={r.quantity} onChange={e => setRow(i, "quantity", e.target.value)} />
            <input className="input" style={{ width: "100px" }} type="number" min="0" placeholder="Cost" value={r.unitCost} onChange={e => setRow(i, "unitCost", e.target.value)} />
            <button className="btn btn-danger" style={{ padding: "8px" }} onClick={() => setRows(x => x.filter((_, n) => n !== i))}>×</button>
          </div>
        ))}
        <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setRows(x => [...x, { variantId: variants[0]?.id ?? "", quantity: 1, unitCost: variants[0]?.cost ?? 0 }])}>
          + Add item
        </button>
      </div>

      <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #fde68a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ color: "#b45309" }}>Total Bill Amount</strong>
          <strong style={{ fontSize: "18px", color: "#b45309" }}>₹{total.toLocaleString("en-IN")}</strong>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#b45309", fontWeight: "bold" }}>Amount Paid to Supplier</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <select className="select" style={{ width: "90px" }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
              <option value="OTHER">Bank/Other</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
            </select>
            <input className="input" style={{ width: "120px", textAlign: "right" }} type="number" min="0" max={total} value={amountPaid} onChange={e => setAmountPaid(e.target.value ? Number(e.target.value) : "")} placeholder="0" />
          </div>
        </div>

        {balance > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#b45309", fontWeight: "bold" }}>Supplier Balance Due</span>
              <strong style={{ color: "var(--danger)" }}>₹{balance.toLocaleString("en-IN")}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#b45309", fontWeight: "bold" }}>Promise Date</span>
              <input type="date" className="input" style={{ width: "218px" }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <button className="btn btn-primary" style={{ padding: "16px", fontSize: "16px" }} disabled={pending || !supplierId || !invoice || !rows.length} onClick={submit}>
        {pending ? "Saving…" : "Save Purchase"}
      </button>
    </div>
  );
}
