"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  PieChart,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatCard } from "@/components/ui/stat-card";
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

export default function InvestorHostelDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const hostelId = params.hostelId as string;

  const [data, setData] = useState<InvestorData | null>(null);
  const [hostelData, setHostelData] = useState<HostelTransparencyResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        const [investorRes, hostelRes] = await Promise.all([
          fetch(`/api/investors/${session.user.id}?hostelId=${hostelId}`),
          fetch(`/api/hostels/${hostelId}`),
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
  const expectedPayout = Math.max(
    0,
    netProfit * ((agreement?.percentageShare || 0) / 100)
  );
  const capitalStake =
    hostelData.transparency.summary.setup.totalBudget > 0
      ? (agreement?.amountInvested || 0) /
        hostelData.transparency.summary.setup.totalBudget
      : 0;

  const chartData = [...data.monthlyTrend].reverse().map((month) => ({
    name: month.monthLabel.replace(/\s\d{4}$/, ""),
    Revenue: month.grossRevenue,
    Expenses: month.totalExpenses,
    Profit: month.netProfit,
  }));

  const payoutColumns: Column<PayoutEntry>[] = [
    { key: "monthLabel", header: "Month" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-medium">{formatNaira(row.amount)}</span>
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
        <span className={row.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
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
          <span className="font-medium text-green-600">
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
        <Badge variant="info">{item.category.replace(/_/g, " ")}</Badge>
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
      render: (item) => formatNaira(item.amount),
    },
    {
      key: "incurredAt",
      header: "Date",
      render: (item) => new Date(item.incurredAt).toLocaleDateString("en-NG"),
    },
  ];

  const capitalColumns: Column<CapitalContribution>[] = [
    { key: "contributorName", header: "Contributor" },
    {
      key: "contributorType",
      header: "Type",
      render: (item) => (
        <Badge variant="default">{item.contributorType.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => formatNaira(item.amount),
    },
    {
      key: "stake",
      header: "Stake",
      render: (item) => {
        const stake =
          hostelData.transparency.summary.setup.totalBudget > 0
            ? (item.amount / hostelData.transparency.summary.setup.totalBudget) * 100
            : 0;
        return `${stake.toFixed(2)}%`;
      },
    },
  ];

  const statusVariant =
    hostelData.hostel.status === "active"
      ? "success"
      : hostelData.hostel.status === "inactive"
      ? "error"
      : "warning";

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push("/portal")}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {hostelData.hostel.name}
          </h1>
          <Badge variant={statusVariant}>{hostelData.hostel.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your investment dashboard for this hostel
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invested"
          value={formatNaira(agreement?.amountInvested || 0)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Current Month Revenue"
          value={formatNaira(grossRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Current Month Expenses"
          value={formatNaira(totalExpenses)}
          subtitle="Approved expenses only"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          title="Current Month Net Profit"
          value={formatNaira(netProfit)}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Capital Stake"
          value={`${(capitalStake * 100).toFixed(2)}%`}
          subtitle="Based on setup budget"
          icon={<PieChart className="h-5 w-5" />}
        />
        <StatCard
          title="Profit Share"
          value={`${agreement?.percentageShare || 0}%`}
          subtitle={`${agreement?.agreementType?.replace("_", " ") || "-"} agreement`}
          icon={<PieChart className="h-5 w-5" />}
        />
        <StatCard
          title="Expected Payout"
          value={formatNaira(expectedPayout)}
          subtitle="Based on current month profit"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Setup Budget"
          value={formatNaira(hostelData.transparency.summary.setup.totalBudget)}
          subtitle="Total project setup cost"
          icon={<Receipt className="h-5 w-5" />}
        />
      </div>

      {agreement && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <CardTitle>Agreement Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="mt-1 font-medium text-gray-900">
                  {agreement.agreementType.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Profit Share</p>
                <p className="mt-1 font-medium text-gray-900">
                  {agreement.percentageShare}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capital Stake</p>
                <p className="mt-1 font-medium text-gray-900">
                  {(capitalStake * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Invested</p>
                <p className="mt-1 font-medium text-gray-900">
                  {new Date(agreement.dateInvested).toLocaleDateString("en-NG")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
                    labelStyle={{ color: "#111827" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Setup Spend Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Recorded Spend"
              value={formatNaira(hostelData.transparency.summary.setup.totalRecorded)}
              subtitle="All setup items logged"
            />
            <StatCard
              title="One-time Setup"
              value={formatNaira(hostelData.transparency.summary.setup.oneTimeTotal)}
              subtitle="Non-recurring purchases"
            />
            <StatCard
              title="Recurring Setup"
              value={formatNaira(hostelData.transparency.summary.setup.recurringTotal)}
              subtitle="Ongoing setup-linked costs"
            />
            <StatCard
              title="Budget Remaining"
              value={formatNaira(hostelData.transparency.summary.setup.remainingBudget)}
              subtitle="Unspent setup budget"
            />
          </div>

          {hostelData.transparency.setupItems.length > 0 ? (
            <DataTable
              columns={setupColumns}
              data={hostelData.transparency.setupItems}
            />
          ) : (
            <EmptyState
              title="No setup items recorded"
              description="Setup spending details will appear here once they are logged."
              icon={<Receipt className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Capital Stack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Founder Capital"
              value={formatNaira(hostelData.transparency.summary.capital.founderCapital)}
              subtitle="Primary founder funding"
            />
            <StatCard
              title="Co-founder Capital"
              value={formatNaira(
                hostelData.transparency.summary.capital.cofounderCapital
              )}
              subtitle="Co-founder funding"
            />
            <StatCard
              title="Investor Capital"
              value={formatNaira(hostelData.transparency.summary.capital.investorCapital)}
              subtitle="External investor funding"
            />
            <StatCard
              title="Total Capital Raised"
              value={formatNaira(
                hostelData.transparency.summary.capital.totalContributed
              )}
              subtitle="All contributions combined"
            />
          </div>

          {hostelData.transparency.capitalContributions.length > 0 ? (
            <DataTable
              columns={capitalColumns}
              data={hostelData.transparency.capitalContributions}
            />
          ) : (
            <EmptyState
              title="No capital contributions recorded"
              description="Capital contribution records will appear here once they are logged."
              icon={<Wallet className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={payoutColumns}
            data={data.payoutHistory}
            emptyMessage="No payouts recorded yet"
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={financialColumns}
            data={data.monthlyTrend.slice(0, 6)}
            emptyMessage="No financial data available"
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="h-3 w-3" />
        <span>
          Last calculated: {new Date().toLocaleDateString("en-NG")} - All
          figures are based on verified revenue and approved expenses only.
        </span>
      </div>
    </div>
  );
}
