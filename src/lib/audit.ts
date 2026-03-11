import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export async function logAudit(params: {
  userId?: string;
  hostelId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId || null,
    hostelId: params.hostelId || null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId || null,
    details: params.details || null,
    ipAddress: params.ipAddress || null,
  });
}
