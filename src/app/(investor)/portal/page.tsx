"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import {
  Building2,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  ArrowRight,
  Briefcase,
} from "lucide-react";

interface HostelInvestment {
  id: string;
  name: string;
  status: string;
  amountInvested: number;
  agreementType: string;
  percentageShare: number;
  currentMonthPayout: number;
}

export default function InvestorPortalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [hostels, setHostels] = useState<HostelInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHostels() {
      try {
        const res = await fetch("/api/hostels");
        if (!res.ok) return;
        const data = await res.json();

        const enriched: HostelInvestment[] = [];

        for (const hostel of data.hostels) {
          try {
            const investorRes = await fetch(
              `/api/investors/${session?.user?.id}?hostelId=${hostel.id}`
            );
            if (!investorRes.ok) continue;
            const investorData = await investorRes.json();

            const agreement = investorData.agreements?.[0];
            if (!agreement) continue;

            const currentMonth = investorData.monthlyTrend?.[0];
            const netProfit = currentMonth?.netProfit || 0;
            const payout = netProfit * (agreement.percentageShare / 100);

            enriched.push({
              id: hostel.id,
              name: hostel.name,
              status: hostel.status,
              amountInvested: agreement.amountInvested,
              agreementType: agreement.agreementType,
              percentageShare: agreement.percentageShare,
              currentMonthPayout: Math.max(0, payout),
            });
          } catch {
            // skip hostels where investor data fails
          }
        }

        setHostels(enriched);
      } catch {
        // network error
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchHostels();
    }
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const userName = session?.user?.name?.split(" ")[0] || "Investor";
  const totalInvested = hostels.reduce((s, h) => s + h.amountInvested, 0);
  const totalEstPayouts = hostels.reduce((s, h) => s + h.currentMonthPayout, 0);
  const activeCount = hostels.filter((h) => h.status === "active").length;

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 lg:p-10 mb-8">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.08),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">
              Portfolio Overview
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-md">
            Track your investments, monitor performance, and view your returns across all properties.
          </p>

          {/* Portfolio Metrics */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Total Invested
                </p>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {formatNaira(totalInvested)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Est. Monthly Returns
                </p>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {formatNaira(totalEstPayouts)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Active Investments
                </p>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {activeCount}
                <span className="text-lg text-slate-400 font-normal ml-1">
                  / {hostels.length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Cards */}
      {hostels.length === 0 ? (
        <EmptyState
          title="No investments yet"
          description="You don't have any active investments. Contact an administrator if you believe this is an error."
          icon={<Building2 className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Your Investments
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {hostels.length} {hostels.length === 1 ? "property" : "properties"}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hostels.map((hostel, i) => (
              <div
                key={hostel.id}
                onClick={() => router.push(`/portal/${hostel.id}`)}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)} group relative cursor-pointer rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5`}
              >
                {/* Top accent bar */}
                <div className="h-1 rounded-t-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 border border-slate-900/10">
                        <Building2 className="h-5 w-5 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="font-display text-[15px] font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                          {hostel.name}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
                          {hostel.agreementType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={hostel.status === "active" ? "success" : "warning"}
                    >
                      {hostel.status}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Capital Invested</span>
                      <span className="font-display text-sm font-bold text-slate-900">
                        {formatNaira(hostel.amountInvested)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Profit Share</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 animate-progress"
                            style={{ width: `${Math.min(hostel.percentageShare * 2, 100)}%` }}
                          />
                        </div>
                        <span className="font-display text-sm font-bold text-slate-900">
                          {hostel.percentageShare}%
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-slate-100" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Est. Monthly Payout</span>
                      <span className="flex items-center gap-1 font-display text-sm font-bold text-emerald-600">
                        {hostel.currentMonthPayout > 0 && (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                        {formatNaira(hostel.currentMonthPayout)}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex items-center justify-end">
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
