import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hostels, recurringCosts, investmentAgreements } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId);

    const hostel = await db
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

    if (hostel.length === 0) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const costs = await db
      .select()
      .from(recurringCosts)
      .where(eq(recurringCosts.hostelId, hostelId))
      .orderBy(recurringCosts.createdAt);

    const agreements = await db
      .select({
        id: investmentAgreements.id,
        investorUserId: investmentAgreements.investorUserId,
        percentageShare: investmentAgreements.percentageShare,
        agreementType: investmentAgreements.agreementType,
        status: investmentAgreements.status,
      })
      .from(investmentAgreements)
      .where(
        and(
          eq(investmentAgreements.hostelId, hostelId),
          eq(investmentAgreements.status, 'active')
        )
      );

    const config = hostel[0];
    const totalInvestorShareAllocated = agreements.reduce(
      (sum, a) => sum + parseFloat(a.percentageShare || '0'),
      0
    );

    return NextResponse.json({
      config: {
        companySharePercent: parseFloat(config.companySharePercent || '0'),
        ownerSharePercent: parseFloat(config.ownerSharePercent || '0'),
        investorPoolPercent: parseFloat(config.investorPoolPercent || '100'),
        reserveFundPercent: parseFloat(config.reserveFundPercent || '0'),
        minimumPayoutAmount: parseFloat(config.minimumPayoutAmount || '0'),
      },
      recurringCosts: costs.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        monthlyAmount: parseFloat(c.monthlyAmount),
        frequency: c.frequency,
        isActive: c.isActive,
      })),
      totalMonthlyRecurringCosts: costs
        .filter((c) => c.isActive)
        .reduce((sum, c) => sum + parseFloat(c.monthlyAmount), 0),
      investorAgreements: {
        count: agreements.length,
        totalShareAllocated: Math.round(totalInvestorShareAllocated * 100) / 100,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId, ['admin']);

    const body = await req.json();
    const {
      companySharePercent,
      ownerSharePercent,
      investorPoolPercent,
      reserveFundPercent,
      minimumPayoutAmount,
    } = body;

    const total = (companySharePercent || 0) + (ownerSharePercent || 0) + (investorPoolPercent || 0);
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Company, Owner, and Investor shares must total 100%' },
        { status: 400 }
      );
    }

    if (reserveFundPercent < 0 || reserveFundPercent > 50) {
      return NextResponse.json(
        { error: 'Reserve fund must be between 0% and 50%' },
        { status: 400 }
      );
    }

    await db
      .update(hostels)
      .set({
        companySharePercent: String(companySharePercent),
        ownerSharePercent: String(ownerSharePercent),
        investorPoolPercent: String(investorPoolPercent),
        reserveFundPercent: String(reserveFundPercent ?? 0),
        minimumPayoutAmount: String(minimumPayoutAmount ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(hostels.id, hostelId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
