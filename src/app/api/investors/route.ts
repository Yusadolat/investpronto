import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  memberships,
  investmentAgreements,
  invitations,
  hostels,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { generateInviteToken, formatNaira } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { investorInvitationEmail } from '@/lib/email-templates';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    if (!hostelId) {
      return NextResponse.json({ error: 'hostelId query parameter is required' }, { status: 400 });
    }

    await requireHostelAccess(hostelId);

    const investors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        amountInvested: investmentAgreements.amountInvested,
        dateInvested: investmentAgreements.dateInvested,
        agreementType: investmentAgreements.agreementType,
        percentageShare: investmentAgreements.percentageShare,
        agreementStatus: investmentAgreements.status,
        agreementId: investmentAgreements.id,
        notes: investmentAgreements.notes,
        membershipRole: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .leftJoin(
        investmentAgreements,
        and(
          eq(investmentAgreements.hostelId, memberships.hostelId),
          eq(investmentAgreements.investorUserId, memberships.userId)
        )
      )
      .where(
        and(
          eq(memberships.hostelId, hostelId),
          eq(memberships.role, 'investor')
        )
      );

    return NextResponse.json({ investors });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      hostelId,
      amountInvested,
      dateInvested,
      agreementType,
      percentageShare,
      notes,
    } = body;

    if (!email || !hostelId || amountInvested == null || !dateInvested || !agreementType || percentageShare == null) {
      return NextResponse.json(
        { error: 'Missing required fields: email, hostelId, amountInvested, dateInvested, agreementType, percentageShare' },
        { status: 400 }
      );
    }

    const ctx = await requireHostelAccess(hostelId, ['admin']);

    // Find or create user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let investorUserId: string;

    if (existingUser) {
      investorUserId = existingUser.id;
    } else {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(tempPassword);

      const [newUser] = await db
        .insert(users)
        .values({
          name: email.split('@')[0],
          email,
          role: 'investor',
          passwordHash,
        })
        .returning();

      investorUserId = newUser.id;
    }

    // Create membership (skip if already exists)
    const existingMembership = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, investorUserId),
          eq(memberships.hostelId, hostelId)
        )
      )
      .limit(1);

    if (existingMembership.length === 0) {
      await db.insert(memberships).values({
        userId: investorUserId,
        hostelId,
        role: 'investor',
      });
    }

    // Create investment agreement
    const [agreement] = await db
      .insert(investmentAgreements)
      .values({
        hostelId,
        investorUserId,
        amountInvested: amountInvested.toString(),
        dateInvested,
        agreementType,
        percentageShare: percentageShare.toString(),
        notes: notes || null,
        status: 'active',
      })
      .returning();

    // Create invitation record
    const token = generateInviteToken();
    await db.insert(invitations).values({
      email,
      hostelId,
      role: 'investor',
      invitedBy: ctx.userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await logAudit({
      userId: ctx.userId,
      hostelId,
      action: 'invite_investor',
      entityType: 'investor',
      entityId: investorUserId,
      details: { email, amountInvested, agreementType, percentageShare },
    });

    // Fetch hostel name and inviter name for the email
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

    const emailData = investorInvitationEmail({
      hostelName: hostel?.name || 'a property',
      inviterName: inviter?.name || 'The admin',
      token,
      amountInvested: formatNaira(amountInvested),
      percentageShare: String(percentageShare),
      agreementType,
    });

    await sendEmail({
      to: { address: email },
      subject: emailData.subject,
      htmlBody: emailData.htmlBody,
      textBody: emailData.textBody,
    });

    return NextResponse.json(
      { investor: { userId: investorUserId, agreementId: agreement.id, token } },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
