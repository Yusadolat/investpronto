import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  hostels,
  memberships,
  investmentAgreements,
  revenueEntries,
  expenseEntries,
  setupCostItems,
  capitalContributions,
  users,
} from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { getMonthKey } from '@/lib/utils';
import { buildTransparencySummary } from '@/lib/transparency';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;

    if (!UUID_REGEX.test(hostelId)) {
      return NextResponse.json({ error: 'Invalid hostel ID' }, { status: 400 });
    }

    await requireHostelAccess(hostelId);

    const [hostel] = await db
      .select()
      .from(hostels)
      .where(eq(hostels.id, hostelId))
      .limit(1);

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const currentMonth = getMonthKey();

    // Current month revenue
    const [revenueData] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${revenueEntries.amount}), 0)`,
      })
      .from(revenueEntries)
      .where(
        and(
          eq(revenueEntries.hostelId, hostelId),
          eq(revenueEntries.month, currentMonth),
          eq(revenueEntries.status, 'verified')
        )
      );

    // Current month expenses
    const [expenseData] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${expenseEntries.amount}), 0)`,
      })
      .from(expenseEntries)
      .where(
        and(
          eq(expenseEntries.hostelId, hostelId),
          eq(expenseEntries.month, currentMonth),
          eq(expenseEntries.approvalStatus, 'approved')
        )
      );

    // Investor count
    const [investorCountData] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${memberships.userId})`,
      })
      .from(memberships)
      .where(
        and(
          eq(memberships.hostelId, hostelId),
          eq(memberships.role, 'investor')
        )
      );

    // Investor details
    const investors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        amountInvested: investmentAgreements.amountInvested,
        percentageShare: investmentAgreements.percentageShare,
        agreementType: investmentAgreements.agreementType,
      })
      .from(investmentAgreements)
      .innerJoin(users, eq(investmentAgreements.investorUserId, users.id))
      .where(
        and(
          eq(investmentAgreements.hostelId, hostelId),
          eq(investmentAgreements.status, 'active')
        )
      );

    // Recent expenses
    const recentExpenses = await db
      .select({
        id: expenseEntries.id,
        amount: expenseEntries.amount,
        category: expenseEntries.category,
        description: expenseEntries.description,
        date: expenseEntries.expenseDate,
        status: expenseEntries.approvalStatus,
      })
      .from(expenseEntries)
      .where(eq(expenseEntries.hostelId, hostelId))
      .orderBy(desc(expenseEntries.createdAt))
      .limit(10);

    const currentMonthRevenue = parseFloat(revenueData?.total || '0');
    const currentMonthExpenses = parseFloat(expenseData?.total || '0');

    const rawSetupItems = await db
      .select({
        id: setupCostItems.id,
        title: setupCostItems.title,
        description: setupCostItems.description,
        category: setupCostItems.category,
        amount: setupCostItems.amount,
        costType: setupCostItems.costType,
        incurredAt: setupCostItems.incurredAt,
        vendor: setupCostItems.vendor,
        receiptUrl: setupCostItems.receiptUrl,
        createdAt: setupCostItems.createdAt,
      })
      .from(setupCostItems)
      .where(eq(setupCostItems.hostelId, hostelId))
      .orderBy(desc(setupCostItems.incurredAt), desc(setupCostItems.createdAt));

    const rawCapitalContributions = await db
      .select({
        id: capitalContributions.id,
        contributorName: capitalContributions.contributorName,
        contributorType: capitalContributions.contributorType,
        amount: capitalContributions.amount,
        contributionDate: capitalContributions.contributionDate,
        linkedInvestorUserId: capitalContributions.linkedInvestorUserId,
        notes: capitalContributions.notes,
        createdAt: capitalContributions.createdAt,
      })
      .from(capitalContributions)
      .where(eq(capitalContributions.hostelId, hostelId))
      .orderBy(desc(capitalContributions.contributionDate), desc(capitalContributions.createdAt));

    const normalizedSetupItems = rawSetupItems.map((item) => ({
      ...item,
      description: item.description || '',
      amount: parseFloat(item.amount || '0'),
      vendor: item.vendor || null,
      receiptUrl: item.receiptUrl || null,
    }));

    const normalizedCapitalContributions = rawCapitalContributions.map((item) => ({
      ...item,
      amount: parseFloat(item.amount || '0'),
      linkedInvestorUserId: item.linkedInvestorUserId || null,
      notes: item.notes || null,
    }));

    const transparency = buildTransparencySummary(
      {
        totalSetupCost: parseFloat(hostel.totalSetupCost || '0'),
      },
      normalizedSetupItems.map((item) => ({
        id: item.id,
        amount: item.amount,
        costType: item.costType,
        category: item.category,
      })),
      normalizedCapitalContributions.map((item) => ({
        id: item.id,
        contributorName: item.contributorName,
        contributorType: item.contributorType,
        amount: item.amount,
      }))
    );

    const normalizedInvestors = investors.map((investor) => {
      const amountInvested = parseFloat(investor.amountInvested || '0');
      const percentageShare = parseFloat(investor.percentageShare || '0');

      return {
        ...investor,
        amountInvested,
        percentageShare,
        capitalPercentage:
          parseFloat(hostel.totalSetupCost || '0') > 0
            ? Math.round((amountInvested / parseFloat(hostel.totalSetupCost || '0')) * 10000) /
              100
            : 0,
        profitSharePercentage: percentageShare,
      };
    });

    return NextResponse.json({
      hostel,
      dashboard: {
        currentMonthRevenue,
        currentMonthExpenses,
        currentMonthProfit: currentMonthRevenue - currentMonthExpenses,
        investorCount: investorCountData?.count || 0,
        investors: normalizedInvestors,
        recentExpenses,
      },
      transparency: {
        summary: transparency,
        setupItems: normalizedSetupItems,
        capitalContributions: normalizedCapitalContributions,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;

    if (!UUID_REGEX.test(hostelId)) {
      return NextResponse.json({ error: 'Invalid hostel ID' }, { status: 400 });
    }

    const ctx = await requireHostelAccess(hostelId, ['admin']);
    const body = await request.json();

    const allowedFields: Record<string, unknown> = {};
    if (body.name !== undefined) allowedFields.name = body.name;
    if (body.address !== undefined) allowedFields.address = body.address;
    if (body.status !== undefined) allowedFields.status = body.status;
    if (body.totalSetupCost !== undefined)
      allowedFields.totalSetupCost = body.totalSetupCost.toString();
    if (body.founderContribution !== undefined)
      allowedFields.founderContribution = body.founderContribution.toString();

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    allowedFields.updatedAt = new Date();

    const [updated] = await db
      .update(hostels)
      .set(allowedFields)
      .where(eq(hostels.id, hostelId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'update',
      entityType: 'hostel',
      entityId: hostelId,
      details: allowedFields,
    });

    return NextResponse.json({ hostel: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
