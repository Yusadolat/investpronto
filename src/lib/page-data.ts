export interface InvestorPageRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  amountInvested: number;
  dateInvested: string;
  agreementType: string;
  percentageShare: number;
  status: string;
  notes: string;
}

export interface ExpensePageRow {
  id: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  spenderName: string | null;
  approvalStatus: string;
  monthKey: number;
}

export interface RevenuePageRow {
  id: string;
  amount: number;
  source: string;
  description: string;
  transactionDate: string;
  status: string;
  monthKey: number;
}

export interface ReportPageRow {
  monthKey: number;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  expenses: number;
  netProfit: number;
  investorPayouts: number;
}

export function normalizeInvestorsResponse(payload: Record<string, unknown>): InvestorPageRow[] {
  const source = Array.isArray(payload.investors)
    ? payload.investors
    : Array.isArray(payload)
      ? payload
      : [];

  return source.map((investor) => {
    const row = investor as Record<string, unknown>;

    return {
      id: String(row.id || ""),
      userId: String(row.userId || ""),
      name: String(row.name || row.userName || "Investor"),
      email: String(row.email || row.userEmail || ""),
      amountInvested: Number(row.amountInvested || 0),
      dateInvested: String(row.dateInvested || ""),
      agreementType: String(row.agreementType || "profit_share"),
      percentageShare: Number(row.percentageShare || 0),
      status: String(row.agreementStatus || row.status || "active"),
      notes: String(row.notes || ""),
    };
  });
}

export function normalizeExpensesResponse(payload: Record<string, unknown>): ExpensePageRow[] {
  const source = Array.isArray(payload.expenses)
    ? payload.expenses
    : Array.isArray(payload)
      ? payload
      : [];

  return source.map((expense) => {
    const row = expense as Record<string, unknown>;

    return {
      id: String(row.id || ""),
      amount: Number(row.amount || 0),
      category: String(row.category || "miscellaneous"),
      description: String(row.description || ""),
      expenseDate: String(row.expenseDate || ""),
      receiptUrl: row.receiptUrl ? String(row.receiptUrl) : null,
      spenderName: row.spenderName ? String(row.spenderName) : null,
      approvalStatus: String(row.approvalStatus || "approved"),
      monthKey: Number(row.month || row.monthKey || 0),
    };
  });
}

export function normalizeRevenueResponse(payload: Record<string, unknown>): RevenuePageRow[] {
  const source = Array.isArray(payload.revenueEntries)
    ? payload.revenueEntries
    : Array.isArray(payload.revenue)
      ? (payload.revenue as unknown[])
      : Array.isArray(payload)
        ? payload
        : [];

  return source.map((revenue) => {
    const row = revenue as Record<string, unknown>;

    return {
      id: String(row.id || ""),
      amount: Number(row.amount || 0),
      source: String(row.source || "manual"),
      description: String(row.description || ""),
      transactionDate: String(row.transactionDate || ""),
      status: String(row.status || "verified"),
      monthKey: Number(row.month || row.monthKey || 0),
    };
  });
}

export function normalizeMonthlyReportsResponse(
  payload: Record<string, unknown>
): ReportPageRow[] {
  const source = Array.isArray(payload.monthlyReport)
    ? payload.monthlyReport
    : Array.isArray(payload.reports)
      ? payload.reports
      : Array.isArray(payload)
        ? payload
        : [];

  return source.map((report) => {
    const row = report as Record<string, unknown>;
    const grossRevenue = Number(row.grossRevenue || row.totalRevenue || 0);
    const refunds = Number(row.refunds || 0);
    const netRevenue = Number(row.netRevenue || grossRevenue - refunds);
    const expenses = Number(row.expenses || row.totalExpenses || 0);

    return {
      monthKey: Number(row.month || row.monthKey || 0),
      grossRevenue,
      refunds,
      netRevenue,
      expenses,
      netProfit: Number(row.netProfit || netRevenue - expenses),
      investorPayouts: Number(row.investorPayouts || row.payouts || 0),
    };
  });
}
