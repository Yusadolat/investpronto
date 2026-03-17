import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recurringCosts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    const ctx = await requireHostelAccess(hostelId, ['admin']);

    const body = await req.json();
    const { name, description, monthlyAmount, frequency } = body;

    if (!name || !monthlyAmount || monthlyAmount <= 0) {
      return NextResponse.json(
        { error: 'Name and a positive monthly amount are required' },
        { status: 400 }
      );
    }

    const [cost] = await db
      .insert(recurringCosts)
      .values({
        hostelId,
        name,
        description: description || null,
        monthlyAmount: String(monthlyAmount),
        frequency: frequency || 'monthly',
        createdBy: ctx.userId,
      })
      .returning();

    return NextResponse.json(cost, { status: 201 });
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
    const { id, name, description, monthlyAmount, frequency, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Cost ID is required' }, { status: 400 });
    }

    await db
      .update(recurringCosts)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(monthlyAmount !== undefined && { monthlyAmount: String(monthlyAmount) }),
        ...(frequency !== undefined && { frequency }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(and(eq(recurringCosts.id, id), eq(recurringCosts.hostelId, hostelId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ hostelId: string }> }
) {
  try {
    const { hostelId } = await params;
    await requireHostelAccess(hostelId, ['admin']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Cost ID is required' }, { status: 400 });
    }

    await db
      .delete(recurringCosts)
      .where(and(eq(recurringCosts.id, id), eq(recurringCosts.hostelId, hostelId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
