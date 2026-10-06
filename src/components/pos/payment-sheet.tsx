"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, QrCode, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  hasCustomer: boolean;
  pending: boolean;
  onComplete: (payload: { payments: { method: "CASH" | "UPI" | "CARD" | "OTHER", amount: number }[], dueDate?: Date }) => void;
}

export function PaymentSheet({ open, onOpenChange, total, hasCustomer, pending, onComplete }: PaymentSheetProps) {
  const [mode, setMode] = useState<"FULL" | "SPLIT" | "UDHAAR">("FULL");
  const [payment, setPayment] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [splitAmounts, setSplitAmounts] = useState({ CASH: 0, UPI: 0, CARD: 0 });
  const [udhaarPaid, setUdhaarPaid] = useState<number | "">("");
  const [udhaarMethod, setUdhaarMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [dueDate, setDueDate] = useState<string>("");

  function handleSubmit() {
    if (mode === "UDHAAR") {
      if (!hasCustomer) return toast.error("Please select a customer before giving Udhaar.");
      if (!dueDate) return toast.error("Please select a due date.");
      const paid = Number(udhaarPaid) || 0;
      if (paid > total) return toast.error("Amount paid cannot exceed total.");
      
      const payments = paid > 0 ? [{ method: udhaarMethod, amount: paid }] : [];
      onComplete({ payments, dueDate: new Date(dueDate) });
      return;
    }

    if (mode === "SPLIT") {
      const payments: { method: "CASH" | "UPI" | "CARD", amount: number }[] = [];
      if (splitAmounts.CASH > 0) payments.push({ method: "CASH", amount: splitAmounts.CASH });
      if (splitAmounts.UPI > 0) payments.push({ method: "UPI", amount: splitAmounts.UPI });
      if (splitAmounts.CARD > 0) payments.push({ method: "CARD", amount: splitAmounts.CARD });
      
      const splitTotal = payments.reduce((sum, p) => sum + p.amount, 0);
      if (splitTotal !== total) {
        return toast.error(`Split amounts (₹${splitTotal}) must exactly equal the total (₹${total}).`);
      }
      
      onComplete({ payments });
      return;
    }

    // FULL
    onComplete({ payments: [{ method: payment, amount: total }] });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-6" side="right">
        <SheetHeader>
          <SheetTitle className="text-2xl">Payment Details</SheetTitle>
          <SheetDescription>
            Select payment method and complete the transaction.
          </SheetDescription>
        </SheetHeader>

        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 flex flex-col items-center justify-center space-y-1">
          <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Amount Due</div>
          <div className="text-4xl font-bold tracking-tight text-primary">₹{total.toLocaleString("en-IN")}</div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            {(["FULL", "SPLIT", "UDHAAR"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "FULL" ? "Paid in Full" : m === "SPLIT" ? "Split" : "Udhaar"}
              </button>
            ))}
          </div>

          {mode === "FULL" && (
            <div className="grid grid-cols-3 gap-3">
              {(["CASH", "UPI", "CARD"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPayment(p)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 transition-all",
                    payment === p 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border bg-background hover:border-primary/30"
                  )}
                >
                  {p === "CASH" && <Banknote className="h-6 w-6" />}
                  {p === "UPI" && <QrCode className="h-6 w-6" />}
                  {p === "CARD" && <CreditCard className="h-6 w-6" />}
                  <span className="font-semibold text-sm">{p}</span>
                </button>
              ))}
            </div>
          )}

          {mode === "SPLIT" && (
            <div className="space-y-4">
              <Badge variant="secondary" className="w-full justify-center py-1.5 bg-blue-50 text-blue-700 border-blue-200">
                <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                Split Payment
              </Badge>
              {(["CASH", "UPI", "CARD"] as const).map(p => (
                <div key={p} className="flex items-center gap-4">
                  <div className="w-24 font-semibold text-sm flex items-center gap-2">
                    {p === "CASH" && <Banknote className="h-4 w-4 text-muted-foreground" />}
                    {p === "UPI" && <QrCode className="h-4 w-4 text-muted-foreground" />}
                    {p === "CARD" && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                    {p}
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input 
                      type="number"
                      className="pl-8 bg-background"
                      placeholder="0"
                      value={splitAmounts[p] || ""}
                      onChange={e => setSplitAmounts({ ...splitAmounts, [p]: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm font-medium px-1">
                <span>Split Total:</span>
                <span className={cn(
                  "tabular-nums", 
                  splitAmounts.CASH + splitAmounts.UPI + splitAmounts.CARD !== total ? "text-destructive" : "text-success"
                )}>
                  ₹{(splitAmounts.CASH + splitAmounts.UPI + splitAmounts.CARD).toLocaleString()} / ₹{total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {mode === "UDHAAR" && (
            <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-200">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-900">Amount Paid Now</label>
                <div className="flex gap-2">
                  <Select value={udhaarMethod} onValueChange={(val: any) => setUdhaarMethod(val)}>
                    <SelectTrigger className="w-[110px] bg-white border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input 
                      type="number"
                      className="pl-8 bg-white border-orange-200"
                      placeholder="0"
                      max={total}
                      value={udhaarPaid}
                      onChange={e => setUdhaarPaid(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                <span className="font-semibold text-sm text-orange-900">Udhaar Balance</span>
                <span className="font-bold text-lg text-orange-700">
                  ₹{(total - (Number(udhaarPaid) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-900">Due Date</label>
                <Input 
                  type="date"
                  className="bg-white border-orange-200"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              {!hasCustomer && (
                <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded-md">
                  ⚠️ Select a customer in the cart first to record Udhaar.
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="mt-auto pt-6">
          <Button 
            size="lg" 
            className="w-full text-lg h-14" 
            onClick={handleSubmit} 
            disabled={pending}
          >
            {pending ? "PROCESSING..." : "CONFIRM & PRINT"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
