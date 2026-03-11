export type UserRole = 'super_admin' | 'admin' | 'operator' | 'investor';
export type MembershipRole = 'admin' | 'operator' | 'investor';
export type HostelStatus = 'active' | 'inactive' | 'setup';
export type AgreementType = 'profit_share' | 'revenue_share' | 'equity' | 'custom';
export type AgreementStatus = 'active' | 'terminated' | 'pending';
export type RevenueSource = 'manual' | 'paystack' | 'bank_transfer' | 'cash';
export type RevenueStatus = 'verified' | 'pending' | 'refunded' | 'reversed';
export type ExpenseCategory = 'bandwidth' | 'power_fuel' | 'maintenance' | 'staff_operations' | 'device_replacement' | 'miscellaneous';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';
export type PayoutStatus = 'pending' | 'paid' | 'cancelled';

export interface MonthlyFinancials {
  month: number;
  monthLabel: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface InvestorDashboardData {
  totalInvested: number;
  currentMonthGrossRevenue: number;
  currentMonthExpenses: number;
  currentMonthNetProfit: number;
  investorPercentage: number;
  investorExpectedPayout: number;
  agreement: {
    type: AgreementType;
    percentageShare: number;
    status: AgreementStatus;
    dateInvested: string;
  };
  payoutHistory: Array<{
    month: number;
    monthLabel: string;
    amount: number;
    status: PayoutStatus;
    paidAt: string | null;
  }>;
  monthlyTrend: MonthlyFinancials[];
}

export interface AdminDashboardData {
  totalHostels: number;
  totalInvestors: number;
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  currentMonthProfit: number;
  totalInvestorLiabilities: number;
  hostelPerformance: Array<{
    hostelId: string;
    hostelName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  monthlyTrend: MonthlyFinancials[];
}

export interface HostelDashboardData {
  hostelName: string;
  totalSetupCost: number;
  founderContribution: number;
  totalInvestment: number;
  investorCount: number;
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  currentMonthProfit: number;
  monthlyTrend: MonthlyFinancials[];
  recentExpenses: Array<{
    id: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
    status: ApprovalStatus;
  }>;
  investors: Array<{
    id: string;
    name: string;
    email: string;
    amountInvested: number;
    percentageShare: number;
    agreementType: AgreementType;
  }>;
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  userName: string;
  timestamp: string;
}
