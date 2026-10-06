import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createCustomer } from "@/app/actions/master-data";
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

export default async function CustomersPage() {
    const user = await requireUser();
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    take: 300,
      where: { shopId: user.shopId }
});

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">Customer records for invoices and returns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Customer</CardTitle>
              <CardDescription>Create a new customer profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="9876543210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="123 Main St, City" />
                </div>
                <Button type="submit" className="w-full">Save Customer</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <Link href={`/customers/${c.id}`} className="text-primary hover:underline">
                            {c.name}
                          </Link>
                        </TableCell>
                        <TableCell>{c.phone || <span className="text-muted-foreground italic">—</span>}</TableCell>
                        <TableCell>{c.email || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      </TableRow>
                    ))}
                    {customers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No customers found.
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
