"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNaira, formatMonthKey } from "@/lib/utils";
import { normalizeMonthlyReportsResponse } from "@/lib/page-data";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyReport {
  monthKey: number;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  expenses: number;
  netProfit: number;
  investorPayouts: number;
}

export default function ReportsPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [reports, setReports] = React.useState<MonthlyReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(
          `/api/reports/monthly?hostelId=${hostelId}&months=12`
        );
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json();
        const items = normalizeMonthlyReportsResponse(json);
        setReports(items.sort((a: MonthlyReport, b: MonthlyReport) => a.monthKey - b.monthKey));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [hostelId]);

  const totalRevenue = reports.reduce((s, r) => s + r.netRevenue, 0);
  const totalExpenses = reports.reduce((s, r) => s + r.expenses, 0);
  const totalProfit = reports.reduce((s, r) => s + r.netProfit, 0);
  const totalPayouts = reports.reduce((s, r) => s + r.investorPayouts, 0);

  const chartData = reports.map((r) => ({
    month: formatMonthKey(r.monthKey).split(" ")[0].slice(0, 3),
    revenue: r.netRevenue,
    expenses: r.expenses,
    profit: r.netProfit,
  }));

  function downloadCSV() {
    const headers = [
      "Month",
      "Gross Revenue",
      "Refunds",
      "Net Revenue",
      "Expenses",
      "Net Profit",
      "Investor Payouts",
    ];
    const rows = reports.map((r) => [
      formatMonthKey(r.monthKey),
      r.grossRevenue,
      r.refunds,
      r.netRevenue,
      r.expenses,
      r.netProfit,
      r.investorPayouts,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hostel-report-${hostelId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const reportColumns: Column<MonthlyReport>[] = [
    {
      key: "monthKey",
      header: "Month",
      render: (r) => formatMonthKey(r.monthKey),
    },
    {
      key: "grossRevenue",
      header: "Gross Revenue",
      render: (r) => formatNaira(r.grossRevenue),
    },
    {
      key: "refunds",
      header: "Refunds",
      render: (r) => (
        <span className="text-red-600">{formatNaira(r.refunds)}</span>
      ),
    },
    {
      key: "netRevenue",
      header: "Net Revenue",
      render: (r) => (
        <span className="font-medium">{formatNaira(r.netRevenue)}</span>
      ),
    },
    {
      key: "expenses",
      header: "Expenses",
      render: (r) => formatNaira(r.expenses),
    },
    {
      key: "netProfit",
      header: "Net Profit",
      render: (r) => (
        <span
          className={
            r.netProfit >= 0
              ? "font-medium text-green-600"
              : "font-medium text-red-600"
          }
        >
          {formatNaira(r.netProfit)}
        </span>
      ),
    },
    {
      key: "investorPayouts",
      header: "Payouts",
      render: (r) => formatNaira(r.investorPayouts),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Financial performance over the last 12 months
          </p>
        </div>
        <Button variant="outline" onClick={downloadCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatNaira(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="12-month total"
        />
        <StatCard
          title="Total Expenses"
          value={formatNaira(totalExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          subtitle="12-month total"
        />
        <StatCard
          title="Net Profit"
          value={formatNaira(totalProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{
            value: totalProfit >= 0 ? 100 : 0,
            positive: totalProfit >= 0,
          }}
        />
        <StatCard
          title="Investor Payouts"
          value={formatNaira(totalPayouts)}
          icon={<BarChart3 className="h-5 w-5" />}
          subtitle="Total distributed"
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Net Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: "#f97316", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No data available"
              description="Reports will appear once revenue and expenses are recorded."
              icon={<BarChart3 className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Profit Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Net Profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No profit data"
              description="Profit trends will display here."
              icon={<TrendingUp className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <DataTable columns={reportColumns} data={reports} />
          ) : (
            <EmptyState
              title="No reports available"
              description="Monthly performance data will appear here."
              icon={<FileText className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
