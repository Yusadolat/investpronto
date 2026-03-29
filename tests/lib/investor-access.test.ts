import test from "node:test";
import assert from "node:assert/strict";

import {
  assertInvestorRecordAccess,
  type InvestorRecordAccessContext,
} from "../../src/lib/investor-access";

const baseCtx: InvestorRecordAccessContext = {
  userId: "user-1",
  role: "investor",
  email: "investor@example.com",
  name: "Investor One",
  membershipRole: "investor",
};

test("assertInvestorRecordAccess allows an admin membership to view any investor record", () => {
  assert.doesNotThrow(() =>
    assertInvestorRecordAccess(
      { ...baseCtx, role: "admin", membershipRole: "admin" },
      "another-investor"
    )
  );
});

test("assertInvestorRecordAccess allows investors to view their own record", () => {
  assert.doesNotThrow(() =>
    assertInvestorRecordAccess(
      { ...baseCtx, membershipRole: "investor" },
      "user-1"
    )
  );
});

test("assertInvestorRecordAccess blocks other investors from viewing a peer record", () => {
  assert.throws(
    () =>
      assertInvestorRecordAccess(
        { ...baseCtx, membershipRole: "investor" },
        "user-2"
      ),
    /Forbidden/
  );
});

test("assertInvestorRecordAccess blocks operators from viewing investor private data", () => {
  assert.throws(
    () =>
      assertInvestorRecordAccess(
        {
          ...baseCtx,
          userId: "operator-1",
          role: "operator",
          email: "operator@example.com",
          name: "Operator",
          membershipRole: "operator",
        },
        "user-2"
      ),
    /Forbidden/
  );
});
