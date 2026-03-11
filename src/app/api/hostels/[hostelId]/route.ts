import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  hostels,
  memberships,
  investmentAgreements,
  revenueEntries,
  expenseEntries,
  users,
} from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { getMonthKey } from '@/lib/utils';

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

    const ctx = await requireHostelAccess(hostelId);

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

    return NextResponse.json({
      hostel,
      dashboard: {
        currentMonthRevenue,
        currentMonthExpenses,
        currentMonthProfit: currentMonthRevenue - currentMonthExpenses,
        investorCount: investorCountData?.count || 0,
        investors,
        recentExpenses,
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
