import { prisma } from "@/lib/prisma";
import { createSupplier } from "@/app/actions/master-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";

export default async function SuppliersPage() {
    const user = await requireUser();
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    take: 300,
      where: { shopId: user.shopId }
});

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground mt-1">Manage wholesale distributors and brands.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Supplier</CardTitle>
              <CardDescription>Create a new supplier profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createSupplier} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Nike India Pvt Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="9876543210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="sales@nike.in" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" name="gstNumber" placeholder="29XXXXX..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="123 Industrial Area, City" />
                </div>
                <Button type="submit" className="w-full">Save Supplier</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">GST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.phone || <span className="text-muted-foreground italic">—</span>}</TableCell>
                        <TableCell>{s.gstNumber || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      </TableRow>
                    ))}
                    {suppliers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No suppliers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
