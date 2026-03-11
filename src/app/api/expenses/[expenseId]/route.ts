import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenseEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

async function updateExpense(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const body = await request.json();

    // Fetch the expense to get hostelId
    const [expense] = await db
      .select()
      .from(expenseEntries)
      .where(eq(expenseEntries.id, expenseId))
      .limit(1);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const ctx = await requireHostelAccess(expense.hostelId, ['admin']);

    const updateData: Record<string, unknown> = {};

    if (body.amount !== undefined) updateData.amount = body.amount.toString();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;

    // Handle approval status changes (admin only)
    if (body.approvalStatus !== undefined) {
      updateData.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === 'approved' || body.approvalStatus === 'rejected') {
        updateData.approvedBy = ctx.userId;
      }

      await logAudit({
        userId: ctx.userId,
        hostelId: expense.hostelId,
        action: `expense_${body.approvalStatus}`,
        entityType: 'expense_entry',
        entityId: expenseId,
        details: {
          previousStatus: expense.approvalStatus,
          newStatus: body.approvalStatus,
          amount: expense.amount,
        },
      });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(expenseEntries)
      .set(updateData)
      .where(eq(expenseEntries.id, expenseId))
      .returning();

    return NextResponse.json({ expense: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ expenseId: string }> }
) {
  return updateExpense(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ expenseId: string }> }
) {
  return updateExpense(request, context);
}
