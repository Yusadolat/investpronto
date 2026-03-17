import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hostels, investmentAgreements, setupCostItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    const ctx = await requireHostelAccess(hostelId, ['admin']);

    const body = await req.json();
    const { additionalAmount, description, category, recalculateShares } = body;

    if (!additionalAmount || additionalAmount <= 0) {
      return NextResponse.json(
        { error: 'Additional amount must be positive' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'A description is required for the capital adjustment' },
        { status: 400 }
      );
    }

    // Get current hostel data
    const [hostel] = await db
      .select()
      .from(hostels)
      .where(eq(hostels.id, hostelId))
      .limit(1);

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const oldTotal = parseFloat(hostel.totalSetupCost || '0');
    const newTotal = oldTotal + additionalAmount;

    // Create setup cost item for audit trail
    await db.insert(setupCostItems).values({
      hostelId,
      title: description,
      description: `Capital adjustment: +${additionalAmount}`,
      category: category || 'other',
      amount: String(additionalAmount),
      costType: 'one_time',
      incurredAt: new Date().toISOString().split('T')[0],
      createdBy: ctx.userId,
    });

    // Update total setup cost
    await db
      .update(hostels)
      .set({
        totalSetupCost: String(newTotal),
        updatedAt: new Date(),
      })
      .where(eq(hostels.id, hostelId));

    // Recalculate investor shares if requested
    const updatedAgreements: Array<{
      investorUserId: string;
      oldShare: number;
      newShare: number;
      amountInvested: number;
    }> = [];

    if (recalculateShares) {
      const agreements = await db
        .select()
        .from(investmentAgreements)
        .where(
          and(
            eq(investmentAgreements.hostelId, hostelId),
            eq(investmentAgreements.status, 'active')
          )
        );

      for (const agreement of agreements) {
        const amountInvested = parseFloat(agreement.amountInvested || '0');
        const oldShare = parseFloat(agreement.percentageShare || '0');
        const newShare = newTotal > 0
          ? Math.round((amountInvested / newTotal) * 10000) / 100
          : 0;

        await db
          .update(investmentAgreements)
          .set({
            percentageShare: String(newShare),
            updatedAt: new Date(),
          })
          .where(eq(investmentAgreements.id, agreement.id));

        updatedAgreements.push({
          investorUserId: agreement.investorUserId,
          oldShare,
          newShare,
          amountInvested,
        });
      }
    }

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'adjust_capital',
      entityType: 'hostel',
      entityId: hostelId,
      details: {
        oldTotal,
        additionalAmount,
        newTotal,
        description,
        recalculateShares,
        updatedAgreements,
      },
    });

    return NextResponse.json({
      success: true,
      oldTotal,
      newTotal,
      additionalAmount,
      updatedAgreements,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// Preview endpoint — shows what would change without committing
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId);

    const body = await req.json();
    const { additionalAmount } = body;

    if (!additionalAmount || additionalAmount <= 0) {
      return NextResponse.json(
        { error: 'Additional amount must be positive' },
        { status: 400 }
      );
    }

    const [hostel] = await db
      .select()
      .from(hostels)
      .where(eq(hostels.id, hostelId))
      .limit(1);

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
    }

    const oldTotal = parseFloat(hostel.totalSetupCost || '0');
    const newTotal = oldTotal + additionalAmount;

    const agreements = await db
      .select({
        id: investmentAgreements.id,
        investorUserId: investmentAgreements.investorUserId,
        amountInvested: investmentAgreements.amountInvested,
        percentageShare: investmentAgreements.percentageShare,
      })
      .from(investmentAgreements)
      .where(
        and(
          eq(investmentAgreements.hostelId, hostelId),
          eq(investmentAgreements.status, 'active')
        )
      );

    const preview = agreements.map((a) => {
      const amountInvested = parseFloat(a.amountInvested || '0');
      const currentShare = parseFloat(a.percentageShare || '0');
      const newShare = newTotal > 0
        ? Math.round((amountInvested / newTotal) * 10000) / 100
        : 0;

      return {
        investorUserId: a.investorUserId,
        amountInvested,
        currentShare,
        newShare,
        change: Math.round((newShare - currentShare) * 100) / 100,
      };
    });

    return NextResponse.json({
      oldTotal,
      newTotal,
      additionalAmount,
      preview,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
