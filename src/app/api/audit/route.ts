import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireHostelAccess, handleAuthError } from '@/lib/authorization';

export async function GET(request: NextRequest) {
  try {
    const hostelId = request.nextUrl.searchParams.get('hostelId');
    const limitParam = request.nextUrl.searchParams.get('limit');

    if (!hostelId) {
      return NextResponse.json(
        { error: 'hostelId query parameter is required' },
        { status: 400 }
      );
    }

    await requireHostelAccess(hostelId, ['admin']);

    // Also allow super_admin (requireHostelAccess already grants admin role to super_admin)
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.hostelId, hostelId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ auditLogs: logs });
  } catch (error) {
    return handleAuthError(error);
  }
}
