"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatchProduct } from "@/app/actions/products";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SizeMatrixFormProps {
  brands: Brand[];
  categories: Category[];
}

const PRESET_SIZES = {
  MEN: ["6", "7", "8", "9", "10", "11", "12"],
  WOMEN: ["4", "5", "6", "7", "8", "9"],
  KIDS: ["1", "2", "3", "4", "5", "C10", "C11", "C12", "C13"],
  UNISEX: ["5", "6", "7", "8", "9", "10", "11"],
};

export function SizeMatrixForm({ brands, categories }: SizeMatrixFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"MATRIX" | "SINGLE">("MATRIX");

  const [name, setName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [gender, setGender] = useState<"MEN" | "WOMEN" | "UNISEX" | "KIDS">("UNISEX");

  const [skuPrefix, setSkuPrefix] = useState("");
  const [color, setColor] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [defaultStock, setDefaultStock] = useState("10");
  const [defaultMinStock, setDefaultMinStock] = useState("2");

  const [selectedSizes, setSelectedSizes] = useState<string[]>(PRESET_SIZES.UNISEX);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customVariants, setCustomVariants] = useState<
    Record<
      string,
      {
        sku: string;
        barcode: string;
        purchasePrice: number;
        sellingPrice: number;
        mrp: number;
        openingStock: number;
        minimumStock: number;
      }
    >
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenderChange = (newGender: "MEN" | "WOMEN" | "UNISEX" | "KIDS") => {
    setGender(newGender);
    setSelectedSizes(PRESET_SIZES[newGender]);
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)));
    }
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes([...selectedSizes, trimmed]);
      setCustomSizeInput("");
    }
  };

  const updateVariantOverride = (
    size: string,
    field: "sku" | "barcode" | "openingStock" | "sellingPrice" | "purchasePrice" | "mrp",
    val: string | number
  ) => {
    const baseSku = skuPrefix ? `${skuPrefix}-${size}` : `${name.toUpperCase().replace(/\s+/g, "")}-${size}`;
    const pPrice = Number(purchasePrice) || 0;
    const sPrice = Number(sellingPrice) || 0;
    const mPrice = Number(mrp) || 0;
    const stock = Number(defaultStock) || 0;
    const minStock = Number(defaultMinStock) || 0;

    const existing = customVariants[size] || {
      sku: baseSku,
      barcode: "",
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      mrp: mPrice,
      openingStock: stock,
      minimumStock: minStock,
    };

    setCustomVariants({
      ...customVariants,
      [size]: {
        ...existing,
        [field]: val,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!selectedSizes.length) {
      setErrorMessage("Please select at least one size variant.");
      return;
    }

    const pPrice = Number(purchasePrice) || 0;
    const sPrice = Number(sellingPrice) || 0;
    const mPrice = Number(mrp) || 0;

    if (mPrice < sPrice) {
      setErrorMessage("MRP should be greater than or equal to selling price.");
      return;
    }

    setIsSubmitting(true);

    const variantsPayload = selectedSizes.map((size) => {
      const baseSku = skuPrefix.trim()
        ? `${skuPrefix.trim()}-${size}`
        : `${name.trim().toUpperCase().replace(/\s+/g, "")}-${size}`;
      const over = customVariants[size];

      return {
        size,
        color: color.trim() || undefined,
        sku: over?.sku || baseSku,
        barcode: over?.barcode || undefined,
        purchasePrice: over?.purchasePrice ?? pPrice,
        sellingPrice: over?.sellingPrice ?? sPrice,
        mrp: over?.mrp ?? mPrice,
        openingStock: over?.openingStock ?? (Number(defaultStock) || 0),
        minimumStock: over?.minimumStock ?? (Number(defaultMinStock) || 0),
      };
    });

    const res = await createBatchProduct({
      name: name.trim(),
      modelCode: modelCode.trim() || undefined,
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
    <div className="card" style={{ marginTop: 18, maxWidth: 900 }}>
      {errorMessage && (
        <div style={{ padding: 12, marginBottom: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 6 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3>1. Product Master Information</h3>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Product Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Air Zoom Runner"
              required
            />
          </div>
          <div className="field">
            <label>Model / Style Code</label>
            <input
              className="input"
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              placeholder="e.g. AZ-2026-BLK"
            />
          </div>
          <div className="field">
            <label>Brand *</label>
            <select className="select" value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Category *</label>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Gender Category *</label>
            <select
              className="select"
              value={gender}
              onChange={(e) => handleGenderChange(e.target.value as any)}
            >
              <option value="MEN">MEN</option>
              <option value="WOMEN">WOMEN</option>
              <option value="UNISEX">UNISEX</option>
              <option value="KIDS">KIDS</option>
            </select>
          </div>
          <div className="field">
            <label>Color</label>
            <input
              className="input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Triple Black"
            />
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>2. Base Pricing & Stock Defaults</h3>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>SKU Base Prefix *</label>
            <input
              className="input"
              value={skuPrefix}
              onChange={(e) => setSkuPrefix(e.target.value)}
              placeholder="e.g. NK-AZ-BLK"
              required
            />
            <small className="muted">SKUs will auto-generate as PREFIX-SIZE (e.g. NK-AZ-BLK-8)</small>
          </div>
          <div className="field">
            <label>Purchase Price (₹) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="2500"
              required
            />
          </div>
          <div className="field">
            <label>Selling Price (₹) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="3999"
              required
            />
          </div>
          <div className="field">
            <label>MRP (₹) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              placeholder="4499"
              required
            />
          </div>
          <div className="field">
            <label>Default Stock Per Size</label>
            <input
              className="input"
              type="number"
              value={defaultStock}
              onChange={(e) => setDefaultStock(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Minimum Stock Alert</label>
            <input
              className="input"
              type="number"
              value={defaultMinStock}
              onChange={(e) => setDefaultMinStock(e.target.value)}
            />
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>3. Select Footwear Sizes (Matrix Batch)</h3>
        <p className="muted">Click to select/deselect the sizes included in this shipment:</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {PRESET_SIZES[gender].map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                type="button"
                key={size}
                onClick={() => toggleSize(size)}
                className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                style={{ minWidth: 48, fontWeight: isSelected ? "bold" : "normal" }}
              >
                Size {size} {isSelected ? "✓" : ""}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <input
            className="input"
            style={{ maxWidth: 160 }}
            placeholder="Custom Size (e.g. 13)"
            value={customSizeInput}
            onChange={(e) => setCustomSizeInput(e.target.value)}
          />
          <button type="button" onClick={addCustomSize} className="btn btn-secondary">
            + Add Custom Size
          </button>
        </div>

        {selectedSizes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3>4. Review & Customize Generated SKU Variants ({selectedSizes.length} sizes)</h3>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Generated SKU</th>
                    <th>Opening Stock</th>
                    <th>Selling Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSizes.map((size) => {
                    const generatedSku = skuPrefix.trim()
                      ? `${skuPrefix.trim()}-${size}`
                      : `${(name || "PRODUCT").toUpperCase().replace(/\s+/g, "")}-${size}`;
                    const over = customVariants[size];
                    return (
                      <tr key={size}>
                        <td>
                          <strong>Size {size}</strong>
                        </td>
                        <td>
                          <input
                            className="input"
                            style={{ padding: "4px 8px" }}
                            value={over?.sku ?? generatedSku}
                            onChange={(e) => updateVariantOverride(size, "sku", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            style={{ padding: "4px 8px", width: 90 }}
                            value={over?.openingStock ?? defaultStock}
                            onChange={(e) => updateVariantOverride(size, "openingStock", Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            step="0.01"
                            style={{ padding: "4px 8px", width: 110 }}
                            value={over?.sellingPrice ?? sellingPrice}
                            onChange={(e) => updateVariantOverride(size, "sellingPrice", Number(e.target.value))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Creating Batch..." : `Create Product + ${selectedSizes.length} Size Variants`}
          </button>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
