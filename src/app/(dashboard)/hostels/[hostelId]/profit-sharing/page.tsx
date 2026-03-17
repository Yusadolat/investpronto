"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Percent,
  PiggyBank,
  Plus,
  Settings2,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  ArrowDown,
  ShieldCheck,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatNaira } from "@/lib/utils";

interface ProfitConfig {
  companySharePercent: number;
  ownerSharePercent: number;
  investorPoolPercent: number;
  reserveFundPercent: number;
  minimumPayoutAmount: number;
}

interface RecurringCost {
  id: string;
  name: string;
  description: string | null;
  monthlyAmount: number;
  frequency: string;
  isActive: boolean;
}

interface ProfitSharingData {
  config: ProfitConfig;
  recurringCosts: RecurringCost[];
  totalMonthlyRecurringCosts: number;
  investorAgreements: {
    count: number;
    totalShareAllocated: number;
  };
}

const SHARE_COLORS = {
  company: "#3b82f6",
  owner: "#0c1222",
  investors: "#facc15",
  reserve: "#8b5cf6",
};

export default function ProfitSharingPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [data, setData] = React.useState<ProfitSharingData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Editable config state
  const [config, setConfig] = React.useState<ProfitConfig>({
    companySharePercent: 0,
    ownerSharePercent: 0,
    investorPoolPercent: 100,
    reserveFundPercent: 0,
    minimumPayoutAmount: 0,
  });

  // Recurring cost modal
  const [costModalOpen, setCostModalOpen] = React.useState(false);
  const [addingCost, setAddingCost] = React.useState(false);

  // Simulation
  const [simRevenue, setSimRevenue] = React.useState(500000);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hostels/${hostelId}/profit-sharing`);
      if (!res.ok) throw new Error("Failed to load profit sharing config");
      const json = (await res.json()) as ProfitSharingData;
      setData(json);
      setConfig(json.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSharePercent =
    config.companySharePercent +
    config.ownerSharePercent +
    config.investorPoolPercent;

  const isValid = Math.abs(totalSharePercent - 100) < 0.01;

  async function handleSaveConfig() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/hostels/${hostelId}/profit-sharing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save");
      }
      setSuccess("Profit sharing configuration saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingCost(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/hostels/${hostelId}/recurring-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description"),
          monthlyAmount: Number(fd.get("monthlyAmount")),
          frequency: fd.get("frequency") || "monthly",
        }),
      });
      if (!res.ok) throw new Error("Failed to add recurring cost");
      setCostModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add cost");
    } finally {
      setAddingCost(false);
    }
  }

  async function handleToggleCost(cost: RecurringCost) {
    try {
      await fetch(`/api/hostels/${hostelId}/recurring-costs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cost.id, isActive: !cost.isActive }),
      });
      await fetchData();
    } catch {
      setError("Failed to update cost");
    }
  }

  async function handleDeleteCost(id: string) {
    try {
      await fetch(
        `/api/hostels/${hostelId}/recurring-costs?id=${id}`,
        { method: "DELETE" }
      );
      await fetchData();
    } catch {
      setError("Failed to delete cost");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-600">{error || "Failed to load"}</p>
      </div>
    );
  }

  // Simulation calculations
  const simRecurringCosts = data.totalMonthlyRecurringCosts;
  const simOperatingProfit = simRevenue - simRecurringCosts;
  const simReserve = simOperatingProfit * (config.reserveFundPercent / 100);
  const simDistributable = Math.max(0, simOperatingProfit - simReserve);
  const simCompany = simDistributable * (config.companySharePercent / 100);
  const simOwner = simDistributable * (config.ownerSharePercent / 100);
  const simInvestorPool = simDistributable * (config.investorPoolPercent / 100);

  const donutData = [
    { name: "Company", value: config.companySharePercent, color: SHARE_COLORS.company },
    { name: "Owner", value: config.ownerSharePercent, color: SHARE_COLORS.owner },
    { name: "Investors", value: config.investorPoolPercent, color: SHARE_COLORS.investors },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 sm:p-8">
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
          <Link
            href={`/hostels/${hostelId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to hostel
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500">
                  <Percent className="h-5 w-5 text-slate-900" />
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Profit Distribution
                </h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Configure how net profit is split between the company, owner, and investors
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Investors",
                value: String(data.investorAgreements.count),
                color: "text-amber-400",
              },
              {
                label: "Investor Share Allocated",
                value: `${data.investorAgreements.totalShareAllocated}%`,
                color: "text-emerald-400",
              },
              {
                label: "Monthly Recurring",
                value: formatNaira(data.totalMonthlyRecurringCosts),
                color: "text-rose-400",
              },
              {
                label: "Min. Payout",
                value: formatNaira(config.minimumPayoutAmount),
                color: "text-slate-300",
              },
            ].map((metric) => (
              <div key={metric.label}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {metric.label}
                </p>
                <p className={`mt-1 font-display text-lg sm:text-xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 animate-fade-in">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          {success}
        </div>
      )}

      {/* Main grid: Config + Donut on left, Waterfall on right */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sharing Percentages Config — Left 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Settings2 className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="font-display">Sharing Percentages</CardTitle>
                  <p className="mt-0.5 text-sm text-slate-500">Must total exactly 100%</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Visual bar showing the split */}
                <div>
                  <div className="flex h-10 w-full overflow-hidden rounded-xl border border-slate-200">
                    {config.companySharePercent > 0 && (
                      <div
                        className="flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
                        style={{
                          width: `${config.companySharePercent}%`,
                          backgroundColor: SHARE_COLORS.company,
                          minWidth: config.companySharePercent > 3 ? undefined : 0,
                        }}
                      >
                        {config.companySharePercent >= 8 && `${config.companySharePercent}%`}
                      </div>
                    )}
                    {config.ownerSharePercent > 0 && (
                      <div
                        className="flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
                        style={{
                          width: `${config.ownerSharePercent}%`,
                          backgroundColor: SHARE_COLORS.owner,
                          minWidth: config.ownerSharePercent > 3 ? undefined : 0,
                        }}
                      >
                        {config.ownerSharePercent >= 8 && `${config.ownerSharePercent}%`}
                      </div>
                    )}
                    {config.investorPoolPercent > 0 && (
                      <div
                        className="flex items-center justify-center text-[11px] font-bold text-slate-900 transition-all duration-500"
                        style={{
                          width: `${config.investorPoolPercent}%`,
                          backgroundColor: SHARE_COLORS.investors,
                          minWidth: config.investorPoolPercent > 3 ? undefined : 0,
                        }}
                      >
                        {config.investorPoolPercent >= 8 && `${config.investorPoolPercent}%`}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { label: "Company", color: SHARE_COLORS.company },
                        { label: "Owner", color: SHARE_COLORS.owner },
                        { label: "Investors", color: SHARE_COLORS.investors },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] font-medium text-slate-500">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isValid ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {totalSharePercent.toFixed(1)}% / 100%
                    </span>
                  </div>
                </div>

                {/* Percentage inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SHARE_COLORS.company }} />
                      Company (Platform)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={config.companySharePercent}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, companySharePercent: Number(e.target.value) || 0 }))
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm font-display font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SHARE_COLORS.owner }} />
                      Hostel Owner
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={config.ownerSharePercent}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, ownerSharePercent: Number(e.target.value) || 0 }))
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm font-display font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SHARE_COLORS.investors }} />
                      Investor Pool
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={config.investorPoolPercent}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, investorPoolPercent: Number(e.target.value) || 0 }))
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm font-display font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Reserve fund + min payout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
                      Reserve Fund
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={config.reserveFundPercent}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, reserveFundPercent: Number(e.target.value) || 0 }))
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm font-display font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Set aside for maintenance &amp; emergencies (deducted before split)
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Wallet className="h-3.5 w-3.5 text-slate-500" />
                      Minimum Payout
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={config.minimumPayoutAmount}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, minimumPayoutAmount: Number(e.target.value) || 0 }))
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-3 text-sm font-display font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Skip investor payouts below this amount
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!isValid && (
                    <p className="text-sm text-red-500 font-medium">
                      Shares must total 100% (currently {totalSharePercent.toFixed(1)}%)
                    </p>
                  )}
                  <Button onClick={handleSaveConfig} loading={saving} disabled={!isValid}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donut Chart — Right 2 cols */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display">Distribution Split</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {donutData.length > 0 ? (
                <>
                  <div className="relative h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                          animationDuration={800}
                        >
                          {donutData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value}%`}
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
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total
                      </span>
                      <span
                        className={`font-display text-2xl font-bold ${
                          isValid ? "text-slate-900" : "text-red-500"
                        }`}
                      >
                        {totalSharePercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 w-full space-y-2.5">
                    {[
                      {
                        label: "Company (Platform Fee)",
                        value: config.companySharePercent,
                        color: SHARE_COLORS.company,
                        icon: Building2,
                      },
                      {
                        label: "Hostel Owner",
                        value: config.ownerSharePercent,
                        color: SHARE_COLORS.owner,
                        icon: Users,
                      },
                      {
                        label: "Investor Pool",
                        value: config.investorPoolPercent,
                        color: SHARE_COLORS.investors,
                        icon: TrendingUp,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-3 w-3 rounded-md"
                            style={{ backgroundColor: item.color }}
                          />
                          <item.icon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        </div>
                        <span className="font-display text-sm font-bold text-slate-900">
                          {item.value}%
                        </span>
                      </div>
                    ))}
                    {config.reserveFundPercent > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-violet-50 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-3 w-3 rounded-md bg-violet-500" />
                          <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-sm font-medium text-violet-700">Reserve Fund</span>
                        </div>
                        <span className="font-display text-sm font-bold text-violet-900">
                          {config.reserveFundPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 py-8">
                  Set sharing percentages to see the distribution chart
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recurring Costs */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <RefreshCw className="h-4.5 w-4.5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="font-display">Recurring Operational Costs</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                Fixed monthly deductions (Sterling, SaaS subscriptions, etc.)
              </p>
            </div>
          </div>
          <Button onClick={() => setCostModalOpen(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Cost
          </Button>
        </CardHeader>
        <CardContent>
          {data.recurringCosts.length > 0 ? (
            <div className="space-y-3">
              {data.recurringCosts.map((cost) => (
                <div
                  key={cost.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all ${
                    cost.isActive
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        cost.isActive ? "bg-rose-50" : "bg-slate-100"
                      }`}
                    >
                      <Zap className={`h-4 w-4 ${cost.isActive ? "text-rose-500" : "text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{cost.name}</p>
                        {!cost.isActive && <Badge variant="default">Paused</Badge>}
                      </div>
                      {cost.description && (
                        <p className="text-xs text-slate-500 truncate">{cost.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-display text-sm font-bold text-slate-900">
                        {formatNaira(cost.monthlyAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        / month
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCost(cost)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          cost.isActive
                            ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={cost.isActive ? "Pause" : "Resume"}
                      >
                        {cost.isActive ? (
                          <PiggyBank className="h-4 w-4" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                <span className="text-sm font-medium text-slate-300">Total Monthly Deductions</span>
                <span className="font-display text-lg font-bold text-white">
                  {formatNaira(data.totalMonthlyRecurringCosts)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <RefreshCw className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No recurring costs configured</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Add fixed monthly costs like Sterling subscription or SaaS platform fees. These are deducted before profit is distributed.
              </p>
              <Button onClick={() => setCostModalOpen(true)} size="sm" variant="outline" className="mt-4">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add First Cost
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waterfall Simulation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="font-display">Profit Waterfall Preview</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                See how profit flows from revenue to distributions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Revenue slider */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Simulate with net profit of:
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2000000"
                step="10000"
                value={simRevenue}
                onChange={(e) => setSimRevenue(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-slate-200 accent-blue-600 cursor-pointer"
              />
              <span className="font-display text-lg font-bold text-slate-900 min-w-[120px] text-right">
                {formatNaira(simRevenue)}
              </span>
            </div>
          </div>

          {/* Waterfall steps */}
          <div className="space-y-0">
            {/* Net Profit (start) */}
            <WaterfallStep
              label="Net Profit (after expenses)"
              amount={simRevenue}
              color="bg-slate-900"
              textColor="text-white"
              isFirst
            />

            {/* Recurring costs deduction */}
            {simRecurringCosts > 0 && (
              <WaterfallStep
                label="Recurring Costs"
                amount={-simRecurringCosts}
                color="bg-rose-50"
                textColor="text-rose-700"
                borderColor="border-rose-200"
                isDeduction
              />
            )}

            {/* Operating profit */}
            <WaterfallStep
              label="Operating Profit"
              amount={simOperatingProfit}
              color="bg-slate-50"
              textColor="text-slate-900"
              borderColor="border-slate-200"
              isSubtotal
            />

            {/* Reserve fund deduction */}
            {config.reserveFundPercent > 0 && (
              <WaterfallStep
                label={`Reserve Fund (${config.reserveFundPercent}%)`}
                amount={-simReserve}
                color="bg-violet-50"
                textColor="text-violet-700"
                borderColor="border-violet-200"
                isDeduction
              />
            )}

            {/* Distributable */}
            <WaterfallStep
              label="Distributable Profit"
              amount={simDistributable}
              color="bg-emerald-50"
              textColor="text-emerald-800"
              borderColor="border-emerald-200"
              isSubtotal
            />

            {/* Arrow separator */}
            <div className="flex justify-center py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <ArrowDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config.companySharePercent > 0 && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Company
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-blue-900">
                    {formatNaira(simCompany)}
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">{config.companySharePercent}% share</p>
                </div>
              )}

              {config.ownerSharePercent > 0 && (
                <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Users className="h-4 w-4 text-slate-700" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Owner
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-slate-900">
                    {formatNaira(simOwner)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{config.ownerSharePercent}% share</p>
                </div>
              )}

              {config.investorPoolPercent > 0 && (
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      Investor Pool
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-amber-900">
                    {formatNaira(simInvestorPool)}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {config.investorPoolPercent}% share &middot; {data.investorAgreements.count} investors
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Recurring Cost Modal */}
      <Modal
        open={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        title="Add Recurring Cost"
      >
        <form onSubmit={handleAddCost} className="space-y-4">
          <Input label="Cost name" name="name" required placeholder="Sterling Subscription" />
          <Input label="Description" name="description" placeholder="Monthly internet bandwidth subscription" />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly amount"
              name="monthlyAmount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="25000"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
              <select
                name="frequency"
                defaultValue="monthly"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCostModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={addingCost} className="w-full sm:w-auto">
              Add Cost
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function WaterfallStep({
  label,
  amount,
  color,
  textColor,
  borderColor,
  isFirst,
  isDeduction,
  isSubtotal,
}: {
  label: string;
  amount: number;
  color: string;
  textColor: string;
  borderColor?: string;
  isFirst?: boolean;
  isDeduction?: boolean;
  isSubtotal?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${color} ${
        borderColor ? `border ${borderColor}` : ""
      } ${isFirst ? "border-0" : ""} ${isSubtotal ? "font-semibold" : ""}`}
    >
      <div className="flex items-center gap-2">
        {isDeduction && (
          <span className="text-xs font-bold text-rose-400">−</span>
        )}
        <span className={`text-sm ${textColor} ${isFirst || isSubtotal ? "font-semibold" : ""}`}>
          {label}
        </span>
      </div>
      <span
        className={`font-display text-sm font-bold ${textColor} ${
          isFirst ? "text-base" : ""
        }`}
      >
        {isDeduction ? `−${formatNaira(Math.abs(amount))}` : formatNaira(amount)}
      </span>
    </div>
  );
}
