import {prisma} from "@/lib/prisma";
import {requireRole} from "@/lib/auth";
import {SaleReturnForm} from "@/components/sale-return-form";
export default async function ReturnPage({params}:{params:Promise<{id:string}>}){
  await requireRole(["OWNER","MANAGER","STAFF"]);
  const {id}=await params;
  const sale=await prisma.sale.findUnique({where:{id},include:{items:{include:{variant:{include:{product:true}}}}}});
  if(!sale)return <div className="content"><h1>Sale not found</h1></div>;
  return <div className="content"><h1>Return {sale.invoiceNumber}</h1><p className="muted">Choose quantities to return. Stock will be added back.</p><SaleReturnForm saleId={sale.id} items={sale.items.map(i=>({id:i.id,label:`${i.variant.product.name} · ${i.variant.sku} · Size ${i.variant.size}`,sold:i.quantity,price:Number(i.unitPrice)}))}/></div>;
}
