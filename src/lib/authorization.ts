import { auth } from "./auth";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { UserRole, MembershipRole } from "@/types";

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    email: session.user.email!,
    name: session.user.name || '',
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}

export async function requireRole(roles: UserRole[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.role)) throw new Error("Forbidden");
  return ctx;
}

export async function requireHostelAccess(
  hostelId: string,
  requiredRoles?: MembershipRole[]
): Promise<AuthContext & { membershipRole: MembershipRole }> {
  const ctx = await requireAuth();
  
  // Super admin can access everything
  if (ctx.role === 'super_admin') {
    return { ...ctx, membershipRole: 'admin' };
  }

  const membership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, ctx.userId),
        eq(memberships.hostelId, hostelId)
      )
    )
    .limit(1);

  if (membership.length === 0) throw new Error("Forbidden");

  const memberRole = membership[0].role as MembershipRole;
  if (requiredRoles && !requiredRoles.includes(memberRole)) {
    throw new Error("Forbidden");
  }

  return { ...ctx, membershipRole: memberRole };
}

export function handleAuthError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
