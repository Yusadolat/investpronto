import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { capitalContributions } from '@/db/schema';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId);

    const contributions = await db
      .select()
      .from(capitalContributions)
      .where(eq(capitalContributions.hostelId, hostelId));

    return NextResponse.json({ capitalContributions: contributions });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    const ctx = await requireHostelAccess(hostelId, ['admin']);
    const body = await request.json();

    const {
      contributorName,
      contributorType,
      amount,
      contributionDate,
      linkedInvestorUserId,
      notes,
    } = body;

    if (!contributorName || !contributorType || amount == null || !contributionDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: contributorName, contributorType, amount, contributionDate',
        },
        { status: 400 }
      );
    }

    const [contribution] = await db
      .insert(capitalContributions)
      .values({
        hostelId,
        contributorName,
        contributorType,
        amount: amount.toString(),
        contributionDate,
        linkedInvestorUserId: linkedInvestorUserId || null,
        notes: notes || null,
        createdBy: ctx.userId,
      })
      .returning();

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'create_capital_contribution',
      entityType: 'capital_contribution',
      entityId: contribution.id,
      details: { contributorName, contributorType, amount, contributionDate },
    });

    return NextResponse.json({ capitalContribution: contribution }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
