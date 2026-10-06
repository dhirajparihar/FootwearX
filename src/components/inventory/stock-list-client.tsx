"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string | null;
  stock: number;
  minStock: number;
}

interface StockProduct {
  id: string;
  name: string;
  brand: string;
  variants: Variant[];
}

type Filter = "all" | "low" | "out";

export function StockListClient({ products }: { products: StockProduct[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    return products
      .filter(p => {
        const matchesSearch = !x || `${p.brand} ${p.name}`.toLowerCase().includes(x);
        if (!matchesSearch) return false;
        if (filter === "out") return p.variants.some(v => v.stock === 0);
        if (filter === "low") return p.variants.some(v => v.stock > 0 && v.stock <= v.minStock);
        return true;
      });
  }, [q, filter, products]);

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-background"
            placeholder="Search by name or brand..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border bg-background overflow-hidden shrink-0 text-sm font-medium">
          {(["all", "low", "out"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 transition-colors",
                filter === f
                  ? f === "out"
                    ? "bg-destructive text-destructive-foreground"
                    : f === "low"
                    ? "bg-orange-500 text-white"
                    : "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {f === "all" ? "All" : f === "low" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>

      {/* Dense list */}
      <div className="rounded-xl border bg-background overflow-hidden divide-y">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No products found
          </div>
        ) : (
          filtered.map(p => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            const hasOut = p.variants.some(v => v.stock === 0);
            const hasLow = p.variants.some(v => v.stock > 0 && v.stock <= v.minStock);

            return (
              <div key={p.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base truncate">
                        {p.brand} {p.name}
                      </span>
                      {hasOut && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                      {!hasOut && hasLow && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />}
                      {!hasOut && !hasLow && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.variants.length} sizes · {totalStock} pairs total</p>
                  </div>
                  <Link
                    href={`/inventory/adjust?sku=${p.variants[0]?.sku ?? ""}`}
                    className="text-xs font-medium text-primary hover:underline shrink-0 mt-0.5"
                  >
                    Adjust →
                  </Link>
                </div>

                {/* Size pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.variants.map(v => {
                    const isOut = v.stock === 0;
                    const isLow = !isOut && v.stock <= v.minStock;
                    return (
                      <Link
                        key={v.id}
                        href={`/inventory/adjust?sku=${v.sku}`}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors",
                          isOut
                            ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                            : isLow
                            ? "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted/80"
                        )}
                      >
                        <span>{v.size}</span>
                        <span className="opacity-40">·</span>
                        <span className="tabular-nums">{v.stock}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-center text-muted-foreground py-1">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>
      )}
    </div>
  );
}
