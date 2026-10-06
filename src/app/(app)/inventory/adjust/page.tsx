import { prisma } from "@/lib/prisma";
import { adjust } from "@/app/actions/inventory";
import { requireUser } from "@/lib/auth";

export default async function AdjustPage() {
    const user = await requireUser();
  const variants = await prisma.productVariant.findMany({ where: { isActive: true,
      product: { is: { shopId: user.shopId } }
}, include: { product: true }, orderBy: { sku: "asc" } });
  return <div className="content"><h1>Adjust stock</h1><form action={adjust} className="card" style={{maxWidth:700,marginTop:18}}>
    <div className="field"><label>SKU</label><select className="select" name="variantId">{variants.map(v=><option key={v.id} value={v.id}>{v.sku} — {v.product.name} — stock {v.currentStock}</option>)}</select></div>
    <div className="field" style={{marginTop:12}}><label>Change (+/-)</label><input className="input" name="delta" type="number" required placeholder="-1 or 2" /></div>
    <div className="field" style={{marginTop:12}}><label>Reason</label><input className="input" name="note" required /></div>
    <button className="btn btn-primary" style={{marginTop:14}}>Apply adjustment</button>
  </form></div>;
}
