import {prisma} from "@/lib/prisma";
import {requireRole, requireUser } from "@/lib/auth";
import {PurchaseReturnForm} from "@/components/purchase-return-form";
export default async function PurchaseReturnPage({params}:{params:Promise<{id:string}>}){const user = await requireRole(["OWNER","MANAGER"]);const {id}=await params;const p=await prisma.purchase.findFirst({where:{id,
    shopId: user.shopId
},include:{supplier:true,items:{include:{variant:{include:{product:true}}}}}});if(!p)return <div className="content"><h1>Purchase not found</h1></div>;return <div className="content"><h1>Supplier return {p.invoiceNumber}</h1><p className="muted">Return stock to the supplier.</p><PurchaseReturnForm purchaseId={p.id} items={p.items.map(i=>({id:i.id,label:`${i.variant.product.name} · ${i.variant.sku} · Size ${i.variant.size}`,purchased:i.quantity,cost:Number(i.unitCost)}))}/></div>}
