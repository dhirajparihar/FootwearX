import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ReportsPage() {
  const [sales, returns, expensesAgg, stock] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      include: { items: { include: { variant: { include: { product: { include: { brand: true } } } } } } }
    }),
    prisma.saleReturn.findMany({
      include: { items: { include: { saleItem: true } } }
    }),
    prisma.expense.aggregate({
      _sum: { amount: true }
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { include: { brand: true } } }
    }),
  ]);

  // Financials
  let grossSales = 0;
  let totalDiscount = 0;
  let cogs = 0;

  const productSales = new Map<string, { name: string, qty: number, rev: number }>();
  const sizeSales = new Map<string, number>();

  sales.forEach(sale => {
    totalDiscount += Number(sale.discount);
    sale.items.forEach(item => {
      const rev = Number(item.total);
      grossSales += rev;
      // Use unitCost if populated, else fallback to variant's purchasePrice just for historical compatibility
      const cost = item.quantity * (Number(item.unitCost) || Number(item.variant.purchasePrice));
      cogs += cost;

      const pName = `${item.variant.product.brand.name} ${item.variant.product.name}`;
      if (!productSales.has(pName)) productSales.set(pName, { name: pName, qty: 0, rev: 0 });
      const pStats = productSales.get(pName)!;
      pStats.qty += item.quantity;
      pStats.rev += rev;

      const size = item.variant.size;
      sizeSales.set(size, (sizeSales.get(size) || 0) + item.quantity);
    });
  });

  let returnAmount = 0;
  let returnCogs = 0;
  returns.forEach(r => {
    returnAmount += Number(r.refundAmount);
    r.items.forEach(item => {
      const cost = item.quantity * (Number(item.saleItem.unitCost) || 0); // fallback 0 if missing
      returnCogs += cost;
    });
  });

  const netSales = grossSales - totalDiscount - returnAmount;
  const netCogs = cogs - returnCogs;
  const grossProfit = netSales - netCogs;
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = grossProfit - totalExpenses;

  // Best Sellers
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topSizes = Array.from(sizeSales.entries()).map(([size, qty]) => ({ size, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const stockValue = stock.reduce((n, x) => n + x.currentStock * Number(x.purchasePrice), 0);
  const deadStock = stock.filter(x => x.currentStock > 0).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-muted-foreground mt-1">Overall financial performance and sales insights.</p>
        </div>
        <div className={`px-5 py-3 rounded-xl border flex flex-col items-end shadow-sm ${
          netProfit >= 0 ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider">Net Profit</div>
          <div className="text-2xl font-bold">₹{netProfit.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Gross Sales</span>
              <span className="font-semibold">₹{grossSales.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discounts</span>
              <span className="font-medium text-destructive">- ₹{totalDiscount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Customer Returns</span>
              <span className="font-medium text-destructive">- ₹{returnAmount.toLocaleString("en-IN")}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Purchase Cost (COGS)</span>
              <span className="font-medium text-destructive">- ₹{netCogs.toLocaleString("en-IN")}</span>
            </div>
            
            <div className="flex justify-between items-center text-base font-semibold pt-2">
              <span>Gross Profit</span>
              <span>₹{grossProfit.toLocaleString("en-IN")}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Shop Expenses</span>
              <span className="font-medium text-destructive">- ₹{totalExpenses.toLocaleString("en-IN")}</span>
            </div>
            
            <div className={`flex justify-between items-center text-lg font-bold pt-2 ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              <span>Net Profit</span>
              <span>₹{netProfit.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-md">{p.qty} sold</span>
                  </div>
                ))}
                {topProducts.length === 0 && <span className="text-sm text-muted-foreground italic">No sales yet.</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fast Moving Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {topSizes.map(s => (
                  <div key={s.size} className="bg-muted border border-border px-4 py-2 rounded-xl text-center flex-1 min-w-[80px]">
                    <div className="text-lg font-bold">{s.size}</div>
                    <div className="text-xs text-muted-foreground font-medium">{s.qty} pairs</div>
                  </div>
                ))}
                {topSizes.length === 0 && <span className="text-sm text-muted-foreground italic">No sales yet.</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Total Stock Worth</CardTitle>
              <div className="text-2xl font-bold text-primary">₹{stockValue.toLocaleString("en-IN")}</div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total money currently locked in shop inventory (based on cost price).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dead Stock <span className="text-muted-foreground font-normal text-sm ml-2">(Oldest sitting pairs)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadStock.map((s, i) => (
                <div key={s.id} className="flex justify-between items-center text-sm">
                  <span>{s.product.brand.name} {s.product.name} (Size {s.size})</span>
                  <span className="text-muted-foreground font-medium">{s.currentStock} pairs</span>
                </div>
              ))}
              {deadStock.length === 0 && <span className="text-sm text-muted-foreground italic">No dead stock found.</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
