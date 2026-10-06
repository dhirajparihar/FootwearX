import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function ProductsPage() {
    const user = await requireUser();
  const products = await prisma.product.findMany({
    include: { 
      brand: true, 
      category: true,
      variants: {
        orderBy: { size: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
      where: { shopId: user.shopId }
});

  // Helper to sort sizes numerically
  products.forEach(p => {
    p.variants.sort((a, b) => {
      const na = parseFloat(a.size);
      const nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog and stock across all sizes.</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => {
          // Assume price is the same across variants for simplicity of display
          const price = p.variants[0]?.sellingPrice || 0;
          const color = p.variants.find(v => v.color)?.color;
          const totalStock = p.variants.reduce((acc, v) => acc + v.currentStock, 0);

          return (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg leading-tight">
                      {p.brand.name} {p.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="font-normal">{p.category.name}</Badge>
                      <Badge variant="outline" className="font-normal bg-background">{p.gender}</Badge>
                      {color && <Badge variant="outline" className="font-normal bg-background">{color}</Badge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-lg">₹{Number(price).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Total: {totalStock} pairs</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4">
                <div className="flex flex-wrap gap-2">
                  {p.variants.map(v => (
                    <div 
                      key={v.id} 
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium ${
                        v.currentStock === 0 
                          ? "bg-destructive/10 border-destructive/20 text-destructive" 
                          : "bg-primary/10 border-primary/20 text-primary"
                      }`}
                    >
                      <span>{v.size}</span>
                      <span className="opacity-40">•</span>
                      <span>{v.currentStock}</span>
                    </div>
                  ))}
                  {p.variants.length === 0 && <span className="text-sm text-muted-foreground italic">No sizes defined</span>}
                </div>
              </CardContent>

              <CardFooter className="pt-0 p-4 mt-auto">
                <Button variant="outline" className="w-full text-xs" asChild>
                  <Link href={`/products/${p.id}/edit`}>
                    Edit Product
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
