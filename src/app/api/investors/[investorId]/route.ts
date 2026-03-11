import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  investmentAgreements,
  payouts,
  monthlyFinancialSnapshots,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { formatMonthKey, getLastNMonthKeys } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const { investorId } = await params;
    const hostelId = request.nextUrl.searchParams.get('hostelId');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId);

    // Get investor user info
    const [investor] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, investorId))
      .limit(1);

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Get agreement details
    const agreements = await db
      .select()
      .from(investmentAgreements)
      .where(
        and(
          eq(investmentAgreements.hostelId, hostelId),
          eq(investmentAgreements.investorUserId, investorId)
        )
      );

    if (agreements.length === 0) {
      return NextResponse.json(
        { error: 'No investment agreement found for this investor in this hostel' },
        { status: 404 }
      );
    }

    // Get payout history
    const payoutHistory = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.hostelId, hostelId),
          eq(payouts.investorUserId, investorId)
        )
      )
      .orderBy(desc(payouts.month));

    const formattedPayouts = payoutHistory.map((p) => ({
      id: p.id,
      month: p.month,
      monthLabel: formatMonthKey(p.month),
      amount: parseFloat(p.amount),
      status: p.status,
      paidAt: p.paidAt?.toISOString() || null,
    }));

    // Get monthly trend (last 6 months)
    const monthKeys = getLastNMonthKeys(6);
    const snapshots = await db
      .select()
      .from(monthlyFinancialSnapshots)
      .where(eq(monthlyFinancialSnapshots.hostelId, hostelId))
      .orderBy(desc(monthlyFinancialSnapshots.month));

    const monthlyTrend = monthKeys.map((mk) => {
      const snapshot = snapshots.find((s) => s.month === mk);
      return {
        month: mk,
        monthLabel: formatMonthKey(mk),
        grossRevenue: snapshot ? parseFloat(snapshot.grossRevenue) : 0,
        refunds: snapshot ? parseFloat(snapshot.refunds) : 0,
        netRevenue: snapshot ? parseFloat(snapshot.netRevenue) : 0,
        totalExpenses: snapshot ? parseFloat(snapshot.totalExpenses) : 0,
        netProfit: snapshot ? parseFloat(snapshot.netProfit) : 0,
      };
    });

    return NextResponse.json({
      investor,
      agreements: agreements.map((a) => ({
        ...a,
        amountInvested: parseFloat(a.amountInvested),
        percentageShare: parseFloat(a.percentageShare),
      })),
      payoutHistory: formattedPayouts,
      monthlyTrend,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
