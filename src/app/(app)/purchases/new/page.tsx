import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {requireRole} from "@/lib/auth";
import {PurchaseForm} from "@/components/purchase-form";
export default async function NewPurchasePage(){await requireRole(["OWNER","MANAGER"]);const[suppliers,variants]=await Promise.all([prisma.supplier.findMany({where:{isActive:true},orderBy:{name:"asc"}}),prisma.productVariant.findMany({where:{isActive:true},include:{product:{include:{brand:true}}},orderBy:{sku:"asc"}})]);return <div className="content"><div className="row"><div><h1>Receive Purchase</h1><p className="muted">Receiving stock creates purchase records and stock movements together.</p></div><Link href="/purchases" className="btn">Back</Link></div><PurchaseForm suppliers={suppliers} variants={variants.map(v=>({id:v.id,label:`${v.product.brand.name} ${v.product.name} · ${v.sku} · Size ${v.size}`,cost:Number(v.purchasePrice)}))}/></div>}
