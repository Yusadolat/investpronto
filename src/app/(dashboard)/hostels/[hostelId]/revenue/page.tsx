"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatNaira, getMonthKey, formatMonthKey, getLastNMonthKeys } from "@/lib/utils";
import { DollarSign, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface RevenueEntry {
  id: string;
  amount: number;
  source: string;
  description: string;
  transactionDate: string;
  status: string;
  monthKey: number;
}

const sourceOptions = [
  { label: "Rent", value: "rent" },
  { label: "Service Charge", value: "service_charge" },
  { label: "Deposit", value: "deposit" },
  { label: "Late Fee", value: "late_fee" },
  { label: "Other", value: "other" },
];

const statusOptions = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Refunded", value: "refunded" },
];

const sourceBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  rent: "success",
  service_charge: "info",
  deposit: "warning",
  late_fee: "error",
  other: "default",
};

const statusBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  confirmed: "success",
  pending: "warning",
  refunded: "error",
};

export default function RevenuePage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [entries, setEntries] = React.useState<RevenueEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState(getMonthKey());

  const monthOptions = getLastNMonthKeys(12).map((mk) => ({
    label: formatMonthKey(mk),
    value: String(mk),
  }));

  const fetchRevenue = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/revenue?hostelId=${hostelId}&monthKey=${selectedMonth}`
      );
      if (!res.ok) throw new Error("Failed to fetch revenue data");
      const json = await res.json();
      const items = (json.revenue || json || []).map(
        (r: Record<string, unknown>) => ({
          id: r.id as string,
          amount: Number(r.amount || 0),
          source: (r.source as string) || "other",
          description: (r.description as string) || "",
          transactionDate: (r.transactionDate as string) || "",
          status: (r.status as string) || "confirmed",
          monthKey: Number(r.monthKey || 0),
        })
      );
      setEntries(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId, selectedMonth]);

  React.useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const grossRevenue = entries
    .filter((e) => e.status !== "refunded")
    .reduce((s, e) => s + e.amount, 0);
  const refunds = entries
    .filter((e) => e.status === "refunded")
    .reduce((s, e) => s + e.amount, 0);
  const netRevenue = grossRevenue - refunds;

  async function handleAddRevenue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      hostelId,
      amount: Number(formData.get("amount")),
      source: formData.get("source") as string,
      description: formData.get("description") as string,
      transactionDate: formData.get("transactionDate") as string,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add revenue");
      setModalOpen(false);
      await fetchRevenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add revenue");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<RevenueEntry>[] = [
    {
      key: "transactionDate",
      header: "Date",
      render: (r) =>
        new Date(r.transactionDate).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => (
        <span className="font-medium">{formatNaira(r.amount)}</span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r) => (
        <Badge variant={sourceBadgeVariant[r.source] || "default"}>
          {r.source.replace(/_/g, " ")}
        </Badge>
      ),
    },
    { key: "description", header: "Description" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={statusBadgeVariant[r.status] || "default"}>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage hostel revenue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={monthOptions}
            value={String(selectedMonth)}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-48"
          />
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Revenue
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Gross Revenue"
          value={formatNaira(grossRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle={formatMonthKey(selectedMonth)}
        />
        <StatCard
          title="Refunds"
          value={formatNaira(refunds)}
          icon={<TrendingDown className="h-5 w-5" />}
          subtitle="Total refunded"
        />
        <StatCard
          title="Net Revenue"
          value={formatNaira(netRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{
            value: netRevenue > 0 ? 100 : 0,
            positive: netRevenue > 0,
          }}
        />
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-600">
              {error}
            </div>
          ) : entries.length > 0 ? (
            <DataTable columns={columns} data={entries} />
          ) : (
            <EmptyState
              title="No revenue entries"
              description="Add your first revenue entry for this month."
              icon={<DollarSign className="h-6 w-6" />}
              action={{
                label: "Add Revenue",
                onClick: () => setModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Revenue Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Revenue Entry"
      >
        <form onSubmit={handleAddRevenue} className="space-y-4">
          <Input
            label="Amount (₦)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="e.g. 150000"
          />
          <Select
            label="Source"
            name="source"
            options={sourceOptions}
            required
            placeholder="Select source"
          />
          <Input
            label="Description"
            name="description"
            placeholder="e.g. Room 204 rent payment"
          />
          <Input
            label="Transaction Date"
            name="transactionDate"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
          <Select
            label="Status"
            name="status"
            options={statusOptions}
            required
            defaultValue="confirmed"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Revenue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
