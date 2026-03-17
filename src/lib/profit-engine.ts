import { db } from '@/db';
import { revenueEntries, expenseEntries, monthlyFinancialSnapshots, investmentAgreements, payouts, hostels, recurringCosts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getMonthKey } from './utils';

export interface ProfitCalculation {
  hostelId: string;
  month: number;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  totalExpenses: number;
  totalRecurringCosts: number;
  operatingProfit: number;
  reserveFundAmount: number;
  distributableProfit: number;
  companyShare: number;
  ownerShare: number;
  investorPoolTotal: number;
  netProfit: number;
  investorDistributions: Array<{
    investorUserId: string;
    agreementId: string;
    agreementType: string;
    percentageShare: number;
    calculatedAmount: number;
  }>;
}

export async function calculateMonthlyProfit(
  hostelId: string,
  month?: number
): Promise<ProfitCalculation> {
  const targetMonth = month || getMonthKey();

  // Fetch hostel profit sharing config
  const hostelData = await db
    .select({
      companySharePercent: hostels.companySharePercent,
      ownerSharePercent: hostels.ownerSharePercent,
      investorPoolPercent: hostels.investorPoolPercent,
      reserveFundPercent: hostels.reserveFundPercent,
      minimumPayoutAmount: hostels.minimumPayoutAmount,
    })
    .from(hostels)
    .where(eq(hostels.id, hostelId))
    .limit(1);

  const config = hostelData[0];
  const companySharePct = parseFloat(config?.companySharePercent || '0');
  const ownerSharePct = parseFloat(config?.ownerSharePercent || '0');
  const investorPoolPct = parseFloat(config?.investorPoolPercent || '100');
  const reserveFundPct = parseFloat(config?.reserveFundPercent || '0');
  const minimumPayout = parseFloat(config?.minimumPayoutAmount || '0');

  // Calculate gross revenue (verified entries only)
  const revenueResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(CASE WHEN ${revenueEntries.status} = 'verified' THEN ${revenueEntries.amount} ELSE 0 END), 0)`,
      refunds: sql<string>`COALESCE(SUM(CASE WHEN ${revenueEntries.status} IN ('refunded', 'reversed') THEN ${revenueEntries.amount} ELSE 0 END), 0)`,
    })
    .from(revenueEntries)
    .where(
      and(
        eq(revenueEntries.hostelId, hostelId),
        eq(revenueEntries.month, targetMonth)
      )
    );

  const grossRevenue = parseFloat(revenueResult[0]?.total || '0');
  const refunds = parseFloat(revenueResult[0]?.refunds || '0');
  const netRevenue = grossRevenue - refunds;

  // Calculate total approved expenses
  const expenseResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenseEntries.amount}), 0)`,
    })
    .from(expenseEntries)
    .where(
      and(
        eq(expenseEntries.hostelId, hostelId),
        eq(expenseEntries.month, targetMonth),
        eq(expenseEntries.approvalStatus, 'approved')
      )
    );

  const totalExpenses = parseFloat(expenseResult[0]?.total || '0');

  // Calculate active recurring costs
  const activeCosts = await db
    .select({
      total: sql<string>`COALESCE(SUM(${recurringCosts.monthlyAmount}), 0)`,
    })
    .from(recurringCosts)
    .where(
      and(
        eq(recurringCosts.hostelId, hostelId),
        eq(recurringCosts.isActive, true)
      )
    );

  const totalRecurringCosts = parseFloat(activeCosts[0]?.total || '0');

  // Waterfall calculation
  const operatingProfit = netRevenue - totalExpenses - totalRecurringCosts;
  const reserveFundAmount = Math.max(0, operatingProfit * (reserveFundPct / 100));
  const distributableProfit = Math.max(0, operatingProfit - reserveFundAmount);

  const companyShare = round2(distributableProfit * (companySharePct / 100));
  const ownerShare = round2(distributableProfit * (ownerSharePct / 100));
  const investorPoolTotal = round2(distributableProfit * (investorPoolPct / 100));

  // Legacy netProfit for snapshot compatibility
  const netProfit = netRevenue - totalExpenses;

  // Get active agreements for this hostel
  const agreements = await db
    .select()
    .from(investmentAgreements)
    .where(
      and(
        eq(investmentAgreements.hostelId, hostelId),
        eq(investmentAgreements.status, 'active')
      )
    );

  // Distribute investor pool among investors by their individual percentageShare
  const investorDistributions = agreements.map((agreement) => {
    const percentage = parseFloat(agreement.percentageShare || '0');
    let calculatedAmount = 0;

    switch (agreement.agreementType) {
      case 'profit_share':
      case 'equity':
      case 'custom':
        calculatedAmount = investorPoolTotal * (percentage / 100);
        break;
      case 'revenue_share':
        calculatedAmount = netRevenue * (percentage / 100);
        break;
    }

    calculatedAmount = round2(Math.max(0, calculatedAmount));

    // Apply minimum payout threshold
    if (calculatedAmount > 0 && calculatedAmount < minimumPayout) {
      calculatedAmount = 0;
    }

    return {
      investorUserId: agreement.investorUserId,
      agreementId: agreement.id,
      agreementType: agreement.agreementType,
      percentageShare: percentage,
      calculatedAmount,
    };
  });

  return {
    hostelId,
    month: targetMonth,
    grossRevenue,
    refunds,
    netRevenue,
    totalExpenses,
    totalRecurringCosts,
    operatingProfit,
    reserveFundAmount,
    distributableProfit,
    companyShare,
    ownerShare,
    investorPoolTotal,
    netProfit,
    investorDistributions,
  };
}

export async function saveMonthlySnapshot(calc: ProfitCalculation): Promise<void> {
  await db
    .insert(monthlyFinancialSnapshots)
    .values({
      hostelId: calc.hostelId,
      month: calc.month,
      grossRevenue: calc.grossRevenue.toString(),
      refunds: calc.refunds.toString(),
      netRevenue: calc.netRevenue.toString(),
      totalExpenses: calc.totalExpenses.toString(),
      netProfit: calc.netProfit.toString(),
      calculatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [monthlyFinancialSnapshots.hostelId, monthlyFinancialSnapshots.month],
      set: {
        grossRevenue: calc.grossRevenue.toString(),
        refunds: calc.refunds.toString(),
        netRevenue: calc.netRevenue.toString(),
        totalExpenses: calc.totalExpenses.toString(),
        netProfit: calc.netProfit.toString(),
        calculatedAt: new Date(),
      },
    });
}

export async function createPayoutRecords(calc: ProfitCalculation): Promise<void> {
  for (const dist of calc.investorDistributions) {
    if (dist.calculatedAmount <= 0) continue;

    // Check if payout already exists for this month
    const existing = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.hostelId, calc.hostelId),
          eq(payouts.investorUserId, dist.investorUserId),
          eq(payouts.month, calc.month)
        )
      );

    if (existing.length === 0) {
      await db.insert(payouts).values({
        hostelId: calc.hostelId,
        investorUserId: dist.investorUserId,
        agreementId: dist.agreementId,
        month: calc.month,
        amount: dist.calculatedAmount.toString(),
        status: 'pending',
      });
    } else {
      // Update existing payout amount if not yet paid
      const payout = existing[0];
      if (payout.status === 'pending') {
        await db
          .update(payouts)
          .set({ amount: dist.calculatedAmount.toString(), updatedAt: new Date() })
          .where(eq(payouts.id, payout.id));
      }
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
