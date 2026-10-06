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
import { requireUser } from "@/lib/auth";

const PAGE_SIZE = 50;

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1) || 1, 1);

  const [sales, totalSales] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId: user.shopId },
      select: {
        id: true,
        invoiceNumber: true,
        saleDate: true,
        total: true,
        customer: { select: { name: true } },
        items: { select: { quantity: true } },
        payments: { select: { id: true, amount: true, method: true } },
        returns: { select: { id: true } },
      },
      orderBy: { saleDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.sale.count({ where: { shopId: user.shopId } }),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground mt-1">
            {totalSales} invoices · showing {sales.length} records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/sales/daily" prefetch={false}>Day Closing</Link>
          </Button>
          <Button asChild>
            <Link href="/pos" prefetch={false}>
              <Plus className="h-4 w-4 mr-2" />
              New Sale (POS)
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold text-center">Items</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(s => {
                  const isUdhaar = s.payments.length > 0 && s.payments.reduce((sum, p) => sum + Number(p.amount), 0) < Number(s.total);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/sales/${s.id}`} prefetch={false} className="text-primary hover:underline">
                          {s.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{s.saleDate.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{s.customer?.name ?? <span className="text-muted-foreground italic">Walk-in</span>}</TableCell>
                      <TableCell className="text-center">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.payments.map(p => (
                            <Badge key={p.id} variant="secondary" className="text-[10px] uppercase">
                              {p.method}
                            </Badge>
                          ))}
                          {isUdhaar && <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-700 bg-orange-50 uppercase">UDHAAR</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{Number(s.total).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/sales/${s.id}/return`} prefetch={false}>
                            <Undo2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            Return
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No sales recorded yet.
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
