import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PrintButton } from "@/components/print-button";

export default async function SaleInvoice({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { include: { shop: true } },
      items: { include: { variant: { include: { product: { include: { brand: true } } } } } },
      payments: true,
      returns: { include: { items: true } }
    }
  });

  if (!sale) notFound();

  const shopName = sale.user.shop.name;
  
  // Format WhatsApp Text
  let waText = `*Bill from ${shopName}*\n`;
  waText += `Invoice: ${sale.invoiceNumber}\n`;
  waText += `Date: ${sale.saleDate.toLocaleDateString("en-IN")}\n\n`;
  waText += `*Items:*\n`;
  sale.items.forEach(i => {
    waText += `${i.quantity} x ${i.variant.product.brand.name} ${i.variant.product.name} (Size ${i.variant.size}) - ₹${Number(i.total)}\n`;
  });
  if (Number(sale.discount) > 0) {
    waText += `\nSubtotal: ₹${Number(sale.subtotal)}\n`;
    waText += `Discount: -₹${Number(sale.discount)}\n`;
  }
  waText += `\n*Total: ₹${Number(sale.total)}*\n`;
  waText += `\nThank you for shopping with us!`;

  const waUrl = `https://wa.me/${sale.customer?.phone ? `91${sale.customer.phone}` : ""}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="content">
      <div className="row no-print" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            Sale Completed ✅
          </h1>
          <p className="muted">Bill {sale.invoiceNumber} • ₹{Number(sale.total).toLocaleString("en-IN")}</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <PrintButton />
          <a href={waUrl} target="_blank" className="btn btn-primary" style={{ background: "#25D366", borderColor: "#25D366", fontWeight: "bold" }}>
            💬 Share on WhatsApp
          </a>
          <Link className="btn btn-primary" href="/pos" style={{ fontWeight: "bold" }}>
            + New Bill
          </Link>
        </div>
      </div>

      <div className="invoice" style={{ margin: "0 auto" }}>
        <div className="row" style={{ borderBottom: "2px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0" }}>{shopName}</h2>
            <p className="muted" style={{ margin: 0 }}>Invoice: {sale.invoiceNumber}</p>
            <p className="muted" style={{ margin: 0 }}>Date: {sale.saleDate.toLocaleString("en-IN")}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 4px 0" }}><strong>Customer:</strong> {sale.customer?.name ?? "Walk-in"}</p>
            {sale.customer?.phone && <p style={{ margin: "0 0 4px 0" }}>{sale.customer.phone}</p>}
            <p style={{ margin: 0 }}><strong>Payment:</strong> {sale.payments.map(p => p.method).join(", ")}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: 0 }}>Item</th>
              <th>Size</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right", paddingRight: 0 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(i => (
              <tr key={i.id}>
                <td style={{ paddingLeft: 0 }}>
                  <strong>{i.variant.product.brand.name} {i.variant.product.name}</strong><br/>
                  <span className="muted" style={{ fontSize: "12px" }}>{i.variant.sku}</span>
                </td>
                <td>{i.variant.size}</td>
                <td style={{ textAlign: "right" }}>{i.quantity}</td>
                <td style={{ textAlign: "right" }}>₹{Number(i.unitPrice).toLocaleString("en-IN")}</td>
                <td style={{ textAlign: "right", paddingRight: 0 }}>₹{Number(i.total).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="muted">Subtotal</span>
            <span>₹{Number(sale.subtotal).toLocaleString("en-IN")}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="muted">Discount</span>
              <span>-₹{Number(sale.discount).toLocaleString("en-IN")}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid var(--border)" }}>
            <strong>Total</strong>
            <strong>₹{Number(sale.total).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
