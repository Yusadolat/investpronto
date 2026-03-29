import type { MembershipRole, UserRole } from "@/types";

export interface InvestorRecordAccessContext {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  membershipRole: MembershipRole;
}

export function assertInvestorRecordAccess(
  ctx: InvestorRecordAccessContext,
  investorUserId: string
): void {
  if (
    ctx.role === "super_admin" ||
    ctx.membershipRole === "admin" ||
    ctx.userId === investorUserId
  ) {
    return;
  }

  throw new Error("Forbidden");
}
