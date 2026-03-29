import test from "node:test";
import assert from "node:assert/strict";

import {
  resetSeedFixture,
  SEED_IDENTIFIERS,
  type SeedCleanupStore,
} from "../../scripts/seed";

test("resetSeedFixture removes seeded records in a rerun-safe order", async () => {
  const calls: string[] = [];

  const store: SeedCleanupStore = {
    findOrganizationIdBySlug: async (slug) => {
      calls.push(`findOrganization:${slug}`);
      return "org-1";
    },
    findHostelIds: async ({ organizationId }) => {
      calls.push(`findHostels:${organizationId}`);
      return ["hostel-1"];
    },
    findUserIdsByEmails: async (emails) => {
      calls.push(`findUsers:${emails.join(",")}`);
      return ["user-1", "user-2", "user-3"];
    },
    deleteAuditLogsByHostelIds: async (hostelIds) => {
      calls.push(`deleteAuditLogsByHostel:${hostelIds.join(",")}`);
    },
    deleteAuditLogsByUserIds: async (userIds) => {
      calls.push(`deleteAuditLogsByUser:${userIds.join(",")}`);
    },
    deleteInvitationsByHostelIds: async (hostelIds) => {
      calls.push(`deleteInvitationsByHostel:${hostelIds.join(",")}`);
    },
    deleteInvitationsByUserIds: async (userIds) => {
      calls.push(`deleteInvitationsByUser:${userIds.join(",")}`);
    },
    deleteHostelsByIds: async (hostelIds) => {
      calls.push(`deleteHostels:${hostelIds.join(",")}`);
    },
    deleteUsersByIds: async (userIds) => {
      calls.push(`deleteUsers:${userIds.join(",")}`);
    },
    deleteOrganizationById: async (organizationId) => {
      calls.push(`deleteOrganization:${organizationId}`);
    },
  };

  await resetSeedFixture(store);

  assert.deepEqual(calls, [
    `findOrganization:${SEED_IDENTIFIERS.organizationSlug}`,
    "findHostels:org-1",
    `findUsers:${SEED_IDENTIFIERS.userEmails.join(",")}`,
    "deleteAuditLogsByHostel:hostel-1",
    "deleteAuditLogsByUser:user-1,user-2,user-3",
    "deleteInvitationsByHostel:hostel-1",
    "deleteInvitationsByUser:user-1,user-2,user-3",
    "deleteHostels:hostel-1",
    "deleteUsers:user-1,user-2,user-3",
    "deleteOrganization:org-1",
  ]);
});

test("resetSeedFixture skips deletes when no seeded rows exist", async () => {
  const calls: string[] = [];

  const store: SeedCleanupStore = {
    findOrganizationIdBySlug: async () => null,
    findHostelIds: async () => {
      calls.push("findHostels");
      return [];
    },
    findUserIdsByEmails: async () => {
      calls.push("findUsers");
      return [];
    },
    deleteAuditLogsByHostelIds: async () => {
      calls.push("deleteAuditLogsByHostel");
    },
    deleteAuditLogsByUserIds: async () => {
      calls.push("deleteAuditLogsByUser");
    },
    deleteInvitationsByHostelIds: async () => {
      calls.push("deleteInvitationsByHostel");
    },
    deleteInvitationsByUserIds: async () => {
      calls.push("deleteInvitationsByUser");
    },
    deleteHostelsByIds: async () => {
      calls.push("deleteHostels");
    },
    deleteUsersByIds: async () => {
      calls.push("deleteUsers");
    },
    deleteOrganizationById: async () => {
      calls.push("deleteOrganization");
    },
  };

  await resetSeedFixture(store);

  assert.deepEqual(calls, ["findUsers"]);
});
