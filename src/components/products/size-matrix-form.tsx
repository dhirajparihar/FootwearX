"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatchProduct } from "@/app/actions/products";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Brand { id: string; name: string; }
interface Category { id: string; name: string; }
interface SizeMatrixFormProps { brands: Brand[]; categories: Category[]; }

const PRESET_SIZES = {
  MEN: ["6", "7", "8", "9", "10", "11", "12"],
  WOMEN: ["4", "5", "6", "7", "8", "9"],
  KIDS: ["1", "2", "3", "4", "5", "C10", "C11", "C12", "C13"],
  UNISEX: ["5", "6", "7", "8", "9", "10", "11"],
};

export function SizeMatrixForm({ brands, categories }: SizeMatrixFormProps) {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [gender, setGender] = useState<"MEN" | "WOMEN" | "UNISEX" | "KIDS">("MEN");
  const [color, setColor] = useState("");
  
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const [selectedSizes, setSelectedSizes] = useState<string[]>(PRESET_SIZES.MEN);
  const [stocks, setStocks] = useState<Record<string, string>>({});
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skuPrefix, setSkuPrefix] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenderChange = (newGender: "MEN" | "WOMEN" | "UNISEX" | "KIDS") => {
    setGender(newGender);
    setSelectedSizes(PRESET_SIZES[newGender]);
    setStocks({});
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
      const newStocks = { ...stocks };
      delete newStocks[size];
      setStocks(newStocks);
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Product name is required.");
    if (!selectedSizes.length) return toast.error("Please select at least one size.");

    const pPrice = Number(purchasePrice) || 0;
    const sPrice = Number(sellingPrice) || 0;
    const mPrice = Number(mrp) || 0;

    setIsSubmitting(true);

    const generatedPrefix = skuPrefix.trim() 
      ? skuPrefix.trim() 
      : `P-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const variantsPayload = selectedSizes.map((size) => {
      return {
        size,
        color: color.trim() || undefined,
        sku: `${generatedPrefix}-${size}`,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        mrp: mPrice,
        openingStock: Number(stocks[size]) || 0,
        minimumStock: 2,
      };
    });

    const res = await createBatchProduct({
      name: name.trim(),
      brandId,
      categoryId,
      gender,
      variants: variantsPayload,
    });

    setIsSubmitting(false);

    if (res.ok) {
      toast.success("Product created successfully!");
      router.push("/products");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to create product.");
    }
  };

  return (
    <Card className="max-w-2xl mt-4">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold">Product Name</label>
            <Input 
              className="h-12 text-lg font-medium" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Nike Air Max" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <Select value={brandId} onValueChange={setBrandId} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">For (Gender)</label>
              <Select value={gender} onValueChange={(val: any) => handleGenderChange(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEN">Men</SelectItem>
                  <SelectItem value="WOMEN">Women</SelectItem>
                  <SelectItem value="KIDS">Kids</SelectItem>
                  <SelectItem value="UNISEX">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Black" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selling Price (₹)</label>
              <Input type="number" min="0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="2999" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">MRP (₹)</label>
              <Input type="number" min="0" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="3499" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Price (₹)</label>
              <Input type="number" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="1999" required />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Generate Sizes Matrix</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES[gender].map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    {size} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSizes.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-semibold">Opening Stock (Pairs)</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {selectedSizes.map((size) => (
                  <div key={size} className="flex flex-col items-center p-3 bg-muted/50 rounded-xl border">
                    <span className="font-semibold text-sm mb-2">Size {size}</span>
                    <Input
                      type="number"
                      min="0"
                      className="text-center h-8"
                      value={stocks[size] || ""}
                      placeholder="0"
                      onChange={(e) => setStocks({ ...stocks, [size]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button 
              type="button" 
              variant="link" 
              className="px-0 text-muted-foreground h-auto"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (Custom SKU)"}
            </Button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU Prefix (Optional)</label>
                  <Input value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="e.g. NK-AIRMAX-BLK" />
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate codes. Size will be appended (e.g. Prefix-8).</p>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isSubmitting}>
            {isSubmitting ? "SAVING..." : "CREATE PRODUCT & SIZES"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
