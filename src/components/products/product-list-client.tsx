"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  minStock: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  isActive: boolean;
  price: number;
  totalStock: number;
  variantCount: number;
  variants: Variant[];
}

const GENDER_LABEL: Record<string, string> = {
  MEN: "Men",
  WOMEN: "Women",
  KIDS: "Kids",
  UNISEX: "Unisex",
};

export function ProductListClient({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return products;
    return products.filter(p =>
      `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(x)
    );
  }, [q, products]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11 bg-background"
          placeholder="Search by name, brand, category..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {/* Dense list */}
      <div className="rounded-xl border bg-background overflow-hidden divide-y">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No products found{q && ` for "${q}"`}
          </div>
        ) : (
          filtered.map(p => {
            const hasLow = p.variants.some(v => v.stock <= v.minStock && v.stock > 0);
            const hasOut = p.variants.some(v => v.stock === 0);

            return (
              <Link
                key={p.id}
                href={`/products/${p.id}/edit`}
                className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition-colors group"
              >
                {/* Name block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base leading-tight truncate">
                      {p.brand} {p.name}
                    </span>
                    {(hasOut || hasLow) && (
                      <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", hasOut ? "text-destructive" : "text-orange-500")} />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                    <span>{p.category}</span>
                    <span>·</span>
                    <span>{GENDER_LABEL[p.gender] ?? p.gender}</span>
                    <span>·</span>
                    <span>{p.variantCount} sizes</span>
                  </div>

                  {/* Size pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.variants.map(v => {
                      const isOut = v.stock === 0;
                      const isLow = !isOut && v.stock <= v.minStock;
                      return (
                        <span
                          key={v.id}
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border",
                            isOut
                              ? "bg-destructive/10 border-destructive/20 text-destructive"
                              : isLow
                              ? "bg-orange-50 border-orange-200 text-orange-800"
                              : "bg-primary/5 border-primary/15 text-primary"
                          )}
                        >
                          {v.size}
                          <span className="opacity-50">·</span>
                          {v.stock}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Right: price + total + arrow */}
                <div className="flex flex-col items-end shrink-0 gap-1 min-w-[80px]">
                  <span className="font-bold text-base tabular-nums">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {p.totalStock} pairs
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {q && ` matching "${q}"`}
        </p>
      )}
    </div>
  );
}
