import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { PurchaseForm } from "@/components/purchase-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewPurchasePage() {
  const user = await requirePermission("manage_stock");
  
  const [suppliers, variants] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true,
        shopId: user.shopId
    }, orderBy: { name: "asc" } }),
    prisma.productVariant.findMany({ 
      where: { isActive: true,
          product: { is: { shopId: user.shopId } }
    }, 
      include: { product: { include: { brand: true } } }, 
      orderBy: { sku: "asc" } 
    })
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Purchase</h1>
          <p className="text-muted-foreground mt-1">
            Receiving stock creates purchase records and stock movements together.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchases
          </Link>
        </Button>
      </div>
      <PurchaseForm 
        suppliers={suppliers} 
        variants={variants.map(v => ({
          id: v.id,
          label: `${v.product.brand.name} ${v.product.name} · ${v.sku} · Size ${v.size}`,
          cost: Number(v.purchasePrice)
        }))}
      />
    </div>
  );
}
