import test from "node:test";
import assert from "node:assert/strict";

import { buildTransparencySummary } from "@/lib/transparency";

test("buildTransparencySummary derives setup and capital transparency totals", () => {
  const summary = buildTransparencySummary(
    {
      totalSetupCost: 2_500_000,
    },
    [
      {
        id: "router",
        amount: 850_000,
        costType: "one_time",
        category: "hardware",
      },
      {
        id: "cabling",
        amount: 450_000,
        costType: "one_time",
        category: "installation",
      },
      {
        id: "startup-bandwidth",
        amount: 120_000,
        costType: "recurring",
        category: "bandwidth",
      },
    ],
    [
      {
        id: "founder",
        contributorName: "Founder",
        contributorType: "founder",
        amount: 600_000,
      },
      {
        id: "cofounder",
        contributorName: "Co-founder",
        contributorType: "cofounder",
        amount: 400_000,
      },
      {
        id: "investor",
        contributorName: "Investor Pool",
        contributorType: "investor",
        amount: 1_500_000,
      },
    ]
  );

  assert.equal(summary.setup.totalRecorded, 1_420_000);
  assert.equal(summary.setup.oneTimeTotal, 1_300_000);
  assert.equal(summary.setup.recurringTotal, 120_000);
  assert.equal(summary.setup.remainingBudget, 1_080_000);
  assert.equal(summary.setup.overBudgetAmount, 0);

  assert.equal(summary.capital.totalContributed, 2_500_000);
  assert.equal(summary.capital.fundingGap, 0);
  assert.equal(summary.capital.excessCapital, 0);
  assert.equal(summary.capital.founderCapital, 600_000);
  assert.equal(summary.capital.cofounderCapital, 400_000);
  assert.equal(summary.capital.investorCapital, 1_500_000);
  assert.equal(summary.capital.contributions[0].capitalPercentage, 24);
  assert.equal(summary.capital.contributions[1].capitalPercentage, 16);
  assert.equal(summary.capital.contributions[2].capitalPercentage, 60);
});

test("buildTransparencySummary handles over-budget spend and overfunding", () => {
  const summary = buildTransparencySummary(
    {
      totalSetupCost: 1_000_000,
    },
    [
      {
        id: "bulk-purchase",
        amount: 1_150_000,
        costType: "one_time",
        category: "hardware",
      },
    ],
    [
      {
        id: "angel",
        contributorName: "Angel Investor",
        contributorType: "investor",
        amount: 1_250_000,
      },
    ]
  );

  assert.equal(summary.setup.remainingBudget, 0);
  assert.equal(summary.setup.overBudgetAmount, 150_000);
  assert.equal(summary.capital.fundingGap, 0);
  assert.equal(summary.capital.excessCapital, 250_000);
  assert.equal(summary.capital.contributions[0].capitalPercentage, 125);
});
