"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatNaira } from "@/lib/utils";

interface InvestorRow {
  id: string;
  name: string;
  email: string;
  amountInvested: number;
  capitalPercentage: number;
  profitSharePercentage: number;
  agreementType: string;
}

interface ExpenseRow {
  id: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  spenderName: string | null;
  status: string;
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
  receiptUrl: string | null;
}

interface CapitalContribution {
  id: string;
  contributorName: string;
  contributorType: "founder" | "cofounder" | "investor" | "other";
  amount: number;
  contributionDate: string;
  linkedInvestorUserId: string | null;
  notes: string | null;
}

interface HostelApiResponse {
  hostel: {
    id: string;
    name: string;
    address: string;
    status: string;
    totalSetupCost: string;
    founderContribution: string;
  };
  dashboard: {
    currentMonthRevenue: number;
    currentMonthExpenses: number;
    currentMonthProfit: number;
    investorCount: number;
    investors: InvestorRow[];
    recentExpenses: ExpenseRow[];
  };
  transparency: {
    summary: {
      setup: {
        totalBudget: number;
        totalRecorded: number;
        oneTimeTotal: number;
        recurringTotal: number;
        remainingBudget: number;
        overBudgetAmount: number;
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

const SETUP_COLORS: Record<string, string> = {
  hardware: "#3b82f6",
  installation: "#8b5cf6",
  bandwidth: "#06b6d4",
  power: "#f59e0b",
  permits: "#10b981",
  security: "#ef4444",
  other: "#6b7280",
};

const CAPITAL_COLORS: Record<string, string> = {
  founder: "#0c1222",
  cofounder: "#1e3a5f",
  investor: "#facc15",
  other: "#94a3b8",
};

const setupCategoryOptions = [
  { label: "Hardware", value: "hardware" },
  { label: "Installation", value: "installation" },
  { label: "Bandwidth", value: "bandwidth" },
  { label: "Power", value: "power" },
  { label: "Permits", value: "permits" },
  { label: "Security", value: "security" },
  { label: "Other", value: "other" },
];

const setupCostTypeOptions = [
  { label: "One-time", value: "one_time" },
  { label: "Recurring", value: "recurring" },
];

const contributorTypeOptions = [
  { label: "Founder", value: "founder" },
  { label: "Co-founder", value: "cofounder" },
  { label: "Investor", value: "investor" },
  { label: "Other", value: "other" },
];

export default function HostelDashboardPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [data, setData] = React.useState<HostelApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = React.useState(false);
  const [contributionModalOpen, setContributionModalOpen] =
    React.useState(false);
  const [submitting, setSubmitting] = React.useState<
    "setup" | "capital" | null
  >(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/hostels/${hostelId}`);
      if (!res.ok) throw new Error("Failed to fetch hostel data");
      const json = (await res.json()) as HostelApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddSetupItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("setup");
    const formData = new FormData(event.currentTarget);
    try {
      const res = await fetch(`/api/hostels/${hostelId}/setup-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          amount: Number(formData.get("amount")),
          costType: formData.get("costType"),
          incurredAt: formData.get("incurredAt"),
          vendor: formData.get("vendor"),
          receiptUrl: formData.get("receiptUrl"),
        }),
      });
      if (!res.ok) throw new Error("Failed to add setup item");
      setSetupModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add setup item"
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAddCapitalContribution(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitting("capital");
    const formData = new FormData(event.currentTarget);
    try {
      const res = await fetch(
        `/api/hostels/${hostelId}/capital-contributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributorName: formData.get("contributorName"),
            contributorType: formData.get("contributorType"),
            amount: Number(formData.get("amount")),
            contributionDate: formData.get("contributionDate"),
            notes: formData.get("notes"),
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to add capital contribution");
      setContributionModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add capital contribution"
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error || "Hostel not found"}</p>
          <Link href="/admin">
            <Button variant="outline" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { hostel, dashboard, transparency } = data;

  const statusConfig: Record<
    string,
    { variant: "success" | "warning" | "default"; label: string }
  > = {
    active: { variant: "success", label: "Live" },
    setup: { variant: "warning", label: "Setup Phase" },
    inactive: { variant: "default", label: "Inactive" },
  };
  const statusInfo = statusConfig[hostel.status] || statusConfig.inactive;

  const setupProgress =
    transparency.summary.setup.totalBudget > 0
      ? Math.min(
          (transparency.summary.setup.totalRecorded /
            transparency.summary.setup.totalBudget) *
            100,
          100
        )
      : 0;

  const capitalProgress =
    transparency.summary.setup.totalBudget > 0
      ? Math.min(
          (transparency.summary.capital.totalContributed /
            transparency.summary.setup.totalBudget) *
            100,
          100
        )
      : 0;

  // Setup items by category for donut chart
  const setupByCategory = transparency.setupItems.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const setupDonutData = Object.entries(setupByCategory).map(
    ([category, amount]) => ({
      name: category.replace(/_/g, " "),
      value: amount,
      color: SETUP_COLORS[category] || "#6b7280",
    })
  );

  // Capital stack data for stacked bar
  const capitalStackData = [
    {
      name: "Founder",
      value:
        transparency.summary.capital.founderCapital +
        transparency.summary.capital.cofounderCapital,
      color: CAPITAL_COLORS.founder,
    },
    {
      name: "Investor",
      value: transparency.summary.capital.investorCapital,
      color: CAPITAL_COLORS.investor,
    },
    {
      name: "Other",
      value: transparency.summary.capital.otherCapital,
      color: CAPITAL_COLORS.other,
    },
  ].filter((d) => d.value > 0);

  const totalCapital = transparency.summary.capital.totalContributed;

  const setupColumns: Column<SetupItem>[] = [
    { key: "title", header: "Item" },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: SETUP_COLORS[item.category] || "#6b7280",
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
      hideOnMobile: true,
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
      key: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      render: (item) => (
        <span className="text-slate-500">{item.vendor || "-"}</span>
      ),
    },
  ];

  const contributionColumns: Column<CapitalContribution>[] = [
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
      hideOnMobile: true,
      render: (item) => {
        const pct =
          transparency.summary.setup.totalBudget > 0
            ? (item.amount / transparency.summary.setup.totalBudget) * 100
            : 0;
        return (
          <span className="font-display font-semibold text-slate-600">
            {pct.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  const investorColumns: Column<InvestorRow>[] = [
    { key: "name", header: "Investor" },
    {
      key: "email",
      header: "Email",
      hideOnMobile: true,
    },
    {
      key: "amountInvested",
      header: "Capital",
      render: (item) => (
        <span className="font-display font-bold">
          {formatNaira(item.amountInvested)}
        </span>
      ),
    },
    {
      key: "profitSharePercentage",
      header: "Profit Share",
      render: (item) => (
        <span className="font-display font-semibold text-emerald-700">
          {item.profitSharePercentage.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "agreementType",
      header: "Agreement",
      hideOnMobile: true,
      render: (item) => (
        <Badge variant="info">{item.agreementType.replace(/_/g, " ")}</Badge>
      ),
    },
  ];

  const expenseColumns: Column<ExpenseRow>[] = [
    {
      key: "spenderName",
      header: "Spent By",
      render: (item) => (
        <span className="font-medium text-slate-900">
          {item.spenderName || "\u2014"}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (item) => (
        <Badge variant="default">{item.category.replace(/_/g, " ")}</Badge>
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
      key: "description",
      header: "Description",
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      hideOnMobile: true,
      render: (item) => (
        <Badge variant={item.status === "approved" ? "success" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 sm:p-8">
        {/* Decorative backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.07),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.05),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {hostel.name}
                </h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <p className="text-sm text-slate-400">{hostel.address}</p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  href: `/hostels/${hostelId}/revenue`,
                  icon: DollarSign,
                  label: "Revenue",
                },
                {
                  href: `/hostels/${hostelId}/expenses`,
                  icon: Receipt,
                  label: "Expenses",
                },
                {
                  href: `/hostels/${hostelId}/investors`,
                  icon: Users,
                  label: "Investors",
                },
                {
                  href: `/hostels/${hostelId}/reports`,
                  icon: BarChart3,
                  label: "Reports",
                },
                {
                  href: `/hostels/${hostelId}/profit-sharing`,
                  icon: TrendingUp,
                  label: "Profit Split",
                },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="flex items-center gap-1.5 rounded-xl bg-white/8 hover:bg-white/12 backdrop-blur-sm border border-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all">
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Key metrics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Monthly Revenue",
                value: formatNaira(dashboard.currentMonthRevenue),
                color: "text-emerald-400",
              },
              {
                label: "Monthly Expenses",
                value: formatNaira(dashboard.currentMonthExpenses),
                color: "text-amber-400",
              },
              {
                label: "Net Profit",
                value: formatNaira(dashboard.currentMonthProfit),
                color:
                  dashboard.currentMonthProfit >= 0
                    ? "text-emerald-400"
                    : "text-rose-400",
              },
              {
                label: "Investors",
                value: String(dashboard.investorCount),
                color: "text-amber-400",
              },
            ].map((metric) => (
              <div key={metric.label}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {metric.label}
                </p>
                <p
                  className={`mt-1 font-display text-lg sm:text-xl font-bold ${metric.color}`}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Setup Budget & Capital Raised — Progress Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Setup Budget */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="font-display">Setup Budget</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {formatNaira(transparency.summary.setup.totalRecorded)} of{" "}
                {formatNaira(transparency.summary.setup.totalBudget)} spent
              </p>
            </div>
            <span className="font-display text-lg font-bold text-slate-900">
              {setupProgress.toFixed(0)}%
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-800 animate-progress"
                style={{ width: `${setupProgress}%` }}
              />
            </div>

            {/* Donut chart if items exist */}
            {setupDonutData.length > 0 && (
              <div className="mt-5 flex items-center gap-4">
                <div className="relative h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={setupDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={48}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {setupDonutData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatNaira(Number(value))}
                        contentStyle={{
                          background: "#0c1222",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          padding: "8px 12px",
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {setupDonutData.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-slate-500 capitalize">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-display text-xs font-bold text-slate-700">
                        {formatNaira(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {setupDonutData.length === 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">One-time</p>
                  <p className="mt-0.5 font-display text-sm font-bold text-slate-900">
                    {formatNaira(transparency.summary.setup.oneTimeTotal)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Recurring</p>
                  <p className="mt-0.5 font-display text-sm font-bold text-slate-900">
                    {formatNaira(transparency.summary.setup.recurringTotal)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capital Raised */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="font-display">Capital Raised</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {formatNaira(transparency.summary.capital.totalContributed)} of{" "}
                {formatNaira(transparency.summary.setup.totalBudget)} target
              </p>
            </div>
            <span className="font-display text-lg font-bold text-slate-900">
              {capitalProgress.toFixed(0)}%
            </span>
          </CardHeader>
          <CardContent>
            {/* Visual Capital Stack Bar */}
            <div className="mb-4">
              <div className="flex h-4 w-full overflow-hidden rounded-full border border-slate-200/80">
                {capitalStackData.map((segment) => {
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
                      title={`${segment.name}: ${formatNaira(segment.value)}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {capitalStackData.map((segment) => (
                  <div
                    key={segment.name}
                    className="flex items-center gap-1.5"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-[11px] font-medium text-slate-500">
                      {segment.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">
                      {totalCapital > 0
                        ? `${((segment.value / totalCapital) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Founders",
                  value:
                    transparency.summary.capital.founderCapital +
                    transparency.summary.capital.cofounderCapital,
                  dot: "bg-slate-900",
                },
                {
                  label: "Investors",
                  value: transparency.summary.capital.investorCapital,
                  dot: "bg-amber-400",
                },
                {
                  label:
                    transparency.summary.capital.fundingGap > 0
                      ? "Funding Gap"
                      : "Excess",
                  value:
                    transparency.summary.capital.fundingGap > 0
                      ? transparency.summary.capital.fundingGap
                      : transparency.summary.capital.excessCapital,
                  dot:
                    transparency.summary.capital.fundingGap > 0
                      ? "bg-amber-500"
                      : "bg-violet-500",
                },
                {
                  label: "Investors",
                  value: dashboard.investorCount,
                  isCount: true,
                  dot: "bg-slate-400",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"
                >
                  <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="font-display text-sm font-bold text-slate-900">
                      {"isCount" in item && item.isCount
                        ? String(item.value)
                        : formatNaira(item.value as number)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Transparency */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display">Setup Transparency</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Line items showing how setup funds were spent
            </p>
          </div>
          <Button
            onClick={() => setSetupModalOpen(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {transparency.setupItems.length > 0 ? (
            <DataTable
              columns={setupColumns}
              data={transparency.setupItems}
            />
          ) : (
            <EmptyState
              title="No setup items recorded"
              description="Add line items so investors can see exactly how setup funds were spent."
              icon={<Receipt className="h-6 w-6" />}
              action={{
                label: "Add Setup Item",
                onClick: () => setSetupModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Capital Stack */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display">Capital Stack</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Who funded the hostel and their capital position
            </p>
          </div>
          <Button
            onClick={() => setContributionModalOpen(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Contribution
          </Button>
        </CardHeader>
        <CardContent>
          {transparency.capitalContributions.length > 0 ? (
            <DataTable
              columns={contributionColumns}
              data={transparency.capitalContributions}
            />
          ) : (
            <EmptyState
              title="No contributions recorded"
              description="Add founder, co-founder, and investor contributions to show the full capital stack."
              icon={<CreditCard className="h-6 w-6" />}
              action={{
                label: "Add Contribution",
                onClick: () => setContributionModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Investors & Expenses Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Investor Stakes</CardTitle>
            <Link href={`/hostels/${hostelId}/investors`}>
              <button className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard.investors.length > 0 ? (
              <DataTable
                columns={investorColumns}
                data={dashboard.investors}
              />
            ) : (
              <EmptyState
                title="No investors yet"
                description="Invite investors to this hostel."
                icon={<Users className="h-6 w-6" />}
                action={{
                  label: "Manage Investors",
                  onClick: () => {
                    window.location.href = `/hostels/${hostelId}/investors`;
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Recent Expenses</CardTitle>
            <Link href={`/hostels/${hostelId}/expenses`}>
              <button className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard.recentExpenses.length > 0 ? (
              <DataTable
                columns={expenseColumns}
                data={dashboard.recentExpenses}
              />
            ) : (
              <EmptyState
                title="No expenses recorded"
                description="Expenses will appear once they are logged."
                icon={<Receipt className="h-6 w-6" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Item Modal */}
      <Modal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Add Setup Item"
      >
        <form onSubmit={handleAddSetupItem} className="space-y-4">
          <Input
            label="Item title"
            name="title"
            required
            placeholder="Core router"
          />
          <Input
            label="Description"
            name="description"
            placeholder="What was purchased and why"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              name="category"
              options={setupCategoryOptions}
              defaultValue="hardware"
              required
            />
            <Select
              label="Cost type"
              name="costType"
              options={setupCostTypeOptions}
              defaultValue="one_time"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Date"
              name="incurredAt"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <Input
            label="Vendor"
            name="vendor"
            placeholder="Supplier or contractor"
          />
          <Input
            label="Receipt URL"
            name="receiptUrl"
            placeholder="https://..."
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSetupModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting === "setup"}
              className="w-full sm:w-auto"
            >
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Capital Contribution Modal */}
      <Modal
        open={contributionModalOpen}
        onClose={() => setContributionModalOpen(false)}
        title="Add Capital Contribution"
      >
        <form onSubmit={handleAddCapitalContribution} className="space-y-4">
          <Input
            label="Contributor name"
            name="contributorName"
            required
            placeholder="Founder or investor name"
          />
          <Select
            label="Contributor type"
            name="contributorType"
            options={contributorTypeOptions}
            defaultValue="founder"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Date"
              name="contributionDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <Input
            label="Notes"
            name="notes"
            placeholder="Optional explanation"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContributionModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting === "capital"}
              className="w-full sm:w-auto"
            >
              Save Contribution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
