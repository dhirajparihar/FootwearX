"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatchProduct } from "@/app/actions/products";

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
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");

    if (!name.trim()) return setErrorMessage("Product name is required.");
    if (!selectedSizes.length) return setErrorMessage("Please select at least one size.");

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
      router.push("/products");
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to create product.");
    }
  };

  return (
    <div className="card" style={{ marginTop: 18, maxWidth: 600 }}>
      {errorMessage && (
        <div style={{ padding: 12, marginBottom: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 6 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div className="field">
          <label>Product Name</label>
          <input className="input" style={{ fontSize: "18px", padding: "12px" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nike Air Max" required />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Brand</label>
            <select className="select" value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Category</label>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>For</label>
            <select className="select" value={gender} onChange={(e) => handleGenderChange(e.target.value as any)}>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
              <option value="KIDS">Kids</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
          <div className="field">
            <label>Color</label>
            <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Black" />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Selling Price (₹)</label>
            <input className="input" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="2999" required />
          </div>
          <div className="field">
            <label>MRP (₹)</label>
            <input className="input" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="3499" required />
          </div>
          <div className="field">
            <label>Cost Price (₹)</label>
            <input className="input" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="1999" required />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "8px" }}>Sizes</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRESET_SIZES[gender].map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  type="button"
                  key={size}
                  onClick={() => toggleSize(size)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: isSelected ? "2px solid #111827" : "1px solid var(--border)",
                    background: isSelected ? "#111827" : "white",
                    color: isSelected ? "white" : "var(--text)",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  {size} {isSelected ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSizes.length > 0 && (
          <div>
            <label style={{ fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "8px" }}>Opening Stock (Pairs)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px" }}>
              {selectedSizes.map((size) => (
                <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f9fafb", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <strong style={{ marginBottom: "6px" }}>Size {size}</strong>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    style={{ textAlign: "center", padding: "6px" }}
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
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ background: "none", border: "none", color: "#6b7280", textDecoration: "underline", fontSize: "13px", padding: 0 }}>
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (Custom SKU)"}
          </button>
          
          {showAdvanced && (
            <div style={{ marginTop: "12px", padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div className="field">
                <label>SKU Prefix (Optional)</label>
                <input className="input" value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="e.g. NK-AIRMAX-BLK" />
                <small className="muted">Leave blank to auto-generate codes.</small>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: "16px", fontSize: "16px", fontWeight: "bold" }}>
          {isSubmitting ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
