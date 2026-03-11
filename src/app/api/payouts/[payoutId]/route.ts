import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { payoutId } = await params;

    // Fetch the payout to get hostelId
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId))
      .limit(1);

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    const ctx = await requireHostelAccess(payout.hostelId, ['admin']);

    if (payout.status === 'paid') {
      return NextResponse.json(
        { error: 'Payout has already been marked as paid' },
        { status: 400 }
      );
    }

    if (payout.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot mark a cancelled payout as paid' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const [updated] = await db
      .update(payouts)
      .set({
        status: 'paid',
        paidAt: new Date(),
        reference: body.reference || null,
        notes: body.notes || payout.notes,
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId))
      .returning();

    await logAudit({
      userId: ctx.userId,
      hostelId: payout.hostelId,
      action: 'mark_payout_paid',
      entityType: 'payout',
      entityId: payoutId,
      details: {
        investorUserId: payout.investorUserId,
        amount: payout.amount,
        month: payout.month,
        reference: body.reference,
      },
    });

    return NextResponse.json({ payout: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
