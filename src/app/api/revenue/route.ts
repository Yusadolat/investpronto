import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { revenueEntries } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { getMonthKey } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const monthParam = request.nextUrl.searchParams.get('month');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId);

    const conditions = [eq(revenueEntries.hostelId, hostelId)];
    if (monthParam) {
      conditions.push(eq(revenueEntries.month, parseInt(monthParam, 10)));
    }

    const entries = await db
      .select()
      .from(revenueEntries)
      .where(and(...conditions))
      .orderBy(desc(revenueEntries.transactionDate));

    return NextResponse.json({ revenueEntries: entries });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostelId, amount, source, description, transactionDate, status } = body;

    if (!hostelId || amount == null || !source || !transactionDate) {
      return NextResponse.json(
        { error: 'Missing required fields: hostelId, amount, source, transactionDate' },
        { status: 400 }
      );
    }

    const ctx = await requireHostelAccess(hostelId, ['admin', 'operator']);

    const month = getMonthKey(new Date(transactionDate));

    const [entry] = await db
      .insert(revenueEntries)
      .values({
        hostelId,
        amount: amount.toString(),
        source,
        description: description || null,
        transactionDate,
        month,
        status: status || 'verified',
        createdBy: ctx.userId,
      })
      .returning();

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'create',
      entityType: 'revenue_entry',
      entityId: entry.id,
      details: { amount, source, transactionDate, month },
    });

    return NextResponse.json({ revenueEntry: entry }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
