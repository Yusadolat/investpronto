import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hostels, memberships, organizations } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireRole, handleAuthError } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const ctx = await requireAuth();

    if (ctx.role === 'super_admin') {
      const allHostels = await db
        .select({
          id: hostels.id,
          name: hostels.name,
          slug: hostels.slug,
          address: hostels.address,
          totalSetupCost: hostels.totalSetupCost,
          founderContribution: hostels.founderContribution,
          status: hostels.status,
          organizationId: hostels.organizationId,
          createdAt: hostels.createdAt,
        })
        .from(hostels)
        .orderBy(desc(hostels.createdAt));

      return NextResponse.json({ hostels: allHostels });
    }

    const userHostels = await db
      .select({
        id: hostels.id,
        name: hostels.name,
        slug: hostels.slug,
        address: hostels.address,
        totalSetupCost: hostels.totalSetupCost,
        founderContribution: hostels.founderContribution,
        status: hostels.status,
        organizationId: hostels.organizationId,
        createdAt: hostels.createdAt,
        membershipRole: memberships.role,
      })
      .from(memberships)
      .innerJoin(hostels, eq(memberships.hostelId, hostels.id))
      .where(eq(memberships.userId, ctx.userId))
      .orderBy(desc(hostels.createdAt));

    return NextResponse.json({ hostels: userHostels });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireRole(['super_admin', 'admin']);
    const body = await request.json();
    const { name, address, totalSetupCost, founderContribution, organizationName } = body;

    if (!name || !address || totalSetupCost == null || founderContribution == null) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, totalSetupCost, founderContribution' },
        { status: 400 }
      );
    }

    let organizationId: string;

    if (body.organizationId) {
      organizationId = body.organizationId;
    } else {
      const orgName = organizationName || name;
      const orgSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: orgName,
          slug: `${orgSlug}-${Date.now()}`,
        })
        .returning({ id: organizations.id });

      organizationId = newOrg.id;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const [newHostel] = await db
      .insert(hostels)
      .values({
        organizationId,
        name,
        slug: `${slug}-${Date.now()}`,
        address,
        totalSetupCost: totalSetupCost.toString(),
        founderContribution: founderContribution.toString(),
        status: 'setup',
      })
      .returning();

    // Create admin membership for the creator
    await db.insert(memberships).values({
      userId: ctx.userId,
      hostelId: newHostel.id,
      role: 'admin',
    });

    await logAudit({
      userId: ctx.userId,
      hostelId: newHostel.id,
      action: 'create',
      entityType: 'hostel',
      entityId: newHostel.id,
      details: { name, address, totalSetupCost, founderContribution },
    });

    return NextResponse.json({ hostel: newHostel }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
