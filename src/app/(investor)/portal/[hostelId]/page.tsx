"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatNaira, formatMonthKey } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
  ArrowLeft,
  FileText,
  Clock,
} from "lucide-react";

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

export default function InvestorHostelDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const hostelId = params.hostelId as string;

  const [data, setData] = useState<InvestorData | null>(null);
  const [hostelName, setHostelName] = useState("");
  const [hostelStatus, setHostelStatus] = useState("");
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
          const investorData = await investorRes.json();
          setData(investorData);
        }

        if (hostelRes.ok) {
          const hostelData = await hostelRes.json();
          setHostelName(hostelData.hostel?.name || "Hostel");
          setHostelStatus(hostelData.hostel?.status || "active");
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

  if (!data) {
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

  const chartData = [...data.monthlyTrend].reverse().map((m) => ({
    name: m.monthLabel.replace(/\s\d{4}$/, ""),
    Revenue: m.grossRevenue,
    Expenses: m.totalExpenses,
    Profit: m.netProfit,
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
        row.paidAt
          ? new Date(row.paidAt).toLocaleDateString("en-NG")
          : "-",
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

  const statusVariant =
    hostelStatus === "active"
      ? "success"
      : hostelStatus === "inactive"
      ? "error"
      : "warning";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/portal")}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{hostelName}</h1>
          <Badge variant={statusVariant}>{hostelStatus}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your investment dashboard for this hostel
        </p>
      </div>

      {/* Primary Stats */}
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
          subtitle="Verified expenses only"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          title="Current Month Net Profit"
          value={formatNaira(netProfit)}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Your Share Percentage"
          value={`${agreement?.percentageShare || 0}%`}
          subtitle={`${agreement?.agreementType?.replace("_", " ") || "-"} agreement`}
          icon={<PieChart className="h-5 w-5" />}
        />
        <StatCard
          title="Your Expected Payout"
          value={formatNaira(expectedPayout)}
          subtitle="Based on current month profit"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Agreement Details */}
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
                <p className="text-sm text-gray-500">Percentage</p>
                <p className="mt-1 font-medium text-gray-900">
                  {agreement.percentageShare}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Invested</p>
                <p className="mt-1 font-medium text-gray-900">
                  {new Date(agreement.dateInvested).toLocaleDateString("en-NG")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  variant={agreement.status === "active" ? "success" : "warning"}
                  className="mt-1"
                >
                  {agreement.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Performance Chart */}
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
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(v) =>
                      `${(v / 1000).toFixed(0)}k`
                    }
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

      {/* Payout History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={payoutColumns}
            data={data.payoutHistory as any}
            emptyMessage="No payouts recorded yet"
          />
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={financialColumns}
            data={data.monthlyTrend.slice(0, 6) as any}
            emptyMessage="No financial data available"
          />
        </CardContent>
      </Card>

      {/* Transparency footer */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="h-3 w-3" />
        <span>
          Last calculated: {new Date().toLocaleDateString("en-NG")} — All
          figures are based on verified revenue and approved expenses only.
        </span>
      </div>
    </div>
  );
}
