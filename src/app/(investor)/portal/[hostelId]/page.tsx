"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Percent,
  PieChart,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatNaira } from "@/lib/utils";

interface Agreement {
  id: string;
  agreementType: string;
  percentageShare: number;
  amountInvested: number;
  dateInvested: string;
  status: string;
}

interface PayoutEntry {
  id: string;
  month: number;
  monthLabel: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

interface MonthlyTrendEntry {
  month: number;
  monthLabel: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

interface InvestorData {
  investor: { id: string; name: string; email: string };
  agreements: Agreement[];
  payoutHistory: PayoutEntry[];
  monthlyTrend: MonthlyTrendEntry[];
}

interface SetupItem {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  costType: "one_time" | "recurring";
  incurredAt: string;
  vendor: string | null;
}

interface CapitalContribution {
  id: string;
  contributorName: string;
  contributorType: "founder" | "cofounder" | "investor" | "other";
  amount: number;
  contributionDate: string;
}

interface ProfitSharingConfig {
  config: {
    companySharePercent: number;
    ownerSharePercent: number;
    investorPoolPercent: number;
    reserveFundPercent: number;
    minimumPayoutAmount: number;
  };
  recurringCosts: Array<{
    id: string;
    name: string;
    monthlyAmount: number;
    isActive: boolean;
  }>;
  totalMonthlyRecurringCosts: number;
  investorAgreements: {
    count: number;
    totalShareAllocated: number;
  };
}

interface HostelTransparencyResponse {
  hostel: {
    name: string;
    status: string;
    totalSetupCost: string;
  };
  transparency: {
    summary: {
      setup: {
        totalBudget: number;
        totalRecorded: number;
        oneTimeTotal: number;
        recurringTotal: number;
        remainingBudget: number;
      };
      capital: {
        totalContributed: number;
        founderCapital: number;
        cofounderCapital: number;
        investorCapital: number;
        otherCapital: number;
        fundingGap: number;
        excessCapital: number;
      };
    };
    setupItems: SetupItem[];
    capitalContributions: CapitalContribution[];
  };
}

const EXPENSE_COLORS: Record<string, string> = {
  bandwidth: "#3b82f6",
  power_fuel: "#f59e0b",
  maintenance: "#8b5cf6",
  staff_operations: "#10b981",
  device_replacement: "#ef4444",
  miscellaneous: "#6b7280",
};

const CAPITAL_COLORS: Record<string, string> = {
  founder: "#0c1222",
  cofounder: "#1e3a5f",
  investor: "#facc15",
  other: "#94a3b8",
};

export default function InvestorHostelDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const hostelId = params.hostelId as string;

  const [data, setData] = useState<InvestorData | null>(null);
  const [hostelData, setHostelData] =
    useState<HostelTransparencyResponse | null>(null);
  const [profitConfig, setProfitConfig] = useState<ProfitSharingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        const [investorRes, hostelRes, profitRes] = await Promise.all([
          fetch(`/api/investors/${session.user.id}?hostelId=${hostelId}`),
          fetch(`/api/hostels/${hostelId}`),
          fetch(`/api/hostels/${hostelId}/profit-sharing`),
        ]);

        if (investorRes.ok) {
          const investorData = (await investorRes.json()) as InvestorData;
          setData(investorData);
        }

        if (hostelRes.ok) {
          const hostelPayload =
            (await hostelRes.json()) as HostelTransparencyResponse;
          setHostelData(hostelPayload);
        }

        if (profitRes.ok) {
          const profitData = (await profitRes.json()) as ProfitSharingConfig;
          setProfitConfig(profitData);
        }
      } catch {
        // network error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.user?.id, hostelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || !hostelData) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Unable to load investment data.</p>
        <button
          onClick={() => router.push("/portal")}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Portfolio
        </button>
      </div>
    );
  }

  const agreement = data.agreements[0];
  const currentMonth = data.monthlyTrend[0];
  const grossRevenue = currentMonth?.grossRevenue || 0;
  const totalExpenses = currentMonth?.totalExpenses || 0;
  const netProfit = currentMonth?.netProfit || 0;

  // Calculate expected payout using the waterfall
  const pc = profitConfig?.config;
  const recurringCostsTotal = profitConfig?.totalMonthlyRecurringCosts || 0;
  const operatingProfit = netProfit - recurringCostsTotal;
  const reserveAmount = Math.max(0, operatingProfit * ((pc?.reserveFundPercent || 0) / 100));
  const distributableProfit = Math.max(0, operatingProfit - reserveAmount);
  const investorPoolTotal = distributableProfit * ((pc?.investorPoolPercent || 100) / 100);
  const companyShareAmount = distributableProfit * ((pc?.companySharePercent || 0) / 100);
  const ownerShareAmount = distributableProfit * ((pc?.ownerSharePercent || 0) / 100);
  const expectedPayout = Math.max(
    0,
    investorPoolTotal * ((agreement?.percentageShare || 0) / 100)
  );
  const capitalStake =
    hostelData.transparency.summary.setup.totalBudget > 0
      ? (agreement?.amountInvested || 0) /
        hostelData.transparency.summary.setup.totalBudget
      : 0;

  // Chart data
  const chartData = [...data.monthlyTrend].reverse().map((month) => ({
    name: month.monthLabel.replace(/\s\d{4}$/, ""),
    Revenue: month.grossRevenue,
    Expenses: month.totalExpenses,
    Profit: month.netProfit,
  }));

  // Running costs by category from setup items
  const setupByCategory = hostelData.transparency.setupItems.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const runningCostsData = Object.entries(setupByCategory).map(
    ([category, amount]) => ({
      name: category.replace(/_/g, " "),
      value: amount,
      color: EXPENSE_COLORS[category] || "#6b7280",
    })
  );

  // Capital stack data
  const capitalData = [
    {
      name: "Founder",
      value: hostelData.transparency.summary.capital.founderCapital,
      color: CAPITAL_COLORS.founder,
    },
    {
      name: "Co-founder",
      value: hostelData.transparency.summary.capital.cofounderCapital,
      color: CAPITAL_COLORS.cofounder,
    },
    {
      name: "Investor",
      value: hostelData.transparency.summary.capital.investorCapital,
      color: CAPITAL_COLORS.investor,
    },
    {
      name: "Other",
      value: hostelData.transparency.summary.capital.otherCapital,
      color: CAPITAL_COLORS.other,
    },
  ].filter((d) => d.value > 0);

  const totalCapital =
    hostelData.transparency.summary.capital.totalContributed;

  const statusVariant =
    hostelData.hostel.status === "active"
      ? "success"
      : hostelData.hostel.status === "inactive"
      ? "error"
      : "warning";

  // Table columns
  const payoutColumns: Column<PayoutEntry>[] = [
    { key: "monthLabel", header: "Month" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-display font-bold">{formatNaira(row.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variant =
          row.status === "paid"
            ? "success"
            : row.status === "pending"
            ? "warning"
            : "error";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: "paidAt",
      header: "Paid Date",
      render: (row) =>
        row.paidAt ? new Date(row.paidAt).toLocaleDateString("en-NG") : "-",
    },
  ];

  const financialColumns: Column<MonthlyTrendEntry>[] = [
    { key: "monthLabel", header: "Month" },
    {
      key: "grossRevenue",
      header: "Gross Revenue",
      render: (row) => formatNaira(row.grossRevenue),
    },
    {
      key: "totalExpenses",
      header: "Expenses",
      render: (row) => formatNaira(row.totalExpenses),
    },
    {
      key: "netProfit",
      header: "Net Profit",
      render: (row) => (
        <span
          className={
            row.netProfit >= 0
              ? "text-emerald-600 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {formatNaira(row.netProfit)}
        </span>
      ),
    },
    {
      key: "yourShare",
      header: "Your Share",
      render: (row) => {
        const share = Math.max(
          0,
          row.netProfit * ((agreement?.percentageShare || 0) / 100)
        );
        return (
          <span className="font-display font-bold text-emerald-600">
            {formatNaira(share)}
          </span>
        );
      },
    },
  ];

  const setupColumns: Column<SetupItem>[] = [
    { key: "title", header: "Item" },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: EXPENSE_COLORS[item.category] || "#6b7280",
            }}
          />
          <span className="text-sm capitalize">
            {item.category.replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      key: "costType",
      header: "Type",
      render: (item) => (
        <Badge variant={item.costType === "recurring" ? "warning" : "default"}>
          {item.costType === "recurring" ? "Recurring" : "One-time"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => (
        <span className="font-display font-bold">{formatNaira(item.amount)}</span>
      ),
    },
    {
      key: "incurredAt",
      header: "Date",
      render: (item) =>
        new Date(item.incurredAt).toLocaleDateString("en-NG"),
    },
  ];

  const capitalColumns: Column<CapitalContribution>[] = [
    { key: "contributorName", header: "Contributor" },
    {
      key: "contributorType",
      header: "Type",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor:
                CAPITAL_COLORS[item.contributorType] || "#94a3b8",
            }}
          />
          <span className="text-sm capitalize">
            {item.contributorType.replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => (
        <span className="font-display font-bold">{formatNaira(item.amount)}</span>
      ),
    },
    {
      key: "stake",
      header: "Stake",
      render: (item) => {
        const stake =
          hostelData.transparency.summary.setup.totalBudget > 0
            ? (item.amount /
                hostelData.transparency.summary.setup.totalBudget) *
              100
            : 0;
        return (
          <span className="font-display font-semibold">{stake.toFixed(1)}%</span>
        );
      },
    },
  ];

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => router.push("/portal")}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Portfolio
      </button>

      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.06),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              {hostelData.hostel.name}
            </h1>
            <Badge variant={statusVariant}>{hostelData.hostel.status}</Badge>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                label: "Total Invested",
                value: formatNaira(agreement?.amountInvested || 0),
                icon: Wallet,
                color: "text-white",
              },
              {
                label: "Monthly Revenue",
                value: formatNaira(grossRevenue),
                icon: TrendingUp,
                color: "text-emerald-400",
              },
              {
                label: "Monthly Expenses",
                value: formatNaira(totalExpenses),
                icon: TrendingDown,
                color: "text-amber-400",
              },
              {
                label: "Net Profit",
                value: formatNaira(netProfit),
                icon: DollarSign,
                color: netProfit >= 0 ? "text-emerald-400" : "text-rose-400",
              },
            ].map((metric, i) => (
              <div key={metric.label} className="">
                <div className="flex items-center gap-1.5 mb-1">
                  <metric.icon className="h-3 w-3 text-slate-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {metric.label}
                  </p>
                </div>
                <p className={`font-display text-lg sm:text-xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gold accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      </div>

      {/* Your Position Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {
            label: "Capital Stake",
            value: `${(capitalStake * 100).toFixed(1)}%`,
            sub: "Your ownership share",
            icon: PieChart,
            accent: "from-slate-800 to-slate-700",
          },
          {
            label: "Profit Share",
            value: `${agreement?.percentageShare || 0}%`,
            sub: (agreement?.agreementType?.replace("_", " ") || "—") + " agreement",
            icon: PieChart,
            accent: "from-amber-400 to-amber-500",
          },
          {
            label: "Expected Payout",
            value: formatNaira(expectedPayout),
            sub: "Based on current month",
            icon: DollarSign,
            accent: "from-emerald-500 to-emerald-600",
          },
          {
            label: "Setup Budget",
            value: formatNaira(hostelData.transparency.summary.setup.totalBudget),
            sub: "Total project cost",
            icon: Receipt,
            accent: "from-slate-500 to-slate-600",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={` relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 capitalize">{stat.sub}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Card */}
      {agreement && (
        <Card className="mb-8 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-slate-800 via-amber-400 to-slate-800" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              <CardTitle className="font-display">Investment Agreement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Agreement Type", value: agreement.agreementType.replace("_", " ") },
                { label: "Profit Share", value: `${agreement.percentageShare}%` },
                { label: "Capital Stake", value: `${(capitalStake * 100).toFixed(1)}%` },
                {
                  label: "Date Invested",
                  value: new Date(agreement.dateInvested).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                    {item.label}
                  </p>
                  <p className="font-display text-base font-bold text-slate-900 capitalize">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profit Distribution Waterfall — Full Transparency */}
      {profitConfig && netProfit !== 0 && (
        <Card className="mb-8 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-slate-700" />
              <CardTitle className="font-display">How Your Returns Are Calculated</CardTitle>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Full breakdown of how this month&apos;s net profit is distributed
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {/* Net Profit */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                <span className="text-sm font-semibold text-white">Net Profit (Revenue − Expenses)</span>
                <span className="font-display text-base font-bold text-white">{formatNaira(netProfit)}</span>
              </div>

              {/* Recurring costs */}
              {recurringCostsTotal > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-sm text-rose-700">
                      Recurring Costs
                      <span className="text-rose-400 ml-1 text-xs">
                        ({profitConfig.recurringCosts.filter(c => c.isActive).map(c => c.name).join(", ")})
                      </span>
                    </span>
                  </div>
                  <span className="font-display text-sm font-bold text-rose-700">−{formatNaira(recurringCostsTotal)}</span>
                </div>
              )}

              {/* Operating profit */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-900">Operating Profit</span>
                <span className="font-display text-sm font-bold text-slate-900">{formatNaira(operatingProfit)}</span>
              </div>

              {/* Reserve fund */}
              {(pc?.reserveFundPercent || 0) > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-sm text-violet-700">Reserve Fund ({pc?.reserveFundPercent}%)</span>
                  </div>
                  <span className="font-display text-sm font-bold text-violet-700">−{formatNaira(reserveAmount)}</span>
                </div>
              )}

              {/* Distributable */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="text-sm font-semibold text-emerald-800">Distributable Profit</span>
                <span className="font-display text-sm font-bold text-emerald-800">{formatNaira(distributableProfit)}</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <ArrowDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Distribution split */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(pc?.companySharePercent || 0) > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Platform Fee</span>
                    </div>
                    <p className="font-display text-lg font-bold text-blue-900">{formatNaira(companyShareAmount)}</p>
                    <p className="text-[11px] text-blue-400 mt-0.5">{pc?.companySharePercent}%</p>
                  </div>
                )}
                {(pc?.ownerSharePercent || 0) > 0 && (
                  <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-700" />
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Owner</span>
                    </div>
                    <p className="font-display text-lg font-bold text-slate-900">{formatNaira(ownerShareAmount)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{pc?.ownerSharePercent}%</p>
                  </div>
                )}
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center relative">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-slate-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Your pool
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5 mt-1">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Investor Pool</span>
                  </div>
                  <p className="font-display text-lg font-bold text-amber-900">{formatNaira(investorPoolTotal)}</p>
                  <p className="text-[11px] text-amber-500 mt-0.5">{pc?.investorPoolPercent}%</p>
                </div>
              </div>

              {/* Your specific share */}
              <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Share ({agreement?.percentageShare || 0}% of Investor Pool)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatNaira(investorPoolTotal)} × {agreement?.percentageShare || 0}%
                  </p>
                </div>
                <p className="font-display text-2xl font-bold text-amber-400">{formatNaira(expectedPayout)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
                    contentStyle={{
                      background: "#0c1222",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      padding: "12px 16px",
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: 600, fontSize: 12 }}
                    itemStyle={{ color: "#e2e8f0", fontSize: 13 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradRevenue)"
                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#gradExpenses)"
                    dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Profit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradProfit)"
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capital Stack & Running Costs — Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Capital Stack Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Capital Stack</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              Funding structure and contribution breakdown
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Visual stacked bar */}
            {capitalData.length > 0 && (
              <div>
                <div className="flex h-5 w-full overflow-hidden rounded-full border border-slate-200/80">
                  {capitalData.map((segment) => {
                    const pct =
                      totalCapital > 0
                        ? (segment.value / totalCapital) * 100
                        : 0;
                    return (
                      <div
                        key={segment.name}
                        className="h-full transition-all duration-700 animate-progress"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: segment.color,
                        }}
                        title={`${segment.name}: ${formatNaira(segment.value)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {capitalData.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="text-xs font-medium text-slate-500">
                        {segment.name}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {totalCapital > 0
                          ? `${((segment.value / totalCapital) * 100).toFixed(0)}%`
                          : "0%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-2.5 pt-2">
              {[
                {
                  label: "Founder Capital",
                  value: hostelData.transparency.summary.capital.founderCapital,
                  color: CAPITAL_COLORS.founder,
                },
                {
                  label: "Co-founder Capital",
                  value: hostelData.transparency.summary.capital.cofounderCapital,
                  color: CAPITAL_COLORS.cofounder,
                },
                {
                  label: "Investor Capital",
                  value: hostelData.transparency.summary.capital.investorCapital,
                  color: CAPITAL_COLORS.investor,
                },
                {
                  label: "Total Raised",
                  value: totalCapital,
                  color: null,
                  isTotal: true,
                },
              ]
                .filter((item) => item.isTotal || item.value > 0)
                .map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-2 ${
                      item.isTotal
                        ? "border-t border-slate-200 pt-3 mt-1"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.color && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          item.isTotal
                            ? "font-bold text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`font-display text-sm ${
                        item.isTotal
                          ? "font-bold text-slate-900"
                          : "font-semibold text-slate-700"
                      }`}
                    >
                      {formatNaira(item.value)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Running Costs Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Setup Cost Breakdown</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              How setup funds have been allocated
            </p>
          </CardHeader>
          <CardContent>
            {runningCostsData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={runningCostsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {runningCostsData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatNaira(Number(value))}
                          contentStyle={{
                            background: "#0c1222",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            padding: "8px 14px",
                            fontSize: 13,
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </p>
                      <p className="font-display text-base font-bold text-slate-900">
                        {formatNaira(
                          hostelData.transparency.summary.setup.totalRecorded
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category list */}
                <div className="space-y-2">
                  {runningCostsData.map((cat) => {
                    const total =
                      hostelData.transparency.summary.setup.totalRecorded;
                    const pct = total > 0 ? (cat.value / total) * 100 : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div
                          className="h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="flex-1 text-sm text-slate-600 capitalize">
                          {cat.name}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="font-display text-sm font-semibold text-slate-800 tabular-nums">
                          {formatNaira(cat.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Budget progress */}
                <div className="rounded-xl bg-slate-50 p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Budget Utilization
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {hostelData.transparency.summary.setup.totalBudget > 0
                        ? `${(
                            (hostelData.transparency.summary.setup
                              .totalRecorded /
                              hostelData.transparency.summary.setup
                                .totalBudget) *
                            100
                          ).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-800 animate-progress"
                      style={{
                        width: `${Math.min(
                          (hostelData.transparency.summary.setup.totalRecorded /
                            (hostelData.transparency.summary.setup.totalBudget ||
                              1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                    <span>
                      {formatNaira(
                        hostelData.transparency.summary.setup.totalRecorded
                      )}{" "}
                      spent
                    </span>
                    <span>
                      {formatNaira(
                        hostelData.transparency.summary.setup.remainingBudget
                      )}{" "}
                      remaining
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No setup items recorded"
                description="Setup spending details will appear here once they are logged."
                icon={<Receipt className="h-6 w-6" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Items Table */}
      {hostelData.transparency.setupItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display">Setup Cost Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={setupColumns}
              data={hostelData.transparency.setupItems}
            />
          </CardContent>
        </Card>
      )}

      {/* Capital Contributions Table */}
      {hostelData.transparency.capitalContributions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display">Capital Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={capitalColumns}
              data={hostelData.transparency.capitalContributions}
            />
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-700" />
            <CardTitle className="font-display">Payout History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={payoutColumns}
            data={data.payoutHistory}
            emptyMessage="No payouts recorded yet"
          />
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-display">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={financialColumns}
            data={data.monthlyTrend.slice(0, 6)}
            emptyMessage="No financial data available"
          />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-300 pb-4">
        <Clock className="h-3 w-3" />
        <span>
          Last calculated: {new Date().toLocaleDateString("en-NG")} — All
          figures are based on verified revenue and approved expenses only.
        </span>
      </div>
    </div>
  );
}
