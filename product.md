# InvestPronto - Product Overview

## What It Is

InvestPronto is a multi-tenant investment and revenue-sharing platform for an internet services business (Prontoville) operating across multiple student hostels. Each hostel is a separate project/business unit with its own investors, revenue, expenses, and profit-sharing agreements.

## Problem

Running internet service across multiple student hostels involves multiple investors per location, monthly revenue collection, daily operational expenses, and profit-sharing calculations. Tracking all of this manually in spreadsheets leads to errors, disputes, and zero auditability.

## Solution

A centralized platform where:
- **Founders/Admins** manage hostels, track revenue and expenses, run profit calculations, and generate investor reports
- **Operators/Accountants** log daily expenses with receipt uploads and manage revenue entries
- **Investors** view their hostel performance, returns, and payout history through a read-only portal

## Core Features

### Multi-Tenant Hostel Management
- Each hostel is an isolated business unit with its own financials
- Data isolation enforced at the query level (not just UI)
- Support for multiple organizations and hostel projects

### Role-Based Access
| Role | Access |
|------|--------|
| Super Admin | Full platform access, all hostels |
| Admin/Founder | Manage assigned hostels, invite investors, approve expenses |
| Operator/Accountant | Log expenses, record revenue for assigned hostels |
| Investor | Read-only portal showing their hostel performance and payouts |

### Investment Agreements
- Invite-based investor onboarding
- Configurable agreement types: profit_share, revenue_share, equity, custom
- Percentage-based return calculation
- Track amount invested, date, and agreement status

### Revenue Tracking
- Manual entry by operators/admins
- Paystack webhook integration for automated payment sync
- Grouped by hostel and month
- Distinguishes gross, net, and refunded revenue

### Expense Management
- Daily/monthly expense logging per hostel
- 6 categories: bandwidth, power/fuel, maintenance, staff/operations, device replacement, miscellaneous
- Receipt upload support
- Approval workflow (operator submits, admin approves)

### Setup Transparency
- Record hostel setup costs as line-by-line items, not just a single total
- Mark each setup item as one-time or recurring
- Show investors exactly how setup funds were spent before and after launch
- Preserve vendors, dates, and receipts for auditability

### Capital Stack Visibility
- Track founder, co-founder, and investor contributions separately
- Show each contributor's capital stake against the hostel setup budget
- Compare capital stake with profit-share agreements for full transparency
- Surface funding gaps or excess capital per hostel

### Profit Calculation Engine
- Monthly per hostel: gross revenue - refunds - expenses = net distributable profit
- Distributes profit per investor agreement percentages
- Saves monthly snapshots for historical reference
- Generates payout records

### Audit Trail
- Every critical action is logged with timestamp and acting user
- Tracks creates, updates, approvals, payouts, and invitations

### Reporting
- Month-by-month financial summaries per hostel
- Investor-specific return breakdowns
- Exportable monthly reports

## Technical Architecture

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend**: Next.js API routes (serverless)
- **Database**: Neon Postgres with Drizzle ORM
- **Auth**: Auth.js v5 (next-auth beta) with credentials provider, JWT sessions
- **Payments**: Paystack webhook integration
- **File uploads**: Cloudinary/S3 for expense receipts

## Currency

All monetary values are in Nigerian Naira (NGN / ₦).

## Seed Data

One sample hostel is pre-configured:
- **Hostel**: Grace Hall (University of Lagos)
- **Setup cost**: ₦2,500,000
- **Founder + co-founder contribution**: ₦1,000,000
- **Investor contribution**: ₦1,500,000 (Chioma Okafor, 60% profit share)
- **Setup line items and capital contributions** are included for transparency
- **3 months** of revenue, expenses, snapshots, and payouts
