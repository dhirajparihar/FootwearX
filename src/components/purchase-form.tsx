"use client";
import { useState, useTransition } from "react";
import { createPurchase } from "@/app/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

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
    if (balance > 0 && !dueDate) return toast.error("Please set a due date for the pending balance.");

    start(async () => {
      try {
        await createPurchase({
          supplierId,
          invoiceNumber: invoice,
          items: rows,
          amountPaid: paid,
          paymentMethod,
          dueDate: balance > 0 ? new Date(dueDate) : undefined
        });
        toast.success("Purchase recorded successfully!");
        window.location.href = "/purchases";
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Purchase failed");
      }
    });
  }

  return (
    <Card className="max-w-3xl mt-4">
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier invoice</label>
            <Input value={invoice} onChange={e => setInvoice(e.target.value)} required />
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
          <div className="font-semibold">Items Received</div>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <Select value={r.variantId} onValueChange={v => setRow(i, "variantId", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Input className="w-24" type="number" min="1" placeholder="Qty" value={r.quantity} onChange={e => setRow(i, "quantity", e.target.value)} />
                  <Input className="w-28" type="number" min="0" placeholder="Cost" value={r.unitCost} onChange={e => setRow(i, "unitCost", e.target.value)} />
                  <Button variant="destructive" size="icon" className="shrink-0" onClick={() => setRows(x => x.filter((_, n) => n !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setRows(x => [...x, { variantId: variants[0]?.id ?? "", quantity: 1, unitCost: variants[0]?.cost ?? 0 }])}>
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Button>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-200 dark:border-orange-900/50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-orange-800 dark:text-orange-400 font-semibold">Total Bill Amount</span>
            <span className="text-xl font-bold text-orange-900 dark:text-orange-300">₹{total.toLocaleString("en-IN")}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-orange-800 dark:text-orange-400 font-semibold">Amount Paid to Supplier</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="w-28 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTHER">Bank/Other</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                className="w-full sm:w-32 text-right bg-background" 
                type="number" 
                min="0" 
                max={total} 
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value ? Number(e.target.value) : "")} 
                placeholder="0" 
              />
            </div>
          </div>

          {balance > 0 && (
            <div className="pt-3 border-t border-orange-200/50 dark:border-orange-900/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-800 dark:text-orange-400 font-semibold">Supplier Balance Due</span>
                <span className="font-bold text-destructive">₹{balance.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-800 dark:text-orange-400 font-semibold">Promise Date</span>
                <Input type="date" className="w-auto bg-background" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <Button className="w-full h-12 text-lg" disabled={pending || !supplierId || !invoice || !rows.length} onClick={submit}>
          {pending ? "Saving…" : "Save Purchase"}
        </Button>
      </CardContent>
    </Card>
  );
}
