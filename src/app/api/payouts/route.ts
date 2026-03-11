import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payouts, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { formatMonthKey } from '@/lib/utils';
import {
  calculateMonthlyProfit,
  saveMonthlySnapshot,
  createPayoutRecords,
} from '@/lib/profit-engine';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const monthParam = request.nextUrl.searchParams.get('month');
    const investorUserId = request.nextUrl.searchParams.get('investorUserId');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId);

    const conditions = [eq(payouts.hostelId, hostelId)];
    if (monthParam) {
      conditions.push(eq(payouts.month, parseInt(monthParam, 10)));
    }
    if (investorUserId) {
      conditions.push(eq(payouts.investorUserId, investorUserId));
    }

    const payoutList = await db
      .select({
        id: payouts.id,
        hostelId: payouts.hostelId,
        investorUserId: payouts.investorUserId,
        investorName: users.name,
        investorEmail: users.email,
        agreementId: payouts.agreementId,
        month: payouts.month,
        amount: payouts.amount,
        status: payouts.status,
        paidAt: payouts.paidAt,
        reference: payouts.reference,
        notes: payouts.notes,
        createdAt: payouts.createdAt,
      })
      .from(payouts)
      .innerJoin(users, eq(payouts.investorUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(payouts.month));

    const formatted = payoutList.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
      monthLabel: formatMonthKey(p.month),
    }));

    return NextResponse.json({ payouts: formatted });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostelId, month } = body;

    if (!hostelId || !month) {
      return NextResponse.json(
        { error: 'Missing required fields: hostelId, month' },
        { status: 400 }
      );
    }

    const ctx = await requireHostelAccess(hostelId, ['admin']);

    const calculation = await calculateMonthlyProfit(hostelId, month);
    await saveMonthlySnapshot(calculation);
    await createPayoutRecords(calculation);

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'generate_payouts',
      entityType: 'payout',
      details: {
        month,
        netProfit: calculation.netProfit,
        distributionCount: calculation.investorDistributions.length,
        totalDistributed: calculation.investorDistributions.reduce(
          (sum, d) => sum + d.calculatedAmount,
          0
        ),
      },
    });

    return NextResponse.json(
      {
        calculation: {
          month: calculation.month,
          grossRevenue: calculation.grossRevenue,
          refunds: calculation.refunds,
          netRevenue: calculation.netRevenue,
          totalExpenses: calculation.totalExpenses,
          netProfit: calculation.netProfit,
          distributions: calculation.investorDistributions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
