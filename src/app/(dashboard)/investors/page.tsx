"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";

interface HostelListItem {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function InvestorsIndexPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a hostel to manage its investors and agreements.
        </p>
      </div>

      {hostels.length === 0 ? (
        <EmptyState
          title="No hostels available"
          description="Create a hostel first before managing investors."
          icon={<Users className="h-6 w-6" />}
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
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="h-4 w-4" />
                  Hostel investor management
                </div>
                <Link
                  href={`/hostels/${hostel.id}/investors`}
                  className="inline-flex items-center text-sm font-medium text-blue-600"
                >
                  Open investors <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
