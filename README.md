# Footwear Inventory + POS

A practical single-shop footwear inventory and billing app built with Next.js, PostgreSQL and Prisma.

## Included

- Real login/session authentication with OWNER / MANAGER / STAFF roles
- Product model + size/color SKU management
- Barcode/SKU/product search in POS
- Atomic stock updates to prevent overselling
- Purchase receiving
- Supplier purchase returns
- Sales with cash / UPI / card / other payments
- Customer sale returns
- Stock adjustments and damage
- Stock movement ledger + audit log
- Printable invoice view
- Dashboard and stock/sales reports
- Low-stock tracking
- PWA manifest + service worker shell caching

## Important

This is a strong working foundation, but production deployment still needs your own database, backups, HTTPS, real shop details, and final business-policy decisions (GST/tax, invoice format, refund policy, etc.). Offline POS is intentionally not enabled; the server database remains the source of truth.

## Run locally

1. Install PostgreSQL and create a database named `footwear_inventory`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install packages:

```bash
npm install
```

4. Generate Prisma client and create the database schema:

```bash
npm run db:generate
npm run db:migrate -- --name init
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo login

- Email: `owner@example.com`
- Password: `ChangeMe123!`

**Change the password before using real shop data.**

## Business flow

`Purchase → Stock → POS Sale → Payment → Invoice → Sale Return`

Every physical stock change is written to `StockMovement` and the SKU balance is changed in the same database transaction.
