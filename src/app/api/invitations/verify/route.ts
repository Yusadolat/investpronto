import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, hostels, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const results = await db
      .select({
        email: invitations.email,
        hostelName: hostels.name,
        role: invitations.role,
        invitedByName: users.name,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
      })
      .from(invitations)
      .innerJoin(hostels, eq(invitations.hostelId, hostels.id))
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .where(
        and(
          eq(invitations.token, token),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    const { email, hostelName, role, invitedByName } = results[0];
    return NextResponse.json({ email, hostelName, role, invitedByName });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
