import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, users, hostels } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId, ['admin']);

    const results = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        token: invitations.token,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        createdAt: invitations.createdAt,
        inviterName: users.name,
        hostelName: hostels.name,
      })
      .from(invitations)
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .innerJoin(hostels, eq(invitations.hostelId, hostels.id))
      .where(eq(invitations.hostelId, hostelId))
      .orderBy(desc(invitations.createdAt));

    return NextResponse.json({ invitations: results });
  } catch (error) {
    return handleAuthError(error);
  }
}
