import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function DELETE(
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

    const ctx = await requireHostelAccess(invitation.hostelId, ['admin']);

    await db.delete(invitations).where(eq(invitations.id, id));

    await logAudit({
      userId: ctx.userId,
      hostelId: invitation.hostelId,
      action: 'delete_invitation',
      entityType: 'invitation',
      entityId: id,
      details: { email: invitation.email, role: invitation.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
