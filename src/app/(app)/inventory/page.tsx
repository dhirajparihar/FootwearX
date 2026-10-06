import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export default async function InventoryPage() {
    const user = await requireUser();
  const products = await prisma.product.findMany({
    where: { isActive: true,
        shopId: user.shopId
    },
    include: { 
      brand: true,
      variants: {
        orderBy: { size: "asc" }
      }
    }
  });

  // Sort sizes numerically within each product
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size);
      const nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  const lowStockCount = products.reduce((acc, p) => acc + p.variants.filter(v => v.currentStock <= v.minimumStock).length, 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock & Inventory</h1>
          <p className="text-muted-foreground mt-1">Monitor your inventory levels and low stock alerts.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/inventory/movements">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Stock Ledger
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/adjust">Adjust Stock</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{products.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => {
          const hasLowStock = p.variants.some(v => v.currentStock <= v.minimumStock);
          
          return (
            <Card key={p.id} className={`flex flex-col ${hasLowStock ? "border-destructive/30 bg-destructive/5" : ""}`}>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">
                    {p.brand.name} {p.name}
                  </CardTitle>
                  {hasLowStock && (
                    <Badge variant="destructive" className="ml-2 shrink-0 px-1.5 py-0">
                      Alert
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4">
                <div className="flex flex-wrap gap-2">
                  {p.variants.map(v => {
                    const isLow = v.currentStock <= v.minimumStock;
                    const isOut = v.currentStock === 0;
                    
                    let bg = "bg-muted/50 border-border text-foreground hover:bg-muted/80";
                    let Icon = CheckCircle2;
                    let iconColor = "text-success/70";

                    if (isOut) {
                      bg = "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20";
                      Icon = AlertCircle;
                      iconColor = "text-destructive";
                    } else if (isLow) {
                      bg = "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/30";
                      Icon = AlertTriangle;
                      iconColor = "text-orange-500";
                    }

                    return (
                      <Link 
                        href={`/inventory/adjust?sku=${v.sku}`} 
                        key={v.id} 
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium transition-colors ${bg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                        <span>{v.size}</span>
                        <span className="opacity-40">•</span>
                        <span>{v.currentStock}</span>
                      </Link>
                    );
                  })}
                  {p.variants.length === 0 && <span className="text-sm text-muted-foreground italic">No sizes</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
