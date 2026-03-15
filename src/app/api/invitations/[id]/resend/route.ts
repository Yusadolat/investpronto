import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, hostels, users, investmentAgreements } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { generateInviteToken, formatNaira } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { investorInvitationEmail, founderInvitationEmail } from '@/lib/email-templates';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    await requireHostelAccess(invitation.hostelId, ['admin']);

    // Generate a fresh token and extend expiry
    const newToken = generateInviteToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(invitations)
      .set({ token: newToken, expiresAt: newExpiresAt })
      .where(eq(invitations.id, id));

    // Fetch hostel and inviter details for the email
    const [hostel] = await db
      .select({ name: hostels.name })
      .from(hostels)
      .where(eq(hostels.id, invitation.hostelId))
      .limit(1);

    const [inviter] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, invitation.invitedBy))
      .limit(1);

    if (invitation.role === 'investor') {
      // Fetch investment agreement details for the email
      const [agreement] = await db
        .select({
          amountInvested: investmentAgreements.amountInvested,
          percentageShare: investmentAgreements.percentageShare,
          agreementType: investmentAgreements.agreementType,
        })
        .from(investmentAgreements)
        .innerJoin(users, eq(investmentAgreements.investorUserId, users.id))
        .where(
          and(
            eq(investmentAgreements.hostelId, invitation.hostelId),
            eq(users.email, invitation.email)
          )
        )
        .limit(1);

      const emailData = investorInvitationEmail({
        hostelName: hostel?.name || 'a property',
        inviterName: inviter?.name || 'The admin',
        token: newToken,
        amountInvested: agreement ? formatNaira(parseFloat(agreement.amountInvested)) : 'N/A',
        percentageShare: agreement?.percentageShare || '0',
        agreementType: agreement?.agreementType || 'profit_share',
      });

      await sendEmail({
        to: { address: invitation.email },
        subject: emailData.subject,
        htmlBody: emailData.htmlBody,
        textBody: emailData.textBody,
      });
    } else {
      const emailData = founderInvitationEmail({
        hostelName: hostel?.name || 'a property',
        inviterName: inviter?.name || 'The admin',
        token: newToken,
        role: invitation.role as 'admin' | 'operator',
      });

      await sendEmail({
        to: { address: invitation.email },
        subject: emailData.subject,
        htmlBody: emailData.htmlBody,
        textBody: emailData.textBody,
      });
    }

    return NextResponse.json({ success: true, newExpiresAt });
  } catch (error) {
    return handleAuthError(error);
  }
}
