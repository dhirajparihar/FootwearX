import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PrintButton } from "@/components/print-button";
import { CheckCircle2, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SaleInvoice({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sale = await prisma.sale.findFirst({
    where: { id, shopId: user.shopId },
    include: {
      customer: true,
      user: { include: { shop: { include: { settings: true } } } },
      items: { include: { variant: { include: { product: { include: { brand: true } } } } } },
      payments: true,
      returns: { include: { items: true } },
    }
  });

  if (!sale) notFound();

  const shop = sale.user.shop;
  const shopName = shop.name;
  const total = Number(sale.total);
  const subtotal = Number(sale.subtotal);
  const discount = Number(sale.discount);
  const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
  const due = total - paid;

  // WhatsApp text
  let waText = `*Bill from ${shopName}*\n`;
  waText += `Invoice: ${sale.invoiceNumber}\n`;
  waText += `Date: ${sale.saleDate.toLocaleDateString("en-IN")}\n\n`;
  waText += `*Items:*\n`;
  sale.items.forEach(i => {
    waText += `${i.quantity} x ${i.variant.product.brand.name} ${i.variant.product.name} (Size ${i.variant.size}) — ₹${Number(i.total).toLocaleString("en-IN")}\n`;
  });
  if (discount > 0) {
    waText += `\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}\n`;
    waText += `Discount: -₹${discount.toLocaleString("en-IN")}\n`;
  }
  waText += `\n*Total: ₹${total.toLocaleString("en-IN")}*`;
  if (due > 0) waText += `\n*Balance Due: ₹${due.toLocaleString("en-IN")}*`;
  waText += `\n\nThank you for shopping at ${shopName}! 🙏`;

  const waUrl = `https://wa.me/${sale.customer?.phone ? `91${sale.customer.phone}` : ""}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="pb-20 sm:pb-8 space-y-6 max-w-2xl mx-auto">

      {/* ─── Success banner (no-print) ─── */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-900 text-lg leading-none">{sale.invoiceNumber}</p>
            <p className="text-emerald-700 text-sm mt-1">
              ₹{total.toLocaleString("en-IN")} collected
              {due > 0 && <span className="text-orange-700 ml-2">· ₹{due.toLocaleString("en-IN")} due</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PrintButton />
          <a href={waUrl} target="_blank">
            <Button className="gap-2 bg-[#25D366] hover:bg-[#20c05a] text-white border-transparent">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <Button asChild>
            <Link href="/pos" className="gap-2">
              <Plus className="h-4 w-4" />
              New Bill
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Printable Invoice ─── */}
      <div className="rounded-2xl border bg-white overflow-hidden shadow-sm print:shadow-none print:border-0 print:rounded-none">

        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent border-b p-5 sm:p-7">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{shopName}</h1>
              {shop.address && <p className="text-sm text-muted-foreground mt-0.5">{shop.address}</p>}
              {shop.phone && <p className="text-sm text-muted-foreground">{shop.phone}</p>}
              {shop.gstNumber && <p className="text-xs text-muted-foreground mt-1">GST: {shop.gstNumber}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Invoice</p>
              <p className="font-mono font-bold text-lg text-foreground">{sale.invoiceNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {sale.saleDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground">
                {sale.saleDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {/* Customer + Payment */}
        <div className="grid grid-cols-2 divide-x border-b bg-muted/5">
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
            <p className="font-semibold text-foreground">{sale.customer?.name ?? "Walk-in"}</p>
            {sale.customer?.phone && <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>}
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment</p>
            <div className="flex flex-wrap gap-1.5">
              {sale.payments.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1 text-sm font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  {p.method}
                  <span className="text-muted-foreground font-normal">·</span>
                  <span className="tabular-nums">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                </span>
              ))}
              {due > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                  Due · ₹{due.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left font-semibold text-muted-foreground p-3 sm:p-4 pl-5">Item</th>
                <th className="text-center font-semibold text-muted-foreground p-3">Size</th>
                <th className="text-center font-semibold text-muted-foreground p-3">Qty</th>
                <th className="text-right font-semibold text-muted-foreground p-3">Price</th>
                <th className="text-right font-semibold text-muted-foreground p-3 sm:p-4 pr-5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sale.items.map(i => (
                <tr key={i.id} className="hover:bg-muted/5">
                  <td className="p-3 sm:p-4 pl-5">
                    <p className="font-semibold text-foreground leading-snug">
                      {i.variant.product.brand.name} {i.variant.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{i.variant.sku}</p>
                  </td>
                  <td className="text-center p-3 font-medium">{i.variant.size}</td>
                  <td className="text-center p-3 tabular-nums">{i.quantity}</td>
                  <td className="text-right p-3 tabular-nums">₹{Number(i.unitPrice).toLocaleString("en-IN")}</td>
                  <td className="text-right p-3 sm:p-4 pr-5 font-semibold tabular-nums">₹{Number(i.total).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t p-5 sm:p-6 bg-muted/5">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums font-medium text-emerald-700">−₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 mt-2 border-t">
              <span className="font-bold text-lg">Total</span>
              <span className="font-extrabold text-2xl tabular-nums tracking-tight text-primary">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center text-xs text-muted-foreground bg-muted/5">
          Thank you for shopping at {shopName}! · Powered by FootwearX
        </div>
      </div>
    </div>
  );
}
