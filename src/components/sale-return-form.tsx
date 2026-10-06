"use client";
import { useState, useTransition } from "react";
import { createSaleReturn } from "@/app/actions/inventory";

interface ReturnItem {
  id: string;
  label: string;
  sold: number;
  price: number;
}

export function SaleReturnForm({ saleId, items }: { saleId: string; items: ReturnItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("Size issue");
  const [pending, start] = useTransition();

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
      const newQty = { ...qty };
      delete newQty[id];
      setQty(newQty);
    } else {
      setSelectedIds([...selectedIds, id]);
      setQty({ ...qty, [id]: 1 });
    }
  }

  const totalRefund = selectedIds.reduce((sum, id) => {
    const item = items.find(i => i.id === id);
    return sum + (item?.price || 0) * (qty[id] || 0);
  }, 0);

  function submit() {
    const selected = selectedIds.map(id => ({ saleItemId: id, quantity: qty[id] || 1 }));
    if (selected.length === 0) return alert("Select items to return");
    
    start(async () => {
      try {
        await createSaleReturn({ saleId, userId: "", items: selected, reason });
        window.location.href = `/sales/${saleId}`;
      } catch (e) {
        alert(e instanceof Error ? e.message : "Return failed");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px", marginTop: "16px" }}>
      {items.map(i => {
        const isSelected = selectedIds.includes(i.id);
        return (
          <div key={i.id} className="card" style={{ padding: "16px", border: isSelected ? "2px solid #111827" : "1px solid var(--border)", cursor: "pointer" }} onClick={() => toggle(i.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input type="checkbox" checked={isSelected} readOnly style={{ width: "20px", height: "20px" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "16px" }}>{i.label}</strong>
                <span className="muted">₹{i.price.toLocaleString("en-IN")} (Sold: {i.sold})</span>
              </div>
            </div>
            
            {isSelected && i.sold > 1 && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#f9fafb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={e => e.stopPropagation()}>
                <strong>Return Quantity</strong>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "4px 8px", borderRadius: "20px", border: "1px solid var(--border)" }}>
                  <button type="button" style={{ border: "none", background: "none", fontSize: "18px", color: "var(--primary)" }} onClick={() => setQty({ ...qty, [i.id]: Math.max(1, (qty[i.id] || 1) - 1) })}>−</button>
                  <strong style={{ minWidth: "20px", textAlign: "center" }}>{qty[i.id] || 1}</strong>
                  <button type="button" style={{ border: "none", background: "none", fontSize: "18px", color: "var(--primary)" }} onClick={() => setQty({ ...qty, [i.id]: Math.min(i.sold, (qty[i.id] || 1) + 1) })}>+</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedIds.length > 0 && (
        <div className="card" style={{ marginTop: "8px" }}>
          <div className="field" style={{ marginBottom: "16px" }}>
            <label>Reason for return</label>
            <input className="input" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "16px" }}>Refund Amount</span>
            <strong style={{ fontSize: "20px" }}>₹{totalRefund.toLocaleString("en-IN")}</strong>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", padding: "16px", fontSize: "16px", fontWeight: "bold" }} disabled={pending} onClick={submit}>
            {pending ? "Processing..." : "Process Return"}
          </button>
        </div>
      )}
    </div>
  );
}
