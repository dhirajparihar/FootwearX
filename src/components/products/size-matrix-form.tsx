"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBatchProduct, createBrand, createCategory } from "@/app/actions/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";

interface Brand { id: string; name: string; }
interface Category { id: string; name: string; }
interface SizeMatrixFormProps { brands: Brand[]; categories: Category[]; }

const PRESET_SIZES = {
  MEN: ["6", "7", "8", "9", "10", "11", "12"],
  WOMEN: ["4", "5", "6", "7", "8", "9"],
  KIDS: ["1", "2", "3", "4", "5", "C10", "C11", "C12", "C13"],
  UNISEX: ["5", "6", "7", "8", "9", "10", "11"],
};

function InlineAdd({
  label,
  onAdd,
}: {
  label: string;
  onAdd: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, start] = useTransition();

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    start(async () => {
      await onAdd(trimmed);
      setValue("");
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-primary font-medium mt-1 hover:underline"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" /> Add {label}
      </button>
    );
  }

  return (
    <div className="flex gap-1 mt-1">
      <Input
        autoFocus
        className="h-8 text-sm"
        placeholder={`New ${label} name`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <Button type="button" size="sm" className="h-8 px-3" onClick={handleAdd} disabled={isPending}>
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => setOpen(false)}>
        ✕
      </Button>
    </div>
  );
}

export function SizeMatrixForm({ brands: initialBrands, categories: initialCategories }: SizeMatrixFormProps) {
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(initialBrands[0]?.id || "");
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id || "");
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

  const handleAddBrand = async (newName: string) => {
    const res = await createBrand(newName);
    if (res.ok) {
      setBrands((prev) => [...prev, res.brand].sort((a, b) => a.name.localeCompare(b.name)));
      setBrandId(res.brand.id);
      toast.success(`Brand "${res.brand.name}" added`);
    } else {
      toast.error(res.error);
    }
  };

  const handleAddCategory = async (newName: string) => {
    const res = await createCategory(newName);
    if (res.ok) {
      setCategories((prev) => [...prev, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(res.category.id);
      toast.success(`Category "${res.category.name}" added`);
    } else {
      toast.error(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Product name is required.");
    if (!brandId) return toast.error("Please select or add a brand.");
    if (!categoryId) return toast.error("Please select or add a category.");
    if (!selectedSizes.length) return toast.error("Please select at least one size.");

    const pPrice = Number(purchasePrice) || 0;
    const sPrice = Number(sellingPrice) || 0;
    const mPrice = Number(mrp) || sPrice;

    setIsSubmitting(true);

    const generatedPrefix = skuPrefix.trim()
      ? skuPrefix.trim()
      : `P-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const variantsPayload = selectedSizes.map((size) => ({
      size,
      color: color.trim() || undefined,
      sku: `${generatedPrefix}-${size}`,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      mrp: mPrice,
      openingStock: Number(stocks[size]) || 0,
      minimumStock: 2,
    }));

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

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

      <div className="grid grid-cols-2 gap-4">
        {/* Brand */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Brand</label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className={cn(!brandId && "text-muted-foreground")}>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No brands yet</div>
              ) : (
                brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <InlineAdd label="Brand" onAdd={handleAddBrand} />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className={cn(!categoryId && "text-muted-foreground")}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No categories yet</div>
              ) : (
                categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <InlineAdd label="Category" onAdd={handleAddCategory} />
        </div>

        {/* Gender */}
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

        {/* Color */}
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
          <Input type="number" min="0" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="3499" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cost Price (₹)</label>
          <Input type="number" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="1999" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_SIZES[gender].map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                type="button"
                key={size}
                onClick={() => toggleSize(size)}
                className={cn(
                  "min-w-[48px] h-[48px] rounded-lg font-bold border-2 transition-all focus:outline-none text-base",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSizes.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <label className="text-sm font-semibold">Opening Stock (Pairs per Size)</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {selectedSizes.map((size) => (
              <div key={size} className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border">
                <span className="font-bold text-sm mb-2">Size {size}</span>
                <Input
                  type="number"
                  min="0"
                  className="text-center h-9 bg-background"
                  value={stocks[size] || ""}
                  placeholder="0"
                  onChange={(e) => setStocks({ ...stocks, [size]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="link"
          className="px-0 text-muted-foreground h-auto"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide Advanced Options" : "Advanced: Set Custom SKU Prefix"}
        </Button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-muted/20 rounded-xl border">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU Prefix (Optional)</label>
              <Input value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="e.g. NK-AIRMAX-BLK" />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate. Size will be appended (e.g. Prefix-8).
              </p>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full text-lg h-14 rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />SAVING...</>
        ) : (
          "CREATE PRODUCT & SIZES"
        )}
      </Button>
    </form>
  );
}
