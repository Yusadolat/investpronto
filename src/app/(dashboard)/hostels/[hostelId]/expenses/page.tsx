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
import { normalizeExpensesResponse } from "@/lib/page-data";
import { Receipt, Plus } from "lucide-react";

interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  approvalStatus: string;
  monthKey: number;
}

const categoryOptions = [
  { label: "Bandwidth", value: "bandwidth" },
  { label: "Power / Fuel", value: "power_fuel" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Staff / Operations", value: "staff_operations" },
  { label: "Device Replacement", value: "device_replacement" },
  { label: "Miscellaneous", value: "miscellaneous" },
];

const categoryBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  bandwidth: "info",
  power_fuel: "warning",
  maintenance: "warning",
  staff_operations: "success",
  device_replacement: "error",
  miscellaneous: "default",
};

const approvalBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

export default function ExpensesPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [entries, setEntries] = React.useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState(getMonthKey());

  const monthOptions = getLastNMonthKeys(12).map((mk) => ({
    label: formatMonthKey(mk),
    value: String(mk),
  }));

  const fetchExpenses = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/expenses?hostelId=${hostelId}&month=${selectedMonth}`
      );
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const json = await res.json();
      setEntries(normalizeExpensesResponse(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId, selectedMonth]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalByCategory = entries.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {}
  );

  const totalExpenses = entries.reduce((s, e) => s + e.amount, 0);

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      hostelId,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      expenseDate: formData.get("expenseDate") as string,
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add expense");
      setModalOpen(false);
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproval(expenseId: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status }),
      });
      if (!res.ok) throw new Error(`Failed to ${status} expense`);
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  const columns: Column<ExpenseEntry>[] = [
    {
      key: "expenseDate",
      header: "Date",
      render: (e) =>
        new Date(e.expenseDate).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <Badge variant={categoryBadgeVariant[e.category] || "default"}>
          {e.category.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (e) => (
        <span className="font-medium">{formatNaira(e.amount)}</span>
      ),
    },
    { key: "description", header: "Description" },
    {
      key: "receiptUrl",
      header: "Receipt",
      render: (e) =>
        e.receiptUrl ? (
          <a
            href={e.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View
          </a>
        ) : (
          <span className="text-sm text-gray-400">None</span>
        ),
    },
    {
      key: "approvalStatus",
      header: "Status",
      render: (e) => (
        <Badge variant={approvalBadgeVariant[e.approvalStatus] || "default"}>
          {e.approvalStatus}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) =>
        e.approvalStatus === "pending" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleApproval(e.id, "approved")}
              className="text-green-600 hover:text-green-800"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleApproval(e.id, "rejected")}
              className="text-red-600 hover:text-red-800"
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage hostel expenses
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
            Add Expense
          </Button>
        </div>
      </div>

      {/* Category Summary Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(totalByCategory).map(([cat, amount]) => (
          <Card key={cat} className="p-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              {cat.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatNaira(amount)}
            </p>
          </Card>
        ))}
        {Object.keys(totalByCategory).length === 0 && !loading && (
          <Card className="col-span-full p-4 text-center text-sm text-gray-500">
            No expenses this month
          </Card>
        )}
      </div>

      {/* Total stat */}
      <StatCard
        title={`Total Expenses - ${formatMonthKey(selectedMonth)}`}
        value={formatNaira(totalExpenses)}
        icon={<Receipt className="h-5 w-5" />}
        subtitle={`${entries.length} entries`}
      />

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Entries</CardTitle>
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
              title="No expenses recorded"
              description="Add your first expense for this month."
              icon={<Receipt className="h-6 w-6" />}
              action={{
                label: "Add Expense",
                onClick: () => setModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Amount (₦)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="e.g. 25000"
          />
          <Select
            label="Category"
            name="category"
            options={categoryOptions}
            required
            placeholder="Select category"
          />
          <Input
            label="Description"
            name="description"
            placeholder="e.g. Plumbing repair"
          />
          <Input
            label="Expense Date"
            name="expenseDate"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
          <Input
            label="Receipt URL (optional)"
            name="receiptUrl"
            type="url"
            placeholder="https://..."
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
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
