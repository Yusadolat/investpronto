# InvestPronto

Multi-tenant investment and revenue-sharing platform for internet service businesses operating across student hostels.

## Quick Start

```bash
npm install
cp .env.local.example .env.local  # configure your database URL
npm run db:push                    # create tables in Neon Postgres
npm run db:seed                    # populate sample data
npm run dev                        # start dev server at http://localhost:3000
```

## Seed Credentials

After running `npm run db:seed`, use these accounts to log in:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@investpronto.com` | `admin123` |
| Investor | `chioma@example.com` | `investor123` |
| Operator | `tunde@example.com` | `operator123` |

**Admin** has full access to all hostels and the admin dashboard at `/admin`.

**Investor** sees the read-only investor portal at `/portal` with their hostel performance and payout history.

**Operator** can log expenses and record revenue for assigned hostels.

## Environment Variables

Create a `.env.local` file with:

```
DATABASE_URL=postgresql://...        # Neon Postgres connection string
NEXTAUTH_SECRET=your-secret-here     # Random string for JWT signing
NEXTAUTH_URL=http://localhost:3000   # App URL
PAYSTACK_SECRET_KEY=sk_test_...      # Paystack secret (for webhook verification)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed database with sample data |

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- Drizzle ORM + Neon Postgres
- Auth.js v5 (credentials provider, JWT sessions)
- Recharts
- Paystack (webhook integration)

## Project Structure

```
src/
  app/
    (auth)/          # Login, invite acceptance pages
    (dashboard)/     # Admin dashboard, hostel management pages
    (investor)/      # Read-only investor portal
    api/             # 15 API routes (hostels, investors, revenue, expenses, payouts, etc.)
  components/
    ui/              # Reusable UI components (Button, Card, Input, DataTable, etc.)
    dashboard/       # Layout components (sidebar, dashboard shell)
  db/
    schema.ts        # Drizzle schema (15 tables, 10 enums)
    index.ts         # Database client
  lib/
    auth.ts          # Auth.js configuration
    authorization.ts # RBAC helpers
    audit.ts         # Audit logging
    profit-engine.ts # Monthly profit calculation engine
    utils.ts         # Formatting, helpers
  types/             # TypeScript type definitions
scripts/
  seed.ts            # Database seeder
```
