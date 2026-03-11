"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { Building2, ArrowRight } from "lucide-react";

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your investment portfolio and performance
        </p>
      </div>

      {hostels.length === 0 ? (
        <EmptyState
          title="No investments yet"
          description="You don't have any active investments. Contact an administrator if you believe this is an error."
          icon={<Building2 className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => (
            <Card
              key={hostel.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/portal/${hostel.id}`)}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge
                    variant={hostel.status === "active" ? "success" : "warning"}
                  >
                    {hostel.status}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                  {hostel.name}
                </h3>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Invested</span>
                    <span className="font-medium text-gray-900">
                      {formatNaira(hostel.amountInvested)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Agreement</span>
                    <span className="font-medium text-gray-900">
                      {hostel.agreementType.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your Share</span>
                    <span className="font-medium text-gray-900">
                      {hostel.percentageShare}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. Payout</span>
                    <span className="font-medium text-green-600">
                      {formatNaira(hostel.currentMonthPayout)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-sm font-medium text-blue-600">
                  View Details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
