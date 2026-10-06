"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Variant } from "../pos";
import { cn } from "@/lib/utils";

interface ProductPickerProps {
  q: string;
  setQ: (val: string) => void;
  grouped: { name: string; price: number; color: string; sizes: Variant[] }[];
  onAdd: (v: Variant) => void;
}

export function ProductPicker({ q, setQ, grouped, onAdd }: ProductPickerProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          autoFocus 
          className="pl-10 h-12 text-base rounded-xl shadow-sm bg-background border-border" 
          placeholder="Search product, code or scan barcode..." 
          value={q} 
          onChange={e => setQ(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        {grouped.map(group => (
          <Card key={`${group.name}-${group.color}`} className="overflow-hidden border-border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3 pt-4 px-5">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.color && <div className="text-sm text-muted-foreground mt-0.5">{group.color}</div>}
                </div>
                <div className="text-lg font-semibold tabular-nums tracking-tight">
                  ₹{group.price.toLocaleString("en-IN")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-4 bg-background">
              <div className="flex flex-wrap gap-2.5">
                {group.sizes.map(v => {
                  const outOfStock = v.stock === 0;
                  return (
                    <button 
                      key={v.id} 
                      disabled={outOfStock}
                      className={cn(
                        "relative flex flex-col items-center justify-center min-w-[72px] h-[64px] border rounded-xl transition-all duration-200 select-none",
                        outOfStock 
                          ? "opacity-50 bg-muted/50 border-border cursor-not-allowed" 
                          : "bg-background border-border/80 hover:border-primary/50 hover:bg-primary/5 active:scale-95"
                      )}
                      onClick={() => onAdd(v)}
                    >
                      <span className={cn(
                        "font-semibold text-base", 
                        !outOfStock && "text-foreground"
                      )}>{v.size}</span>
                      <span className={cn(
                        "text-[10px] mt-0.5 font-medium tracking-wide",
                        outOfStock ? "text-muted-foreground" : "text-muted-foreground"
                      )}>
                        {v.stock} LEFT
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-12 border rounded-xl border-dashed bg-background/50">
            <div className="text-muted-foreground">No products found for "{q}"</div>
          </div>
        )}
      </div>
    </div>
  );
}
