"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVariant, addVariantToProduct } from "@/app/actions/products";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface VariantItem {
  id: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
}

interface ProductDetails {
  id: string;
  name: string;
  modelCode: string | null;
  brandId: string;
  categoryId: string;
  gender: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  variants: VariantItem[];
}

interface EditProductFormProps {
  product: ProductDetails;
  brands: Brand[];
  categories: Category[];
  updateAction: (formData: FormData) => Promise<void>;
}

export function EditProductForm({ product, brands, categories, updateAction }: EditProductFormProps) {
  const router = useRouter();
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantDraft, setVariantDraft] = useState<Partial<VariantItem>>({});
  const [isSavingVariant, setIsSavingVariant] = useState(false);
  const [variantError, setVariantError] = useState("");

  // Add new variant state
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newPurchasePrice, setNewPurchasePrice] = useState(
    product.variants[0]?.purchasePrice ? String(product.variants[0].purchasePrice) : ""
  );
  const [newSellingPrice, setNewSellingPrice] = useState(
    product.variants[0]?.sellingPrice ? String(product.variants[0].sellingPrice) : ""
  );
  const [newMrp, setNewMrp] = useState(
    product.variants[0]?.mrp ? String(product.variants[0].mrp) : ""
  );
  const [newStock, setNewStock] = useState("0");
  const [newMinStock, setNewMinStock] = useState("2");
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const startEditVariant = (v: VariantItem) => {
    setEditingVariantId(v.id);
    setVariantDraft({
      sku: v.sku,
      barcode: v.barcode || "",
      size: v.size,
      color: v.color || "",
      purchasePrice: Number(v.purchasePrice),
      sellingPrice: Number(v.sellingPrice),
      mrp: Number(v.mrp),
      minimumStock: v.minimumStock,
      isActive: v.isActive,
    });
    setVariantError("");
  };

  const handleSaveVariant = async (vId: string) => {
    setVariantError("");
    setIsSavingVariant(true);

    const res = await updateVariant({
      variantId: vId,
      sku: String(variantDraft.sku || ""),
      barcode: String(variantDraft.barcode || ""),
      size: String(variantDraft.size || ""),
      color: String(variantDraft.color || ""),
      purchasePrice: Number(variantDraft.purchasePrice || 0),
      sellingPrice: Number(variantDraft.sellingPrice || 0),
      mrp: Number(variantDraft.mrp || 0),
      minimumStock: Number(variantDraft.minimumStock || 0),
      isActive: variantDraft.isActive !== false,
    });

    setIsSavingVariant(false);

    if (res.ok) {
      setEditingVariantId(null);
      router.refresh();
    } else {
      setVariantError(res.error || "Failed to update variant.");
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setVariantError("");

    if (!newSize.trim() || !newSku.trim()) {
      setVariantError("Size and SKU are required.");
      return;
    }

    setIsAddingVariant(true);

    const res = await addVariantToProduct({
      productId: product.id,
      sku: newSku.trim(),
      barcode: newBarcode.trim() || undefined,
      size: newSize.trim(),
      color: product.variants[0]?.color || undefined,
      purchasePrice: Number(newPurchasePrice) || 0,
      sellingPrice: Number(newSellingPrice) || 0,
      mrp: Number(newMrp) || 0,
      openingStock: Number(newStock) || 0,
      minimumStock: Number(newMinStock) || 0,
    });

    setIsAddingVariant(false);

    if (res.ok) {
      setShowAddVariant(false);
      setNewSize("");
      setNewSku("");
      router.refresh();
    } else {
      setVariantError(res.error || "Failed to add size variant.");
    }
  };

  return (
    <div className="product-editor">
      {variantError && (
        <div className="alert">
          <span>⚠️</span>
          <span>{variantError}</span>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <div>
            <p className="section-kicker">Catalog</p>
            <h3>Product master details</h3>
          </div>
          <span className="pill">{product.gender}</span>
        </div>

        <form action={updateAction}>
          <input type="hidden" name="productId" value={product.id} />
          <div className="form-grid">
            <div className="field">
              <label>Product name</label>
              <input className="input" name="name" defaultValue={product.name} required />
            </div>
            <div className="field">
              <label>Model code</label>
              <input className="input" name="modelCode" defaultValue={product.modelCode || ""} />
            </div>
            <div className="field">
              <label>Brand</label>
              <select className="select" name="brandId" defaultValue={product.brandId} required>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select className="select" name="categoryId" defaultValue={product.categoryId} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Gender</label>
              <select className="select" name="gender" defaultValue={product.gender}>
                <option value="MEN">MEN</option>
                <option value="WOMEN">WOMEN</option>
                <option value="UNISEX">UNISEX</option>
                <option value="KIDS">KIDS</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="submit" className="btn btn-primary">
              Save product details
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <p className="section-kicker">Inventory</p>
            <h3>Size variants & pricing</h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddVariant(!showAddVariant)}
          >
            {showAddVariant ? "Cancel" : "+ Add size variant"}
          </button>
        </div>

        {showAddVariant && (
          <form onSubmit={handleAddVariant} className="variant-form">
            <div className="variant-form__header">
              <h4>Add size variant</h4>
              <span className="pill">{product.name}</span>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Size *</label>
                <input
                  className="input"
                  placeholder="e.g. 11"
                  value={newSize}
                  onChange={(e) => {
                    setNewSize(e.target.value);
                    if (!newSku && e.target.value) {
                      setNewSku(`${product.name.toUpperCase().replace(/\s+/g, "")}-${e.target.value}`);
                    }
                  }}
                  required
                />
              </div>
              <div className="field">
                <label>SKU *</label>
                <input
                  className="input"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="e.g. NK-AM-11"
                  required
                />
              </div>
              <div className="field">
                <label>Barcode</label>
                <input
                  className="input"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Optional barcode"
                />
              </div>
              <div className="field">
                <label>Selling price (₹)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                />
              </div>
              <div className="field">
                <label>MRP (₹)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newMrp}
                  onChange={(e) => setNewMrp(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Opening stock</label>
                <input
                  className="input"
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button type="submit" disabled={isAddingVariant} className="btn btn-primary">
                {isAddingVariant ? "Adding..." : "Add size variant"}
              </button>
            </div>
          </form>
        )}

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th>SKU</th>
                <th>Selling price</th>
                <th>MRP</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => {
                const isEditing = editingVariantId === v.id;
                return (
                  <tr key={v.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          style={{ minHeight: 36, width: 72 }}
                          value={variantDraft.size || ""}
                          onChange={(e) => setVariantDraft({ ...variantDraft, size: e.target.value })}
                        />
                      ) : (
                        <div className="variant-row__meta">
                          <strong>Size {v.size}</strong>
                          <small>{v.color || "Color unset"}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          style={{ minHeight: 36 }}
                          value={variantDraft.sku || ""}
                          onChange={(e) => setVariantDraft({ ...variantDraft, sku: e.target.value })}
                        />
                      ) : (
                        <div className="variant-row__meta">
                          <strong>{v.sku}</strong>
                          <small>{v.barcode || "No barcode"}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          style={{ minHeight: 36, width: 110 }}
                          value={variantDraft.sellingPrice ?? 0}
                          onChange={(e) =>
                            setVariantDraft({ ...variantDraft, sellingPrice: Number(e.target.value) })
                          }
                        />
                      ) : (
                        `₹${Number(v.sellingPrice).toLocaleString("en-IN")}`
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          style={{ minHeight: 36, width: 110 }}
                          value={variantDraft.mrp ?? 0}
                          onChange={(e) => setVariantDraft({ ...variantDraft, mrp: Number(e.target.value) })}
                        />
                      ) : (
                        `₹${Number(v.mrp).toLocaleString("en-IN")}`
                      )}
                    </td>
                    <td>
                      <span className={`badge ${v.currentStock <= v.minimumStock ? "badge-low" : "badge-ok"}`}>
                        {v.currentStock}
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="select"
                          style={{ minHeight: 36 }}
                          value={variantDraft.isActive ? "true" : "false"}
                          onChange={(e) =>
                            setVariantDraft({ ...variantDraft, isActive: e.target.value === "true" })
                          }
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span className={`badge ${v.isActive ? "badge-ok" : "badge-low"}`}>
                          {v.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="cell-actions">
                          <button
                            type="button"
                            disabled={isSavingVariant}
                            onClick={() => handleSaveVariant(v.id)}
                            className="btn btn-primary"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVariantId(null)}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditVariant(v)}
                          className="btn btn-secondary"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
