import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReceiptIndianRupee } from "lucide-react";

export default async function UdhaarPage() {
  const sales = await prisma.sale.findMany({
    where: { 
      status: "COMPLETED",
      dueDate: { not: null }
    },
    include: {
      customer: true,
      payments: true
    },
    orderBy: { dueDate: 'asc' }
  });

  const activeCredits = sales.filter(s => {
    const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return paid < Number(s.total) - 0.01;
  });

  let totalDue = 0;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Udhaar</h1>
        <p className="text-muted-foreground mt-1">Track pending customer payments and due dates.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold text-right">Bill Total</TableHead>
                  <TableHead className="font-semibold text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-right text-destructive">Balance Due</TableHead>
                  <TableHead className="font-semibold text-center">Due Date</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No pending customer payments.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeCredits.map(sale => {
                    const total = Number(sale.total);
                    const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    const due = total - paid;
                    totalDue += due;

                    const isOverdue = sale.dueDate && sale.dueDate < new Date();

                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="font-semibold">{sale.customer?.name}</div>
                          <div className="text-xs text-muted-foreground">{sale.customer?.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/sales/${sale.id}`} className="text-primary hover:underline">
                            {sale.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">₹{total.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{paid.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right font-bold text-destructive">₹{due.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isOverdue ? "destructive" : "secondary"}>
                            {sale.dueDate ? format(sale.dueDate, "dd MMM yyyy") : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm">
                            <Link href={`/sales/${sale.id}`}>Collect</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {activeCredits.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <ReceiptIndianRupee className="h-8 w-8 text-destructive" />
              <div className="text-lg font-semibold text-destructive">Total Udhaar Pending in Market</div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-destructive">
              ₹{totalDue.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
