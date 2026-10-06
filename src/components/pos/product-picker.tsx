"use client";

import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col h-full space-y-4">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          autoFocus 
          className="pl-10 h-14 text-lg rounded-none sm:rounded-lg border-x-0 sm:border-x shadow-none sm:shadow-sm bg-background focus-visible:ring-1" 
          placeholder="Search product, scan barcode..." 
          value={q} 
          onChange={e => setQ(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-4 space-y-1 sm:px-0">
        {grouped.map(group => (
          <div 
            key={`${group.name}-${group.color}`} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background border-b sm:border sm:rounded-xl gap-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base sm:text-lg truncate">
                {group.name}
                {group.color && <span className="text-muted-foreground ml-2 text-sm font-normal">({group.color})</span>}
              </div>
              <div className="text-primary font-medium tabular-nums mt-0.5">
                ₹{group.price.toLocaleString("en-IN")}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:justify-end shrink-0">
              {group.sizes.map(v => {
                const outOfStock = v.stock === 0;
                return (
                  <button 
                    key={v.id} 
                    disabled={outOfStock}
                    className={cn(
                      "relative flex flex-col items-center justify-center min-w-[54px] h-[48px] rounded-lg border transition-all duration-150 select-none",
                      outOfStock 
                        ? "opacity-40 bg-muted border-border cursor-not-allowed" 
                        : "bg-background border-border hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 active:scale-95"
                    )}
                    onClick={() => onAdd(v)}
                  >
                    <span className={cn("font-bold text-sm", !outOfStock && "text-foreground")}>
                      {v.size}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground -mt-0.5">
                      {v.stock}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {grouped.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No products found matching "{q}"
          </div>
        )}
      </div>
    </div>
  );
}
