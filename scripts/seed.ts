import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import { pathToFileURL } from "node:url";
import { hashPassword } from "../src/lib/password";
import {
  users,
  organizations,
  hostels,
  memberships,
  investmentAgreements,
  revenueEntries,
  expenseEntries,
  setupCostItems,
  capitalContributions,
  monthlyFinancialSnapshots,
  payouts,
  auditLogs,
  invitations,
} from "../src/db/schema";

// Load .env.local
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export const SEED_IDENTIFIERS = {
  organizationName: "Prontoville Internet Services",
  organizationSlug: "prontoville-internet-services",
  hostelName: "Hostel A - Grace Hall",
  hostelSlug: "hostel-a-grace-hall",
  userEmails: [
    "admin@investpronto.com",
    "chioma@example.com",
    "tunde@example.com",
  ],
} as const;

export interface SeedCleanupStore {
  findOrganizationIdBySlug(slug: string): Promise<string | null>;
  findHostelIds(args: { organizationId: string }): Promise<string[]>;
  findUserIdsByEmails(emails: readonly string[]): Promise<string[]>;
  deleteAuditLogsByHostelIds(hostelIds: readonly string[]): Promise<void>;
  deleteAuditLogsByUserIds(userIds: readonly string[]): Promise<void>;
  deleteInvitationsByHostelIds(hostelIds: readonly string[]): Promise<void>;
  deleteInvitationsByUserIds(userIds: readonly string[]): Promise<void>;
  deleteHostelsByIds(hostelIds: readonly string[]): Promise<void>;
  deleteUsersByIds(userIds: readonly string[]): Promise<void>;
  deleteOrganizationById(organizationId: string): Promise<void>;
}

export async function resetSeedFixture(
  store: SeedCleanupStore,
  identifiers = SEED_IDENTIFIERS
) {
  const organizationId = await store.findOrganizationIdBySlug(
    identifiers.organizationSlug
  );
  const hostelIds = organizationId
    ? await store.findHostelIds({
        organizationId,
      })
    : [];
  const userIds = await store.findUserIdsByEmails(identifiers.userEmails);

  if (hostelIds.length > 0) {
    await store.deleteAuditLogsByHostelIds(hostelIds);
  }

  if (userIds.length > 0) {
    await store.deleteAuditLogsByUserIds(userIds);
  }

  if (hostelIds.length > 0) {
    await store.deleteInvitationsByHostelIds(hostelIds);
  }

  if (userIds.length > 0) {
    await store.deleteInvitationsByUserIds(userIds);
  }

  if (hostelIds.length > 0) {
    await store.deleteHostelsByIds(hostelIds);
  }

  if (userIds.length > 0) {
    await store.deleteUsersByIds(userIds);
  }

  if (organizationId) {
    await store.deleteOrganizationById(organizationId);
  }
}

function getMonthKey(date: Date = new Date()): number {
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}

export async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding database...");

  await resetSeedFixture({
    findOrganizationIdBySlug: async (slug) => {
      const [organization] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug));

      return organization?.id ?? null;
    },
    findHostelIds: async ({ organizationId }) => {
      const rows = await db
        .select({ id: hostels.id })
        .from(hostels)
        .where(eq(hostels.organizationId, organizationId));

      return rows.map((row) => row.id);
    },
    findUserIdsByEmails: async (emails) => {
      if (emails.length === 0) {
        return [];
      }

      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, [...emails]));

      return rows.map((row) => row.id);
    },
    deleteAuditLogsByHostelIds: async (hostelIds) => {
      if (hostelIds.length === 0) {
        return;
      }

      await db
        .delete(auditLogs)
        .where(inArray(auditLogs.hostelId, [...hostelIds]));
    },
    deleteAuditLogsByUserIds: async (userIds) => {
      if (userIds.length === 0) {
        return;
      }

      await db.delete(auditLogs).where(inArray(auditLogs.userId, [...userIds]));
    },
    deleteInvitationsByHostelIds: async (hostelIds) => {
      if (hostelIds.length === 0) {
        return;
      }

      await db
        .delete(invitations)
        .where(inArray(invitations.hostelId, [...hostelIds]));
    },
    deleteInvitationsByUserIds: async (userIds) => {
      if (userIds.length === 0) {
        return;
      }

      await db
        .delete(invitations)
        .where(inArray(invitations.invitedBy, [...userIds]));
    },
    deleteHostelsByIds: async (hostelIds) => {
      if (hostelIds.length === 0) {
        return;
      }

      await db.delete(hostels).where(inArray(hostels.id, [...hostelIds]));
    },
    deleteUsersByIds: async (userIds) => {
      if (userIds.length === 0) {
        return;
      }

      await db.delete(users).where(inArray(users.id, [...userIds]));
    },
    deleteOrganizationById: async (organizationId) => {
      await db.delete(organizations).where(eq(organizations.id, organizationId));
    },
  });

  // Current and past month keys
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const lastMonthKey = getMonthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const twoMonthsAgoKey = getMonthKey(
    new Date(now.getFullYear(), now.getMonth() - 2, 1)
  );

  // Helper for dates
  function dateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function monthDate(monthKey: number, day: number = 15): string {
    const year = Math.floor(monthKey / 100);
    const month = monthKey % 100;
    return dateStr(year, month, day);
  }

  // 1. Organization
  const [org] = await db
    .insert(organizations)
    .values({
      name: SEED_IDENTIFIERS.organizationName,
      slug: SEED_IDENTIFIERS.organizationSlug,
    })
    .returning({ id: organizations.id });

  console.log("Created organization:", org.id);

  // 2. Hostel
  const [hostel] = await db
    .insert(hostels)
    .values({
      organizationId: org.id,
      name: SEED_IDENTIFIERS.hostelName,
      slug: SEED_IDENTIFIERS.hostelSlug,
      address: "University of Lagos, Akoka, Lagos",
      totalSetupCost: "2500000.00",
      founderContribution: "1000000.00",
      status: "active",
    })
    .returning({ id: hostels.id });

  console.log("Created hostel:", hostel.id);

  // 3. Users
  const [adminUser] = await db
    .insert(users)
    .values({
      name: "Admin User",
      email: SEED_IDENTIFIERS.userEmails[0],
      passwordHash: hashPassword("admin123"),
      role: "super_admin",
    })
    .returning({ id: users.id });

  const [investorUser] = await db
    .insert(users)
    .values({
      name: "Chioma Okafor",
      email: SEED_IDENTIFIERS.userEmails[1],
      passwordHash: hashPassword("investor123"),
      role: "investor",
    })
    .returning({ id: users.id });

  const [operatorUser] = await db
    .insert(users)
    .values({
      name: "Tunde Bakare",
      email: SEED_IDENTIFIERS.userEmails[2],
      passwordHash: hashPassword("operator123"),
      role: "operator",
    })
    .returning({ id: users.id });

  console.log("Created users:", {
    admin: adminUser.id,
    investor: investorUser.id,
    operator: operatorUser.id,
  });

  // 4. Memberships
  await db.insert(memberships).values([
    { userId: adminUser.id, hostelId: hostel.id, role: "admin" as const },
    { userId: investorUser.id, hostelId: hostel.id, role: "investor" as const },
    { userId: operatorUser.id, hostelId: hostel.id, role: "operator" as const },
  ]);

  console.log("Created memberships");

  // 5. Investment Agreement
  const [agreement] = await db
    .insert(investmentAgreements)
    .values({
      hostelId: hostel.id,
      investorUserId: investorUser.id,
      amountInvested: "1500000.00",
      dateInvested: "2024-01-15",
      agreementType: "profit_share",
      percentageShare: "60.00",
      status: "active",
      notes: "60% profit share agreement for initial investment",
    })
    .returning({ id: investmentAgreements.id });

  console.log("Created investment agreement:", agreement.id);

  // 6. Revenue entries for 3 months
  const revenueData = [
    { monthKey: twoMonthsAgoKey, amount: "850000.00" },
    { monthKey: lastMonthKey, amount: "1050000.00" },
    { monthKey: currentMonthKey, amount: "1200000.00" },
  ];

  for (const rev of revenueData) {
    await db.insert(revenueEntries).values({
      hostelId: hostel.id,
      amount: rev.amount,
      source: "manual",
      description: "Monthly internet subscription revenue",
      transactionDate: monthDate(rev.monthKey, 1),
      month: rev.monthKey,
      status: "verified",
      createdBy: adminUser.id,
    });
  }

  console.log("Created revenue entries");

  // 7. Expense entries for 3 months
  const expenseCategories = [
    { category: "bandwidth" as const, amount: "150000.00", desc: "ISP bandwidth costs" },
    { category: "power_fuel" as const, amount: "80000.00", desc: "Diesel and electricity" },
    { category: "staff_operations" as const, amount: "100000.00", desc: "Staff salaries and operations" },
    { category: "miscellaneous" as const, amount: "30000.00", desc: "Miscellaneous expenses" },
  ];

  const monthKeys = [twoMonthsAgoKey, lastMonthKey, currentMonthKey];

  for (const mk of monthKeys) {
    for (const exp of expenseCategories) {
      await db.insert(expenseEntries).values({
        hostelId: hostel.id,
        amount: exp.amount,
        category: exp.category,
        description: exp.desc,
        expenseDate: monthDate(mk, 10),
        month: mk,
        createdBy: operatorUser.id,
        approvalStatus: "approved",
        approvedBy: adminUser.id,
      });
    }
  }

  console.log("Created expense entries");

  // 8. Setup cost items and capital contributions
  await db.insert(setupCostItems).values([
    {
      hostelId: hostel.id,
      title: "Core router and network controller",
      description: "Main routing hardware for the hostel network",
      category: "hardware",
      amount: "900000.00",
      costType: "one_time",
      incurredAt: "2024-01-05",
      vendor: "NetCore Systems",
      createdBy: adminUser.id,
    },
    {
      hostelId: hostel.id,
      title: "Access points and receivers",
      description: "Wireless distribution points across the building",
      category: "hardware",
      amount: "480000.00",
      costType: "one_time",
      incurredAt: "2024-01-06",
      vendor: "Signal Hub",
      createdBy: adminUser.id,
    },
    {
      hostelId: hostel.id,
      title: "Cabling and trunking",
      description: "Structured cabling for room and corridor runs",
      category: "installation",
      amount: "600000.00",
      costType: "one_time",
      incurredAt: "2024-01-08",
      vendor: "Campus Wiring Co",
      createdBy: adminUser.id,
    },
    {
      hostelId: hostel.id,
      title: "Installation labour",
      description: "Mounting, routing, and testing costs",
      category: "installation",
      amount: "250000.00",
      costType: "one_time",
      incurredAt: "2024-01-10",
      vendor: "Campus Wiring Co",
      createdBy: adminUser.id,
    },
    {
      hostelId: hostel.id,
      title: "Permits and activation",
      description: "Site access, approvals, and activation fees",
      category: "permits",
      amount: "150000.00",
      costType: "one_time",
      incurredAt: "2024-01-11",
      vendor: "Hostel Management",
      createdBy: adminUser.id,
    },
    {
      hostelId: hostel.id,
      title: "Startup bandwidth float",
      description: "Initial recurring bandwidth reserve",
      category: "bandwidth",
      amount: "120000.00",
      costType: "recurring",
      incurredAt: "2024-01-12",
      vendor: "ISP Partner",
      createdBy: adminUser.id,
    },
  ]);

  await db.insert(capitalContributions).values([
    {
      hostelId: hostel.id,
      contributorName: "Founder",
      contributorType: "founder",
      amount: "600000.00",
      contributionDate: "2024-01-03",
      createdBy: adminUser.id,
      notes: "Primary founder cash contribution",
    },
    {
      hostelId: hostel.id,
      contributorName: "Co-founder",
      contributorType: "cofounder",
      amount: "400000.00",
      contributionDate: "2024-01-04",
      createdBy: adminUser.id,
      notes: "Co-founder cash contribution",
    },
    {
      hostelId: hostel.id,
      contributorName: "Chioma Okafor",
      contributorType: "investor",
      amount: "1500000.00",
      contributionDate: "2024-01-15",
      linkedInvestorUserId: investorUser.id,
      createdBy: adminUser.id,
      notes: "External investor funding round",
    },
  ]);

  console.log("Created setup cost items and capital contributions");

  // 9. Monthly financial snapshots
  const snapshotData = [
    {
      monthKey: twoMonthsAgoKey,
      grossRevenue: "850000.00",
      netRevenue: "850000.00",
      totalExpenses: "360000.00",
      netProfit: "490000.00",
    },
    {
      monthKey: lastMonthKey,
      grossRevenue: "1050000.00",
      netRevenue: "1050000.00",
      totalExpenses: "360000.00",
      netProfit: "690000.00",
    },
    {
      monthKey: currentMonthKey,
      grossRevenue: "1200000.00",
      netRevenue: "1200000.00",
      totalExpenses: "360000.00",
      netProfit: "840000.00",
    },
  ];

  for (const snap of snapshotData) {
    await db.insert(monthlyFinancialSnapshots).values({
      hostelId: hostel.id,
      month: snap.monthKey,
      grossRevenue: snap.grossRevenue,
      refunds: "0.00",
      netRevenue: snap.netRevenue,
      totalExpenses: snap.totalExpenses,
      netProfit: snap.netProfit,
      calculatedAt: new Date(),
    });
  }

  console.log("Created monthly financial snapshots");

  // 10. Payouts
  // Two months ago - paid
  await db.insert(payouts).values({
    hostelId: hostel.id,
    investorUserId: investorUser.id,
    agreementId: agreement.id,
    month: twoMonthsAgoKey,
    amount: "294000.00", // 60% of 490k
    status: "paid",
    paidAt: new Date(
      Math.floor(twoMonthsAgoKey / 100),
      (twoMonthsAgoKey % 100) - 1,
      28
    ),
    reference: `PAY-${twoMonthsAgoKey}-001`,
  });

  // Last month - paid
  await db.insert(payouts).values({
    hostelId: hostel.id,
    investorUserId: investorUser.id,
    agreementId: agreement.id,
    month: lastMonthKey,
    amount: "414000.00", // 60% of 690k
    status: "paid",
    paidAt: new Date(
      Math.floor(lastMonthKey / 100),
      (lastMonthKey % 100) - 1,
      28
    ),
    reference: `PAY-${lastMonthKey}-001`,
  });

  // Current month - pending
  await db.insert(payouts).values({
    hostelId: hostel.id,
    investorUserId: investorUser.id,
    agreementId: agreement.id,
    month: currentMonthKey,
    amount: "504000.00", // 60% of 840k
    status: "pending",
  });

  console.log("Created payouts");

  // 11. Audit logs
  const auditEntries = [
    {
      userId: adminUser.id,
      hostelId: hostel.id,
      action: "create",
      entityType: "hostel",
      entityId: hostel.id,
      details: { name: "Hostel A - Grace Hall" },
    },
    {
      userId: adminUser.id,
      hostelId: hostel.id,
      action: "create",
      entityType: "investment_agreement",
      entityId: agreement.id,
      details: {
        investorName: "Chioma Okafor",
        amount: 1500000,
        percentage: 60,
      },
    },
    {
      userId: adminUser.id,
      hostelId: hostel.id,
      action: "create",
      entityType: "membership",
      entityId: null,
      details: { userName: "Tunde Bakare", role: "operator" },
    },
  ];

  for (const entry of auditEntries) {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      hostelId: entry.hostelId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
    });
  }

  console.log("Created audit logs");
  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin:    admin@investpronto.com / admin123");
  console.log("  Investor: chioma@example.com / investor123");
  console.log("  Operator: tunde@example.com / operator123");

  process.exit(0);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
