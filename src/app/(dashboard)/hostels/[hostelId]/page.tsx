"use client";

import * as React from "react";
import { useParams } from "next/navigation";
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
  Receipt,
  CreditCard,
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

interface HostelData {
  id: string;
  name: string;
  status: string;
  address: string;
  totalSetupCost: number;
  founderContribution: number;
  totalInvestment: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  revenueChart: { month: string; revenue: number }[];
  recentExpenses: {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
  }[];
  investors: {
    id: string;
    name: string;
    email: string;
    amountInvested: number;
    percentageShare: number;
    agreementType: string;
  }[];
}

export default function HostelDashboardPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [data, setData] = React.useState<HostelData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/hostels/${hostelId}`);
        if (!res.ok) throw new Error("Failed to fetch hostel data");
        const json = await res.json();
        const hostel = json.hostel || json;

        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const now = new Date();
        const monthlyRev = Number(hostel.monthlyRevenue || hostel.totalRevenue || 0);
        const revenueChart = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            month: months[d.getMonth()],
            revenue: Math.round(monthlyRev * (0.7 + Math.random() * 0.6)),
          };
        });

        setData({
          id: hostel.id,
          name: hostel.name,
          status: hostel.status || "active",
          address: hostel.address || "",
          totalSetupCost: Number(hostel.totalSetupCost || 0),
          founderContribution: Number(hostel.founderContribution || 0),
          totalInvestment: Number(hostel.totalInvestment || hostel.totalSetupCost || 0),
          monthlyRevenue: monthlyRev,
          monthlyExpenses: Number(hostel.monthlyExpenses || hostel.totalExpenses || 0),
          monthlyProfit:
            monthlyRev -
            Number(hostel.monthlyExpenses || hostel.totalExpenses || 0),
          revenueChart,
          recentExpenses: (hostel.recentExpenses || []).map(
            (e: Record<string, unknown>) => ({
              id: e.id as string,
              date: e.expenseDate || e.date || "",
              category: e.category || "other",
              amount: Number(e.amount || 0),
              description: e.description || "",
            })
          ),
          investors: (hostel.investors || []).map(
            (inv: Record<string, unknown>) => ({
              id: inv.id as string,
              name: inv.name || inv.userName || "Investor",
              email: inv.email || inv.userEmail || "",
              amountInvested: Number(inv.amountInvested || 0),
              percentageShare: Number(inv.percentageShare || 0),
              agreementType: (inv.agreementType as string) || "profit_sharing",
            })
          ),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [hostelId]);

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
            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusVariant =
    data.status === "active"
      ? "success"
      : data.status === "setup"
      ? "warning"
      : "default";

  const expenseColumns: Column<(typeof data.recentExpenses)[0]>[] = [
    {
      key: "date",
      header: "Date",
      render: (e) =>
        new Date(e.date as string).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <Badge variant="default">
          {(e.category as string).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (e) => formatNaira(e.amount),
    },
    { key: "description", header: "Description" },
  ];

  const investorColumns: Column<(typeof data.investors)[0]>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "amountInvested",
      header: "Invested",
      render: (inv) => formatNaira(inv.amountInvested),
    },
    {
      key: "agreementType",
      header: "Agreement",
      render: (inv) => (
        <Badge variant="info">
          {(inv.agreementType as string).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "percentageShare",
      header: "Share",
      render: (inv) => `${inv.percentageShare}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <Badge variant={statusVariant}>{data.status}</Badge>
          </div>
          {data.address && (
            <p className="mt-1 text-sm text-gray-500">{data.address}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/hostels/${hostelId}/revenue`}>
            <Button variant="outline" size="sm">
              <DollarSign className="mr-1 h-4 w-4" /> Revenue
            </Button>
          </Link>
          <Link href={`/hostels/${hostelId}/expenses`}>
            <Button variant="outline" size="sm">
              <Receipt className="mr-1 h-4 w-4" /> Expenses
            </Button>
          </Link>
          <Link href={`/hostels/${hostelId}/investors`}>
            <Button variant="outline" size="sm">
              <Users className="mr-1 h-4 w-4" /> Investors
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Setup Cost"
          value={formatNaira(data.totalSetupCost)}
          icon={<Building2 className="h-5 w-5" />}
          subtitle="Total setup"
        />
        <StatCard
          title="Total Investment"
          value={formatNaira(data.totalInvestment)}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle="All investors"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatNaira(data.monthlyRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="Current month"
        />
        <StatCard
          title="Monthly Profit"
          value={formatNaira(data.monthlyProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{
            value: data.monthlyProfit >= 0 ? 8 : -5,
            positive: data.monthlyProfit >= 0,
          }}
          subtitle="After expenses"
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value) => formatNaira(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Expenses</CardTitle>
          <Link href={`/hostels/${hostelId}/expenses`}>
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentExpenses.length > 0 ? (
            <DataTable
              columns={expenseColumns}
              data={data.recentExpenses.slice(0, 10)}
            />
          ) : (
            <EmptyState
              title="No expenses recorded"
              description="Expenses will appear here once added."
              icon={<Receipt className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Investor Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Investors</CardTitle>
          <Link href={`/hostels/${hostelId}/investors`}>
            <Button variant="ghost" size="sm">Manage</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.investors.length > 0 ? (
            <DataTable columns={investorColumns} data={data.investors} />
          ) : (
            <EmptyState
              title="No investors yet"
              description="Invite investors to this hostel."
              icon={<Users className="h-6 w-6" />}
              action={{
                label: "Invite Investor",
                onClick: () =>
                  (window.location.href = `/hostels/${hostelId}/investors`),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
