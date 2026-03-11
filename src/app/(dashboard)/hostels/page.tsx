"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatNaira } from "@/lib/utils";

interface HostelListItem {
  id: string;
  name: string;
  address: string;
  status: string;
  totalSetupCost: string;
  founderContribution: string;
}

export default function HostelsIndexPage() {
  const [hostels, setHostels] = React.useState<HostelListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchHostels() {
      try {
        const res = await fetch("/api/hostels");
        if (!res.ok) throw new Error("Failed to fetch hostels");
        const json = await res.json();
        setHostels(json.hostels || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchHostels();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostels</h1>
          <p className="mt-1 text-sm text-gray-500">
            All hostel business units available in your workspace.
          </p>
        </div>
        <Link href="/hostels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hostel
          </Button>
        </Link>
      </div>

      {hostels.length === 0 ? (
        <EmptyState
          title="No hostels yet"
          description="Create your first hostel to start tracking setup, investors, revenue, and payouts."
          icon={<Building2 className="h-6 w-6" />}
          action={{
            label: "Add Hostel",
            onClick: () => {
              window.location.href = "/hostels/new";
            },
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {hostels.map((hostel) => (
            <Card key={hostel.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{hostel.name}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">{hostel.address}</p>
                </div>
                <Badge
                  variant={
                    hostel.status === "active"
                      ? "success"
                      : hostel.status === "setup"
                        ? "warning"
                        : "default"
                  }
                >
                  {hostel.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Setup Cost</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatNaira(hostel.totalSetupCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Founder Contribution
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatNaira(hostel.founderContribution)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/hostels/${hostel.id}`}>
                    <Button variant="outline" size="sm">
                      Overview
                    </Button>
                  </Link>
                  <Link href={`/hostels/${hostel.id}/investors`}>
                    <Button variant="outline" size="sm">
                      Investors
                    </Button>
                  </Link>
                  <Link
                    href={`/hostels/${hostel.id}`}
                    className="inline-flex items-center text-sm font-medium text-blue-600"
                  >
                    Open hostel <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
