import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, Banknote, CreditCard, Smartphone, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PrintButton } from "@/components/ui/print-button";
import { requireUser } from "@/lib/auth";

export default async function DailySalesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const user = await requireUser();
  const params = await searchParams;
  const dateParam = params.date;
  
  // Parse date or use today
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  if (isNaN(targetDate.getTime())) {
    redirect("/sales/daily");
  }

  // Set start and end of the day
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  // Formatting strings for UI
  const dateInputStr = start.toLocaleDateString('en-CA'); // YYYY-MM-DD for html input
  const displayDateStr = start.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [sales, returns, payments] = await Promise.all([
    prisma.sale.findMany({
      where: { saleDate: { gte: start, lte: end }, status: "COMPLETED",
          shopId: user.shopId
    },
      include: { 
        items: { include: { variant: { include: { product: true } } } } 
      }
    }),
    prisma.saleReturn.findMany({
      where: { createdAt: { gte: start, lte: end },
          shopId: user.shopId
    }
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: start, lte: end },
          sale: { is: { shopId: user.shopId } }
    }
    })
  ]);

  // Calculations
  let grossSales = 0;
  let totalDiscount = 0;
  const itemSoldMap = new Map<string, { name: string, size: string, qty: number, total: number }>();

  sales.forEach(sale => {
    totalDiscount += Number(sale.discount);
    sale.items.forEach(item => {
      grossSales += Number(item.total);
      
      const key = item.variantId;
      if (!itemSoldMap.has(key)) {
        itemSoldMap.set(key, {
          name: `${item.variant.product.name}`,
          size: item.variant.size,
          qty: 0,
          total: 0
        });
      }
      const existing = itemSoldMap.get(key)!;
      existing.qty += item.quantity;
      existing.total += Number(item.total);
    });
  });

  let totalReturns = returns.reduce((sum, r) => sum + Number(r.refundAmount), 0);
  
  // Payment Breakdown
  let cash = 0, upi = 0, card = 0, other = 0;
  payments.forEach(p => {
    const amt = Number(p.amount);
    if (p.method === "CASH") cash += amt;
    else if (p.method === "UPI") upi += amt;
    else if (p.method === "CARD") card += amt;
    else other += amt;
  });

  const netCollection = cash + upi + card + other - totalReturns;
  const soldItems = Array.from(itemSoldMap.values()).sort((a, b) => b.qty - a.qty);

  // Helper for previous/next day
  const prevDay = new Date(start); prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(start); nextDay.setDate(nextDay.getDate() + 1);
  const isToday = start.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="icon-sm" className="-ml-2">
              <Link href="/sales"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Day Closing</h1>
          </div>
          <p className="text-muted-foreground">Tally cash drawer and review daily performance.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto bg-background p-1 border rounded-lg shadow-sm">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/sales/daily?date=${prevDay.toLocaleDateString('en-CA')}`}>Prev</Link>
          </Button>
          
          <form className="relative flex-1 sm:w-auto flex items-center">
            <input 
              type="date" 
              name="date"
              defaultValue={dateInputStr}
              className="h-8 text-sm font-medium bg-transparent border-none px-2 w-full focus:ring-0 cursor-pointer"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-7 px-2 ml-1 text-xs">
              Go
            </Button>
          </form>

          <Button asChild variant="ghost" size="sm" disabled={isToday}>
            <Link href={isToday ? "#" : `/sales/daily?date=${nextDay.toLocaleDateString('en-CA')}`}>Next</Link>
          </Button>
        </div>
      </div>

      <div className="text-center py-4 bg-muted/30 border rounded-xl">
        <h2 className="font-semibold text-lg">{displayDateStr}</h2>
        <div className="text-sm text-muted-foreground mt-1">
          {sales.length} Bills • {soldItems.reduce((n, i) => n + i.qty, 0)} Items Sold
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Breakdown */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-lg flex items-center justify-between">
              Net Collection
              <span className="text-2xl text-primary">₹{netCollection.toLocaleString("en-IN")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-medium">
                <Banknote className="h-5 w-5" /> Cash Drawer
              </div>
              <div className="text-lg font-bold text-green-800 dark:text-green-300">
                ₹{cash.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400 font-medium">
                <Smartphone className="h-5 w-5" /> UPI / Online
              </div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-300">
                ₹{upi.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-medium">
                <CreditCard className="h-5 w-5" /> Card / POS
              </div>
              <div className="text-lg font-bold text-orange-800 dark:text-orange-300">
                ₹{card.toLocaleString("en-IN")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-lg">Sales Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Gross Sales</span>
              <span className="font-medium">₹{grossSales.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discounts Given</span>
              <span className="text-destructive font-medium">- ₹{totalDiscount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-3">
              <span className="text-muted-foreground">Returns/Refunds Issued</span>
              <span className="text-destructive font-medium">- ₹{totalReturns.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center pt-1 font-semibold text-base">
              <span>Total Revenue</span>
              <span>₹{(grossSales - totalDiscount - totalReturns).toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Items Sold Today</CardTitle>
          <PrintButton />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Product Name</TableHead>
                  <TableHead className="font-semibold text-center">Size</TableHead>
                  <TableHead className="font-semibold text-center">Qty Sold</TableHead>
                  <TableHead className="font-semibold text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.size}</TableCell>
                    <TableCell className="text-center font-semibold">{item.qty}</TableCell>
                    <TableCell className="text-right">₹{item.total.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
                {soldItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No items sold on this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{__html:`
        @media print {
          body * { visibility: hidden; }
          .max-w-5xl, .max-w-5xl * { visibility: visible; }
          .max-w-5xl { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
          .shadow-sm { box-shadow: none; border-color: #000; }
          button, a, form { display: none !important; }
        }
      `}} />
    </div>
  );
}
