import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenseEntries } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { getMonthKey } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const monthParam = request.nextUrl.searchParams.get('month');
    const category = request.nextUrl.searchParams.get('category');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId);

    const conditions = [eq(expenseEntries.hostelId, hostelId)];
    if (monthParam) {
      conditions.push(eq(expenseEntries.month, parseInt(monthParam, 10)));
    }
    if (category) {
      conditions.push(eq(expenseEntries.category, category as ExpenseCategory));
    }

    const entries = await db
      .select()
      .from(expenseEntries)
      .where(and(...conditions))
      .orderBy(desc(expenseEntries.expenseDate));

    return NextResponse.json({ expenses: entries });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostelId, amount, category, description, expenseDate, receiptUrl, spenderName } = body;

    if (!hostelId || amount == null || !category || !description || !expenseDate) {
      return NextResponse.json(
        { error: 'Missing required fields: hostelId, amount, category, description, expenseDate' },
        { status: 400 }
      );
    }

    const ctx = await requireHostelAccess(hostelId, ['admin', 'operator']);

    const month = getMonthKey(new Date(expenseDate));

    const [entry] = await db
      .insert(expenseEntries)
      .values({
        hostelId,
        amount: amount.toString(),
        category,
        description,
        expenseDate,
        month,
        receiptUrl: receiptUrl || null,
        spenderName: spenderName || null,
        createdBy: ctx.userId,
        approvalStatus: 'pending',
      })
      .returning();

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'create',
      entityType: 'expense_entry',
      entityId: entry.id,
      details: { amount, category, description, expenseDate, month, spenderName },
    });

    return NextResponse.json({ expense: entry }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
