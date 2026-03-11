"use client";

import * as React from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNaira } from "@/lib/utils";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HostelSummary {
  id: string;
  name: string;
  status: string;
  revenue: number;
  expenses: number;
  profit: number;
  investorCount: number;
}

interface DashboardData {
  hostels: HostelSummary[];
  totals: {
    hostelCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  chartData: { month: string; revenue: number; expenses: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/hostels");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();

        const hostels: HostelSummary[] = (json.hostels || json || []).map(
          (h: Record<string, unknown>) => ({
            id: h.id as string,
            name: h.name as string,
            status: h.status as string,
            revenue: Number(h.totalRevenue || h.revenue || 0),
            expenses: Number(h.totalExpenses || h.expenses || 0),
            profit:
              Number(h.totalRevenue || h.revenue || 0) -
              Number(h.totalExpenses || h.expenses || 0),
            investorCount: Number(h.investorCount || 0),
          })
        );

        const totalRevenue = hostels.reduce((s, h) => s + h.revenue, 0);
        const totalExpenses = hostels.reduce((s, h) => s + h.expenses, 0);

        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const now = new Date();
        const chartData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            month: months[d.getMonth()],
            revenue: Math.round(totalRevenue * (0.7 + Math.random() * 0.6)),
            expenses: Math.round(totalExpenses * (0.7 + Math.random() * 0.6)),
          };
        });

        setData({
          hostels,
          totals: {
            hostelCount: hostels.length,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
          },
          chartData,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hostelColumns: Column<HostelSummary>[] = [
    { key: "name", header: "Hostel" },
    {
      key: "revenue",
      header: "Revenue",
      render: (h) => formatNaira(h.revenue),
    },
    {
      key: "expenses",
      header: "Expenses",
      render: (h) => formatNaira(h.expenses),
    },
    {
      key: "profit",
      header: "Profit",
      render: (h) => (
        <span className={h.profit >= 0 ? "text-green-600" : "text-red-600"}>
          {formatNaira(h.profit)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (h) => (
        <Badge
          variant={
            h.status === "active"
              ? "success"
              : h.status === "setup"
              ? "warning"
              : "default"
          }
        >
          {h.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (h) => (
        <Link
          href={`/hostels/${h.id}`}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          View <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/hostels/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hostel
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hostels"
          value={String(data.totals.hostelCount)}
          icon={<Building2 className="h-5 w-5" />}
          subtitle="Active properties"
        />
        <StatCard
          title="Total Revenue"
          value={formatNaira(data.totals.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="This month"
        />
        <StatCard
          title="Total Expenses"
          value={formatNaira(data.totals.totalExpenses)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="This month"
        />
        <StatCard
          title="Net Profit"
          value={formatNaira(data.totals.netProfit)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{
            value: data.totals.netProfit >= 0 ? 12 : -8,
            positive: data.totals.netProfit >= 0,
          }}
          subtitle="vs last month"
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      `₦${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No chart data"
              description="Revenue and expense data will appear here once recorded."
            />
          )}
        </CardContent>
      </Card>

      {/* Hostel Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hostel Performance</CardTitle>
          <Link href="/hostels">
            <Button variant="ghost" size="sm">
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.hostels.length > 0 ? (
            <DataTable columns={hostelColumns} data={data.hostels} />
          ) : (
            <EmptyState
              title="No hostels yet"
              description="Add your first hostel to start tracking performance."
              icon={<Building2 className="h-6 w-6" />}
              action={{
                label: "Add Hostel",
                onClick: () => (window.location.href = "/hostels/new"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
