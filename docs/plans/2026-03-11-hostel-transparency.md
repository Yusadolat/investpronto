# Hostel Transparency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add setup-cost and capital-stack transparency so admins can record hostel build-out spending and investors can see what was spent, who funded it, and each contributor's stake.

**Architecture:** Keep the existing hostel, agreement, revenue, expense, and payout flows intact. Add two new data sets, `setup_cost_items` and `capital_contributions`, derive transparency summaries in a pure library helper, expose them through hostel APIs, and render them in the admin hostel view and investor portal.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, Neon Postgres, node:test via `tsx --test`

---

### Task 1: Add summary tests and helper

**Files:**
- Create: `tests/lib/transparency.test.ts`
- Create: `src/lib/transparency.ts`

**Step 1: Write the failing test**

Add coverage for:
- one-time vs recurring setup totals
- remaining setup budget and over-budget handling
- total contributed capital
- founder/cofounder/investor capital totals
- per-contributor capital percentage

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/lib/transparency.test.ts`

Expected: FAIL because `src/lib/transparency.ts` does not exist yet.

**Step 3: Write minimal implementation**

Implement pure helpers that accept plain objects and return transparency summaries.

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/lib/transparency.test.ts`

Expected: PASS

### Task 2: Extend the schema

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `scripts/seed.ts`

**Step 1: Add new schema objects**

Add:
- `setup_cost_type` enum
- `capital_contributor_type` enum
- `setup_cost_items` table
- `capital_contributions` table
- relations from hostels and users where needed

**Step 2: Seed sample transparency data**

Insert realistic setup line items and founder/cofounder/investor capital contributions for the sample hostel.

**Step 3: Run schema/type verification**

Run: `npm run lint`

Expected: no schema/type errors introduced by the new tables.

### Task 3: Expose transparency in APIs

**Files:**
- Modify: `src/app/api/hostels/[hostelId]/route.ts`
- Create: `src/app/api/hostels/[hostelId]/setup-items/route.ts`
- Create: `src/app/api/hostels/[hostelId]/capital-contributions/route.ts`

**Step 1: Extend hostel GET**

Return:
- setup summary
- setup items
- capital summary
- capital contributions
- investor capital percentage alongside profit-share data

**Step 2: Add admin POST endpoints**

Allow admins to add setup items and capital contributions. Reuse existing auth and audit patterns.

**Step 3: Run targeted verification**

Run: `npm run lint`

Expected: API routes compile cleanly.

### Task 4: Render admin transparency UI

**Files:**
- Modify: `src/app/(dashboard)/hostels/[hostelId]/page.tsx`

**Step 1: Replace synthetic data assumptions**

Use real API response values instead of random chart data when possible, and map the new transparency payload.

**Step 2: Add setup and capital sections**

Show:
- setup summary cards
- setup item table
- capital stack summary cards
- contribution table
- admin-only modals to add setup items and contributions

**Step 3: Re-fetch after write actions**

Use the existing page fetch flow to refresh the overview after a successful POST.

### Task 5: Render investor transparency UI

**Files:**
- Modify: `src/app/(investor)/portal/[hostelId]/page.tsx`

**Step 1: Map transparency payload**

Read the new transparency data from the hostel API response.

**Step 2: Add read-only setup and capital sections**

Show:
- total setup budget and recorded spend
- recurring vs one-time setup items
- capital stack
- investor capital stake vs profit-share percentage

**Step 3: Keep payout and monthly trend sections intact**

Do not change the existing payout-history behavior beyond adding context.

### Task 6: Clean up response mismatches in touched flows

**Files:**
- Modify: `src/app/(dashboard)/hostels/[hostelId]/page.tsx`
- Modify: `src/app/(investor)/portal/[hostelId]/page.tsx`

**Step 1: Use correct nested API payloads**

The hostel API returns `{ hostel, dashboard }`. Update the overview and investor detail pages to use the nested objects instead of assuming everything is flattened at the top level.

**Step 2: Keep the scope tight**

Only fix mismatches that block or weaken the transparency feature.

### Task 7: Final verification

**Files:**
- Modify: `product.md`

**Step 1: Update product context**

Document the new setup transparency and capital-stack capability.

**Step 2: Run verification**

Run:
- `npx tsx --test tests/lib/transparency.test.ts`
- `npm run lint`

Expected: all pass
