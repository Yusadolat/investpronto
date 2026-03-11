import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  monthlyFinancialSnapshots,
  revenueEntries,
  expenseEntries,
  payouts,
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { getLastNMonthKeys, formatMonthKey } from '@/lib/utils';
import type { MonthlyFinancials } from '@/types';

type MonthlyReportRow = MonthlyFinancials & {
  investorPayouts: number;
};

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const monthsParam = request.nextUrl.searchParams.get('months');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId);

    const numMonths = monthsParam ? parseInt(monthsParam, 10) : 6;
    const monthKeys = getLastNMonthKeys(numMonths);

    // Try to get snapshots first
    const snapshots = await db
      .select()
      .from(monthlyFinancialSnapshots)
      .where(eq(monthlyFinancialSnapshots.hostelId, hostelId));

    const snapshotMap = new Map(snapshots.map((s) => [s.month, s]));

    const results: MonthlyReportRow[] = [];

    for (const mk of monthKeys) {
      const snapshot = snapshotMap.get(mk);
      const [payoutData] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${payouts.amount}), 0)`,
        })
        .from(payouts)
        .where(and(eq(payouts.hostelId, hostelId), eq(payouts.month, mk)));

      if (snapshot) {
        results.push({
          month: mk,
          monthLabel: formatMonthKey(mk),
          grossRevenue: parseFloat(snapshot.grossRevenue),
          refunds: parseFloat(snapshot.refunds),
          netRevenue: parseFloat(snapshot.netRevenue),
          totalExpenses: parseFloat(snapshot.totalExpenses),
          netProfit: parseFloat(snapshot.netProfit),
          investorPayouts: parseFloat(payoutData?.total || '0'),
        });
      } else {
        // Calculate on-the-fly
        const [revenueData] = await db
          .select({
            gross: sql<string>`COALESCE(SUM(CASE WHEN ${revenueEntries.status} = 'verified' THEN ${revenueEntries.amount} ELSE 0 END), 0)`,
            refunds: sql<string>`COALESCE(SUM(CASE WHEN ${revenueEntries.status} IN ('refunded', 'reversed') THEN ${revenueEntries.amount} ELSE 0 END), 0)`,
          })
          .from(revenueEntries)
          .where(
            and(
              eq(revenueEntries.hostelId, hostelId),
              eq(revenueEntries.month, mk)
            )
          );

        const [expenseData] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${expenseEntries.amount}), 0)`,
          })
          .from(expenseEntries)
          .where(
            and(
              eq(expenseEntries.hostelId, hostelId),
              eq(expenseEntries.month, mk),
              eq(expenseEntries.approvalStatus, 'approved')
            )
          );

        const grossRevenue = parseFloat(revenueData?.gross || '0');
        const refunds = parseFloat(revenueData?.refunds || '0');
        const netRevenue = grossRevenue - refunds;
        const totalExpenses = parseFloat(expenseData?.total || '0');
        results.push({
          month: mk,
          monthLabel: formatMonthKey(mk),
          grossRevenue,
          refunds,
          netRevenue,
          totalExpenses,
          netProfit: netRevenue - totalExpenses,
          investorPayouts: parseFloat(payoutData?.total || '0'),
        });
      }
    }

    return NextResponse.json({ monthlyReport: results });
  } catch (error) {
    return handleAuthError(error);
  }
}
