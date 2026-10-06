import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function MovementsPage() {
    const user = await requireUser();
  const rows = await prisma.stockMovement.findMany({
    include: { variant: { include: { product: true } }, user: true },
    orderBy: { createdAt: "desc" },
    take: 300,
      where: { shopId: user.shopId }
});

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Ledger</h1>
          <p className="text-muted-foreground mt-1">Every stock change is recorded here.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stock
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold text-center">Type</TableHead>
                  <TableHead className="font-semibold text-right">Qty</TableHead>
                  <TableHead className="font-semibold">Note</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {r.createdAt.toLocaleString("en-IN", {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.variant.product.name} (Size {r.variant.size})
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.variant.sku}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="uppercase text-[10px] bg-background">
                        {r.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <div className={`flex items-center justify-end gap-1 ${r.quantity < 0 ? "text-destructive" : "text-success"}`}>
                        {r.quantity > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {r.quantity > 0 ? "+" : ""}{r.quantity}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.note ?? <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.user.name}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
