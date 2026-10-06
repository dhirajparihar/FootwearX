"use client";

import { Variant, Customer } from "../pos";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ShoppingCart, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  lines,
  customers,
  customerId,
  setCustomerId,
  discount,
  setDiscount,
  subtotal,
  total,
  onAdd,
  onDec,
  onCheckout
}: BillCartProps) {
  return (
    <Card className="flex flex-col h-full border-border shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Current Bill
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-4 border-b bg-background">
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-full bg-muted/30 border-border">
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

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-400px)] p-4 space-y-3">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
              <ShoppingCart className="h-10 w-10 mb-2" />
              <p>Cart is empty</p>
              <p className="text-xs">Scan or search items to add</p>
            </div>
          ) : (
            lines.map(x => (
              <div key={x.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border/50 bg-muted/10">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{x.name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                    <span>Size: {x.size}</span>
                    <span>•</span>
                    <span className="tabular-nums">₹{x.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-background border rounded-md p-1 shadow-sm shrink-0">
                  <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={() => onDec(x.id)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{x.qty}</span>
                  <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={() => onAdd(x)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch p-4 bg-muted/10 border-t gap-4">
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Discount (₹)</span>
            <Input 
              type="number" 
              min="0"
              className="w-24 h-8 text-right bg-background" 
              placeholder="0"
              value={discount || ""}
              onChange={e => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-2xl tracking-tight text-primary tabular-nums">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg h-14" 
          disabled={lines.length === 0}
          onClick={onCheckout}
        >
          PROCEED TO PAYMENT
        </Button>
      </CardFooter>
    </Card>
  );
}
