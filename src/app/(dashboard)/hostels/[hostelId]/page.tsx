"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatNaira } from "@/lib/utils";

interface InvestorRow {
  id: string;
  name: string;
  email: string;
  amountInvested: number;
  capitalPercentage: number;
  profitSharePercentage: number;
  agreementType: string;
}

interface ExpenseRow {
  id: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  status: string;
}

interface SetupItem {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  costType: "one_time" | "recurring";
  incurredAt: string;
  vendor: string | null;
  receiptUrl: string | null;
}

interface CapitalContribution {
  id: string;
  contributorName: string;
  contributorType: "founder" | "cofounder" | "investor" | "other";
  amount: number;
  contributionDate: string;
  linkedInvestorUserId: string | null;
  notes: string | null;
}

interface HostelApiResponse {
  hostel: {
    id: string;
    name: string;
    address: string;
    status: string;
    totalSetupCost: string;
    founderContribution: string;
  };
  dashboard: {
    currentMonthRevenue: number;
    currentMonthExpenses: number;
    currentMonthProfit: number;
    investorCount: number;
    investors: InvestorRow[];
    recentExpenses: ExpenseRow[];
  };
  transparency: {
    summary: {
      setup: {
        totalBudget: number;
        totalRecorded: number;
        oneTimeTotal: number;
        recurringTotal: number;
        remainingBudget: number;
        overBudgetAmount: number;
      };
      capital: {
        totalContributed: number;
        founderCapital: number;
        cofounderCapital: number;
        investorCapital: number;
        otherCapital: number;
        fundingGap: number;
        excessCapital: number;
      };
    };
    setupItems: SetupItem[];
    capitalContributions: CapitalContribution[];
  };
}

const setupCategoryOptions = [
  { label: "Hardware", value: "hardware" },
  { label: "Installation", value: "installation" },
  { label: "Bandwidth", value: "bandwidth" },
  { label: "Power", value: "power" },
  { label: "Permits", value: "permits" },
  { label: "Security", value: "security" },
  { label: "Other", value: "other" },
];

const setupCostTypeOptions = [
  { label: "One-time", value: "one_time" },
  { label: "Recurring", value: "recurring" },
];

const contributorTypeOptions = [
  { label: "Founder", value: "founder" },
  { label: "Co-founder", value: "cofounder" },
  { label: "Investor", value: "investor" },
  { label: "Other", value: "other" },
];

export default function HostelDashboardPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [data, setData] = React.useState<HostelApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = React.useState(false);
  const [contributionModalOpen, setContributionModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState<"setup" | "capital" | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/hostels/${hostelId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch hostel data");
      }

      const json = (await res.json()) as HostelApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddSetupItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("setup");

    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/hostels/${hostelId}/setup-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          amount: Number(formData.get("amount")),
          costType: formData.get("costType"),
          incurredAt: formData.get("incurredAt"),
          vendor: formData.get("vendor"),
          receiptUrl: formData.get("receiptUrl"),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add setup item");
      }

      setSetupModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add setup item");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAddCapitalContribution(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitting("capital");

    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/hostels/${hostelId}/capital-contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorName: formData.get("contributorName"),
          contributorType: formData.get("contributorType"),
          amount: Number(formData.get("amount")),
          contributionDate: formData.get("contributionDate"),
          notes: formData.get("notes"),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add capital contribution");
      }

      setContributionModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add capital contribution"
      );
    } finally {
      setSubmitting(null);
    }
  }

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
            <Button variant="outline" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { hostel, dashboard, transparency } = data;
  const statusVariant =
    hostel.status === "active"
      ? "success"
      : hostel.status === "setup"
      ? "warning"
      : "default";

  const setupColumns: Column<SetupItem>[] = [
    { key: "title", header: "Item" },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <Badge variant="info">{item.category.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "costType",
      header: "Cost Type",
      render: (item) => (
        <Badge variant={item.costType === "recurring" ? "warning" : "default"}>
          {item.costType === "recurring" ? "Recurring" : "One-time"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => formatNaira(item.amount),
    },
    {
      key: "incurredAt",
      header: "Date",
      render: (item) => new Date(item.incurredAt).toLocaleDateString("en-NG"),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (item) => item.vendor || "-",
    },
  ];

  const contributionColumns: Column<CapitalContribution>[] = [
    { key: "contributorName", header: "Contributor" },
    {
      key: "contributorType",
      header: "Type",
      render: (item) => (
        <Badge variant="default">{item.contributorType.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => formatNaira(item.amount),
    },
    {
      key: "stake",
      header: "Stake",
      render: (item) => {
        const capitalPercentage =
          transparency.summary.setup.totalBudget > 0
            ? (item.amount / transparency.summary.setup.totalBudget) * 100
            : 0;
        return `${capitalPercentage.toFixed(2)}%`;
      },
    },
    {
      key: "contributionDate",
      header: "Date",
      render: (item) =>
        new Date(item.contributionDate).toLocaleDateString("en-NG"),
    },
  ];

  const investorColumns: Column<InvestorRow>[] = [
    { key: "name", header: "Investor" },
    { key: "email", header: "Email" },
    {
      key: "amountInvested",
      header: "Capital",
      render: (item) => formatNaira(item.amountInvested),
    },
    {
      key: "capitalPercentage",
      header: "Capital Stake",
      render: (item) => `${item.capitalPercentage.toFixed(2)}%`,
    },
    {
      key: "profitSharePercentage",
      header: "Profit Share",
      render: (item) => `${item.profitSharePercentage.toFixed(2)}%`,
    },
    {
      key: "agreementType",
      header: "Agreement",
      render: (item) => (
        <Badge variant="info">{item.agreementType.replace(/_/g, " ")}</Badge>
      ),
    },
  ];

  const expenseColumns: Column<ExpenseRow>[] = [
    {
      key: "date",
      header: "Date",
      render: (item) => new Date(item.date).toLocaleDateString("en-NG"),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <Badge variant="default">{item.category.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => formatNaira(item.amount),
    },
    { key: "description", header: "Description" },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.status === "approved" ? "success" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{hostel.name}</h1>
            <Badge variant={statusVariant}>{hostel.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{hostel.address}</p>
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Setup Budget"
          value={formatNaira(transparency.summary.setup.totalBudget)}
          icon={<Building2 className="h-5 w-5" />}
          subtitle="Target project setup cost"
        />
        <StatCard
          title="Recorded Setup Spend"
          value={formatNaira(transparency.summary.setup.totalRecorded)}
          icon={<Receipt className="h-5 w-5" />}
          subtitle="All setup line items"
        />
        <StatCard
          title="Total Capital Raised"
          value={formatNaira(transparency.summary.capital.totalContributed)}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle="Founders + investors"
        />
        <StatCard
          title="Current Month Profit"
          value={formatNaira(dashboard.currentMonthProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Verified revenue minus approved expenses"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="One-time Setup"
          value={formatNaira(transparency.summary.setup.oneTimeTotal)}
          icon={<Wallet className="h-5 w-5" />}
          subtitle="Non-recurring build costs"
        />
        <StatCard
          title="Recurring Setup"
          value={formatNaira(transparency.summary.setup.recurringTotal)}
          icon={<Wallet className="h-5 w-5" />}
          subtitle="Ongoing setup-linked costs"
        />
        <StatCard
          title="Funding Gap"
          value={formatNaira(transparency.summary.capital.fundingGap)}
          icon={<Wallet className="h-5 w-5" />}
          subtitle="Budget minus contributed capital"
        />
        <StatCard
          title="Investors"
          value={String(dashboard.investorCount)}
          icon={<Users className="h-5 w-5" />}
          subtitle="Active investor members"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Setup Transparency</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Every item used to build the hostel network, including one-time and recurring costs.
            </p>
          </div>
          <Button onClick={() => setSetupModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Setup Item
          </Button>
        </CardHeader>
        <CardContent>
          {transparency.setupItems.length > 0 ? (
            <DataTable columns={setupColumns} data={transparency.setupItems} />
          ) : (
            <EmptyState
              title="No setup items recorded"
              description="Add the line items used to build this hostel so investors can see exactly how setup funds were spent."
              icon={<Receipt className="h-6 w-6" />}
              action={{
                label: "Add Setup Item",
                onClick: () => setSetupModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Capital Stack</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Record who funded the hostel so every stakeholder can see their capital position.
            </p>
          </div>
          <Button onClick={() => setContributionModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contribution
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Founder Capital"
              value={formatNaira(transparency.summary.capital.founderCapital)}
              subtitle="Primary founder contribution"
            />
            <StatCard
              title="Co-founder Capital"
              value={formatNaira(transparency.summary.capital.cofounderCapital)}
              subtitle="Co-founder contribution"
            />
            <StatCard
              title="Investor Capital"
              value={formatNaira(transparency.summary.capital.investorCapital)}
              subtitle="External investor funding"
            />
            <StatCard
              title="Excess Capital"
              value={formatNaira(transparency.summary.capital.excessCapital)}
              subtitle="Capital above setup budget"
            />
          </div>

          {transparency.capitalContributions.length > 0 ? (
            <DataTable
              columns={contributionColumns}
              data={transparency.capitalContributions}
            />
          ) : (
            <EmptyState
              title="No capital contributions recorded"
              description="Add founder, co-founder, and investor contributions to show the full capital stack."
              icon={<CreditCard className="h-6 w-6" />}
              action={{
                label: "Add Contribution",
                onClick: () => setContributionModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investor Stake and Profit Share</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.investors.length > 0 ? (
            <DataTable columns={investorColumns} data={dashboard.investors} />
          ) : (
            <EmptyState
              title="No investors yet"
              description="Invite investors to create agreements and expose their stake in the hostel."
              icon={<Users className="h-6 w-6" />}
              action={{
                label: "Manage Investors",
                onClick: () => {
                  window.location.href = `/hostels/${hostelId}/investors`;
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Approved and Pending Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentExpenses.length > 0 ? (
            <DataTable columns={expenseColumns} data={dashboard.recentExpenses} />
          ) : (
            <EmptyState
              title="No expenses recorded"
              description="Monthly operating expenses will show here once they are logged."
              icon={<Receipt className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Add Setup Item"
      >
        <form onSubmit={handleAddSetupItem} className="space-y-4">
          <Input label="Item title" name="title" required placeholder="Core router" />
          <Input
            label="Description"
            name="description"
            placeholder="What was purchased and why"
          />
          <Select
            label="Category"
            name="category"
            options={setupCategoryOptions}
            defaultValue="hardware"
            required
          />
          <Select
            label="Cost type"
            name="costType"
            options={setupCostTypeOptions}
            defaultValue="one_time"
            required
          />
          <Input
            label="Amount (NGN)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Input
            label="Date incurred"
            name="incurredAt"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
          <Input label="Vendor" name="vendor" placeholder="Supplier or contractor" />
          <Input
            label="Receipt URL"
            name="receiptUrl"
            placeholder="https://..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSetupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting === "setup"}>
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={contributionModalOpen}
        onClose={() => setContributionModalOpen(false)}
        title="Add Capital Contribution"
      >
        <form onSubmit={handleAddCapitalContribution} className="space-y-4">
          <Input
            label="Contributor name"
            name="contributorName"
            required
            placeholder="Founder or investor name"
          />
          <Select
            label="Contributor type"
            name="contributorType"
            options={contributorTypeOptions}
            defaultValue="founder"
            required
          />
          <Input
            label="Amount (NGN)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Input
            label="Contribution date"
            name="contributionDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
          <Input
            label="Notes"
            name="notes"
            placeholder="Optional explanation"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContributionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting === "capital"}>
              Save Contribution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
