import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Undo2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    include: { supplier: true, items: true },
    orderBy: { purchaseDate: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1">Supplier purchases received into stock.</p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="h-4 w-4 mr-2" />
            Receive Purchase
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Supplier</TableHead>
                  <TableHead className="font-semibold text-center">Items</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.invoiceNumber}</TableCell>
                    <TableCell>{p.purchaseDate.toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>{p.supplier.name}</TableCell>
                    <TableCell className="text-center">{p.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-semibold">₹{Number(p.total).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant="secondary" className="uppercase text-[10px]">{p.status}</Badge>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/purchases/${p.id}/return`}>
                            <Undo2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            Return
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {purchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No purchases recorded yet.
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
