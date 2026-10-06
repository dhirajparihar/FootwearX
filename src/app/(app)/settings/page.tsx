import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createUser } from "@/app/actions/master-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Store, ShieldCheck, Mail, Phone, Hash } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findFirst({
    where: { id: user.shopId },
    include: { settings: true, users: { orderBy: { name: "asc" } } }
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage shop details and user access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-lg font-bold">{shop?.name}</div>
              <div className="text-muted-foreground text-sm">{shop?.address || "No address"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/> Phone</div>
                <div className="font-medium">{shop?.phone || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3"/> GST Number</div>
                <div className="font-medium">{shop?.gstNumber || "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Invoice Prefix</div>
                <div className="font-mono font-medium">{shop?.settings?.invoicePrefix}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Next Invoice No</div>
                <div className="font-mono font-medium">{shop?.settings?.nextInvoiceNo}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Grant staff or manager access to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Alice" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="alice@shop.com" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" minLength={8} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="STAFF">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold text-center">Role</TableHead>
                  <TableHead className="font-semibold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shop?.users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {u.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={u.role === "OWNER" ? "default" : u.role === "MANAGER" ? "secondary" : "outline"} className="uppercase text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={u.isActive ? "default" : "destructive"} className={u.isActive ? "bg-success/10 text-success hover:bg-success/20 border-success/20" : ""}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
