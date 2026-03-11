"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatNaira } from "@/lib/utils";

interface PayoutRow {
  id: string;
  investorName: string;
  investorEmail: string;
  month: number;
  monthLabel: string;
  amount: number;
  status: string;
  paidAt: string | null;
  reference: string | null;
}

export default function HostelPayoutsPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [payouts, setPayouts] = React.useState<PayoutRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const fetchPayouts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/payouts?hostelId=${hostelId}`);
      if (!res.ok) throw new Error("Failed to fetch payouts");
      const json = await res.json();
      setPayouts(json.payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  async function markPaid(payoutId: string) {
    try {
      setUpdatingId(payoutId);
      const res = await fetch(`/api/payouts/${payoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to mark payout as paid");
      await fetchPayouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: Column<PayoutRow>[] = [
    { key: "investorName", header: "Investor" },
    { key: "investorEmail", header: "Email" },
    { key: "monthLabel", header: "Month" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatNaira(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "paid"
              ? "success"
              : row.status === "pending"
                ? "warning"
                : "default"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "pending" ? (
          <Button
            size="sm"
            onClick={() => markPaid(row.id)}
            loading={updatingId === row.id}
          >
            Mark Paid
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track generated payouts and mark pending payouts as paid.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payout Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length > 0 ? (
            <DataTable columns={columns} data={payouts} />
          ) : (
            <EmptyState
              title="No payouts recorded"
              description="Generate or record payouts to see them here."
              icon={<CreditCard className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
