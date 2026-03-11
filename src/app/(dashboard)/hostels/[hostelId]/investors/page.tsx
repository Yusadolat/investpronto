"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatNaira } from "@/lib/utils";
import { normalizeInvestorsResponse } from "@/lib/page-data";
import { Users, Plus, ChevronRight } from "lucide-react";

interface Investor {
  id: string;
  userId: string;
  name: string;
  email: string;
  amountInvested: number;
  dateInvested: string;
  agreementType: string;
  percentageShare: number;
  status: string;
  notes: string;
}

const agreementOptions = [
  { label: "Profit Share", value: "profit_share" },
  { label: "Revenue Share", value: "revenue_share" },
  { label: "Equity", value: "equity" },
  { label: "Custom", value: "custom" },
];

const agreementBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  profit_share: "info",
  revenue_share: "success",
  equity: "warning",
  custom: "default",
};

const statusBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  active: "success",
  pending: "warning",
  invited: "info",
  inactive: "default",
};

export default function InvestorsPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [investors, setInvestors] = React.useState<Investor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedInvestor, setSelectedInvestor] = React.useState<Investor | null>(null);

  const fetchInvestors = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/investors?hostelId=${hostelId}`);
      if (!res.ok) throw new Error("Failed to fetch investors");
      const json = await res.json();
      setInvestors(normalizeInvestorsResponse(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      hostelId,
      email: formData.get("email") as string,
      amountInvested: Number(formData.get("amountInvested")),
      dateInvested: formData.get("dateInvested") as string,
      agreementType: formData.get("agreementType") as string,
      percentageShare: Number(formData.get("percentageShare")),
      notes: formData.get("notes") as string,
    };

    try {
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to invite investor");
      setModalOpen(false);
      await fetchInvestors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite investor");
    } finally {
      setSubmitting(false);
    }
  }

  const totalInvested = investors.reduce((s, inv) => s + inv.amountInvested, 0);
  const totalShareAllocated = investors.reduce(
    (s, inv) => s + inv.percentageShare,
    0
  );

  const columns: Column<Investor>[] = [
    {
      key: "name",
      header: "Name",
      render: (inv) => (
        <button
          onClick={() => setSelectedInvestor(inv)}
          className="font-medium text-gray-900 hover:text-blue-600"
        >
          {inv.name}
        </button>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "amountInvested",
      header: "Invested",
      render: (inv) => (
        <span className="font-medium">{formatNaira(inv.amountInvested)}</span>
      ),
    },
    {
      key: "agreementType",
      header: "Agreement",
      render: (inv) => (
        <Badge
          variant={agreementBadgeVariant[inv.agreementType] || "default"}
        >
          {inv.agreementType.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "percentageShare",
      header: "Share",
      render: (inv) => `${inv.percentageShare}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (inv) => (
        <Badge variant={statusBadgeVariant[inv.status] || "default"}>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (inv) => (
        <button
          onClick={() => setSelectedInvestor(inv)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage investors and their agreements
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Investor
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-500">Total Investors</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {investors.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-500">Total Invested</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatNaira(totalInvested)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-500">Share Allocated</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalShareAllocated.toFixed(1)}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(totalShareAllocated, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Investors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Investors</CardTitle>
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
          ) : investors.length > 0 ? (
            <DataTable columns={columns} data={investors} />
          ) : (
            <EmptyState
              title="No investors yet"
              description="Invite investors to participate in this hostel."
              icon={<Users className="h-6 w-6" />}
              action={{
                label: "Invite Investor",
                onClick: () => setModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite Investor"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="investor@example.com"
          />
          <Input
            label="Amount Invested (₦)"
            name="amountInvested"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="e.g. 5000000"
          />
          <Input
            label="Date Invested"
            name="dateInvested"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
          <Select
            label="Agreement Type"
            name="agreementType"
            options={agreementOptions}
            required
            placeholder="Select agreement"
          />
          <Input
            label="Percentage Share (%)"
            name="percentageShare"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            placeholder="e.g. 20"
          />
          <Input
            label="Notes (optional)"
            name="notes"
            placeholder="Additional notes..."
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
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Investor Detail Modal */}
      <Modal
        open={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        title="Investor Details"
      >
        {selectedInvestor && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-lg font-bold">
                {selectedInvestor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedInvestor.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedInvestor.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Amount Invested
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatNaira(selectedInvestor.amountInvested)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Share
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedInvestor.percentageShare}%
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Agreement
                </p>
                <p className="mt-1">
                  <Badge
                    variant={
                      agreementBadgeVariant[selectedInvestor.agreementType] ||
                      "default"
                    }
                  >
                    {selectedInvestor.agreementType.replace(/_/g, " ")}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <Badge
                    variant={
                      statusBadgeVariant[selectedInvestor.status] || "default"
                    }
                  >
                    {selectedInvestor.status}
                  </Badge>
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500">
                  Date Invested
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedInvestor.dateInvested
                    ? new Date(
                        selectedInvestor.dateInvested
                      ).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
              {selectedInvestor.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedInvestor.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedInvestor(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
