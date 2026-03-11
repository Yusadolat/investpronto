import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeExpensesResponse,
  normalizeInvestorsResponse,
  normalizeMonthlyReportsResponse,
  normalizeRevenueResponse,
} from "@/lib/page-data";

test("normalizeInvestorsResponse uses agreementStatus from the API payload", () => {
  const investors = normalizeInvestorsResponse({
    investors: [
      {
        id: "investor-1",
        name: "Chioma Okafor",
        email: "chioma@example.com",
        amountInvested: "1500000.00",
        dateInvested: "2024-01-15",
        agreementType: "profit_share",
        percentageShare: "60.00",
        agreementStatus: "active",
        notes: "Lead investor",
      },
    ],
  });

  assert.equal(investors.length, 1);
  assert.equal(investors[0].agreementType, "profit_share");
  assert.equal(investors[0].status, "active");
  assert.equal(investors[0].percentageShare, 60);
});

test("normalizeExpensesResponse reads month-based API payloads", () => {
  const expenses = normalizeExpensesResponse({
    expenses: [
      {
        id: "expense-1",
        amount: "80000.00",
        category: "power_fuel",
        description: "Diesel purchase",
        expenseDate: "2026-03-01",
        receiptUrl: null,
        approvalStatus: "approved",
        month: 202603,
      },
    ],
  });

  assert.equal(expenses.length, 1);
  assert.equal(expenses[0].category, "power_fuel");
  assert.equal(expenses[0].monthKey, 202603);
});

test("normalizeRevenueResponse reads revenueEntries API payloads", () => {
  const revenue = normalizeRevenueResponse({
    revenueEntries: [
      {
        id: "rev-1",
        amount: "1200000.00",
        source: "manual",
        description: "Monthly subscriptions",
        transactionDate: "2026-03-01",
        status: "verified",
        month: 202603,
      },
    ],
  });

  assert.equal(revenue.length, 1);
  assert.equal(revenue[0].source, "manual");
  assert.equal(revenue[0].status, "verified");
  assert.equal(revenue[0].monthKey, 202603);
});

test("normalizeMonthlyReportsResponse reads monthlyReport payloads", () => {
  const reports = normalizeMonthlyReportsResponse({
    monthlyReport: [
      {
        month: 202603,
        grossRevenue: 1200000,
        refunds: 0,
        netRevenue: 1200000,
        totalExpenses: 360000,
        netProfit: 840000,
      },
    ],
  });

  assert.equal(reports.length, 1);
  assert.equal(reports[0].monthKey, 202603);
  assert.equal(reports[0].expenses, 360000);
  assert.equal(reports[0].investorPayouts, 0);
});
