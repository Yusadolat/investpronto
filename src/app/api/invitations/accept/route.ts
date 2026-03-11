import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { isNull } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find valid invitation
    const results = await db
      .select()
      .from(invitations)
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

    const invitation = results[0];

    // Update the user account with name and password
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    const passwordHash = hashPassword(password);

    await db
      .update(users)
      .set({
        name,
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUsers[0].id));

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
