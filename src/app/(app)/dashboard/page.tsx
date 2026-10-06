import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, PackageOpen, ShoppingCart, TrendingUp, AlertCircle, IndianRupee } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
    const user = await requireUser();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  
  const [products, low, sales, purchases, stock] = await Promise.all([
    prisma.productVariant.count({ where: { isActive: true,
        product: { is: { shopId: user.shopId } }
    } }),
    prisma.productVariant.count({ where: { isActive: true, currentStock: { lte: 5 },
        product: { is: { shopId: user.shopId } }
    } }),
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { saleDate: { gte: start, lte: end }, status: "COMPLETED",
          shopId: user.shopId
    },
    }),
    prisma.purchase.aggregate({
      _sum: { total: true },
      where: { purchaseDate: { gte: start, lte: end }, status: "COMPLETED",
          shopId: user.shopId
    },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true,
          product: { is: { shopId: user.shopId } }
    },
      select: { currentStock: true, purchasePrice: true },
    }),
  ]);

  const stockValue = stock.reduce((n, x) => n + x.currentStock * Number(x.purchasePrice), 0);
  const money = (v: unknown) => `₹${Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of today's business metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{money(sales._sum.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(purchases._sum.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Stock received today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SKUs</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products}</div>
            <p className="text-xs text-muted-foreground mt-1">Total size variants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{low}</div>
            <p className="text-xs text-muted-foreground mt-1">Items with 5 or fewer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Total Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{money(stockValue)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Calculated based on current stock × purchase price.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full justify-between">
              <Link href="/pos">
                Open POS (Billing)
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/sales/daily">Day Closing</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/products/new">Add Product</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
