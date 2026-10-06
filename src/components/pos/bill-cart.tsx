"use client";

import { Variant, Customer } from "../pos";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ShoppingBag, User } from "lucide-react";

interface BillCartProps {
  lines: (Variant & { qty: number })[];
  customers: Customer[];
  customerId: string;
  setCustomerId: (val: string) => void;
  discount: number;
  setDiscount: (val: number) => void;
  subtotal: number;
  total: number;
  onAdd: (v: Variant) => void;
  onDec: (id: string) => void;
  onCheckout: () => void;
}

export function BillCart({
  lines, customers, customerId, setCustomerId, discount, setDiscount, subtotal, total, onAdd, onDec, onCheckout
}: BillCartProps) {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 border-b bg-muted/10 shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Current Bill
        </h2>
      </div>
      
      <div className="p-3 border-b bg-background shrink-0">
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="w-full bg-muted/30 border-none shadow-none focus:ring-1 h-12 text-base">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Walk-in Customer" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Walk-in Customer</SelectItem>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-0 m-0">
        {lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-60">
            <ShoppingBag className="h-12 w-12" />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="divide-y">
            {lines.map(x => (
              <div key={x.id} className="flex items-center justify-between gap-3 p-4 bg-background hover:bg-muted/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base truncate leading-none">{x.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                    <span>Size: {x.size}</span>
                    <span>•</span>
                    <span className="tabular-nums">₹{x.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/30 border rounded-lg p-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md active:bg-muted" onClick={() => onDec(x.id)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-base font-semibold tabular-nums">{x.qty}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md active:bg-muted" onClick={() => onAdd(x)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-background border-t shrink-0 flex flex-col gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Subtotal</span>
            <span className="font-semibold tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Discount (₹)</span>
            <Input 
              type="number" 
              min="0"
              className="w-24 h-9 text-right bg-muted/30 border-none shadow-none focus-visible:ring-1 font-semibold" 
              placeholder="0"
              value={discount || ""}
              onChange={e => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between items-end pt-3 border-t">
            <span className="font-semibold text-base text-muted-foreground">Total</span>
            <span className="font-extrabold text-3xl tracking-tight text-primary tabular-nums leading-none">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/20" 
          disabled={lines.length === 0}
          onClick={onCheckout}
        >
          PROCEED TO PAYMENT
        </Button>
      </div>
    </div>
  );
}

