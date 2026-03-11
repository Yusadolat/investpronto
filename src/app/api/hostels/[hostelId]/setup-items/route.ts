import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { setupCostItems } from '@/db/schema';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId);

    const items = await db
      .select()
      .from(setupCostItems)
      .where(eq(setupCostItems.hostelId, hostelId));

    return NextResponse.json({ setupItems: items });
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

    const { title, description, category, amount, costType, incurredAt, vendor, receiptUrl } =
      body;

    if (!title || !category || amount == null || !costType || !incurredAt) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: title, category, amount, costType, incurredAt',
        },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(setupCostItems)
      .values({
        hostelId,
        title,
        description: description || null,
        category,
        amount: amount.toString(),
        costType,
        incurredAt,
        vendor: vendor || null,
        receiptUrl: receiptUrl || null,
        createdBy: ctx.userId,
      })
      .returning();

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'create_setup_cost_item',
      entityType: 'setup_cost_item',
      entityId: item.id,
      details: { title, category, amount, costType, incurredAt },
    });

    return NextResponse.json({ setupItem: item }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
