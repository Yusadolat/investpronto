import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, memberships, invitations, hostels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { generateInviteToken } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { founderInvitationEmail } from '@/lib/email-templates';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, hostelId, role } = body;

    if (!email || !hostelId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, hostelId, role' },
        { status: 400 }
      );
    }

    if (!['admin', 'operator'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin or operator' },
        { status: 400 }
      );
    }

    const ctx = await requireHostelAccess(hostelId, ['admin']);

    // Find or create user
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let targetUserId: string;

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto
        .createHash('sha256')
        .update(tempPassword)
        .digest('hex');

      const userRole = role === 'admin' ? 'admin' as const : 'operator' as const;

      const [newUser] = await db
        .insert(users)
        .values({
          name: email.split('@')[0],
          email,
          role: userRole,
          passwordHash,
        })
        .returning();

      targetUserId = newUser.id;
    }

    // Create membership (skip if already exists)
    const existingMembership = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, targetUserId),
          eq(memberships.hostelId, hostelId)
        )
      )
      .limit(1);

    if (existingMembership.length === 0) {
      await db.insert(memberships).values({
        userId: targetUserId,
        hostelId,
        role,
      });
    }

    // Create invitation record
    const token = generateInviteToken();
    await db.insert(invitations).values({
      email,
      hostelId,
      role,
      invitedBy: ctx.userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'invite_member',
      entityType: 'member',
      entityId: targetUserId,
      details: { email, role },
    });

    // Fetch hostel and inviter details for the email
    const [hostel] = await db
      .select({ name: hostels.name })
      .from(hostels)
      .where(eq(hostels.id, hostelId))
      .limit(1);

    const [inviter] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    const emailData = founderInvitationEmail({
      hostelName: hostel?.name || 'a property',
      inviterName: inviter?.name || 'The admin',
      token,
      role: role as 'admin' | 'operator',
    });

    await sendEmail({
      to: { address: email },
      subject: emailData.subject,
      htmlBody: emailData.htmlBody,
      textBody: emailData.textBody,
    });

    return NextResponse.json(
      { member: { userId: targetUserId, token } },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
