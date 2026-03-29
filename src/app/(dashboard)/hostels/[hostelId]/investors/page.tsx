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
import {
  Users,
  Plus,
  ChevronRight,
  TrendingUp,
  PieChart,
  Mail,
  UserPlus,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";

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

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  inviterName: string;
  hostelName: string;
}

const agreementOptions = [
  { label: "Profit Share", value: "profit_share" },
  { label: "Revenue Share", value: "revenue_share" },
  { label: "Equity", value: "equity" },
  { label: "Custom", value: "custom" },
];

const agreementBadgeVariant: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  profit_share: "info",
  revenue_share: "success",
  equity: "warning",
  custom: "default",
};

const statusBadgeVariant: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  active: "success",
  pending: "warning",
  invited: "info",
  inactive: "default",
};

type InviteTab = "investor" | "cofounder";

export default function InvestorsPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [investors, setInvestors] = React.useState<Investor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedInvestor, setSelectedInvestor] =
    React.useState<Investor | null>(null);
  const [inviteTab, setInviteTab] = React.useState<InviteTab>("investor");
  const [inviteSuccess, setInviteSuccess] = React.useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = React.useState<Invitation[]>([]);
  const [resendingId, setResendingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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

  const fetchInvitations = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/invitations?hostelId=${hostelId}`);
      if (!res.ok) return;
      const json = await res.json();
      setPendingInvitations(json.invitations || []);
    } catch {
      // Non-critical — don't block the page
    }
  }, [hostelId]);

  React.useEffect(() => {
    fetchInvestors();
    fetchInvitations();
  }, [fetchInvestors, fetchInvitations]);

  async function handleInviteInvestor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setInviteSuccess(null);

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
      setInviteSuccess(
        `Invitation sent to ${payload.email}`
      );
      await fetchInvestors();
      await fetchInvitations();
      setTimeout(() => {
        setModalOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite investor"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInviteCofounder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setInviteSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      hostelId,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
    };

    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send invitation");
      setInviteSuccess(
        `Invitation sent to ${payload.email}`
      );
      await fetchInvitations();
      setTimeout(() => {
        setModalOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendInvitation(invitationId: string) {
    setResendingId(invitationId);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resend invitation");
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResendingId(null);
    }
  }

  async function handleDeleteInvitation(invitationId: string) {
    setDeletingId(invitationId);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invitation");
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const totalInvested = investors.reduce(
    (s, inv) => s + inv.amountInvested,
    0
  );
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
          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
        >
          {inv.name}
        </button>
      ),
    },
    {
      key: "email",
      header: "Email",
      hideOnMobile: true,
    },
    {
      key: "amountInvested",
      header: "Invested",
      render: (inv) => (
        <span className="font-semibold text-slate-900">
          {formatNaira(inv.amountInvested)}
        </span>
      ),
    },
    {
      key: "agreementType",
      header: "Agreement",
      hideOnMobile: true,
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
      render: (inv) => (
        <span className="font-medium text-slate-700">{inv.percentageShare}%</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      hideOnMobile: true,
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
          className="text-slate-300 hover:text-slate-500 transition-colors"
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Investors
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage investors and team members
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Investors
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {investors.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Invested
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatNaira(totalInvested)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Share Allocated
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalShareAllocated.toFixed(1)}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(totalShareAllocated, 100)}%`,
              }}
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
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">
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

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {pendingInvitations.map((inv) => {
                const isExpired = new Date(inv.expiresAt) < new Date();
                const isAccepted = !!inv.acceptedAt;
                const roleLabel =
                  inv.role === "investor"
                    ? "Investor"
                    : inv.role === "admin"
                    ? "Co-Founder"
                    : "Operator";

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {inv.email}
                        </span>
                        <Badge
                          variant={
                            inv.role === "investor"
                              ? "info"
                              : inv.role === "admin"
                              ? "success"
                              : "warning"
                          }
                        >
                          {roleLabel}
                        </Badge>
                        {isAccepted ? (
                          <Badge variant="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Accepted
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="error">Expired</Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Invited by {inv.inviterName} on{" "}
                        {new Date(inv.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {!isAccepted && (
                          <>
                            {" "}· Expires{" "}
                            {new Date(inv.expiresAt).toLocaleDateString(
                              "en-NG",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </>
                        )}
                      </p>
                    </div>

                    {!isAccepted && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(inv.id)}
                          loading={resendingId === inv.id}
                          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteInvitation(inv.id)}
                          loading={deletingId === inv.id}
                          className="text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300 hover:bg-rose-50"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal — Tabbed for Investor / Co-Founder */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setInviteSuccess(null);
        }}
        title="Send Invitation"
      >
        {inviteSuccess ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              {inviteSuccess}
            </p>
            <p className="text-xs text-slate-500">
              They will receive an email with instructions to join.
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setInviteTab("investor")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                  inviteTab === "investor"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Investor
              </button>
              <button
                type="button"
                onClick={() => setInviteTab("cofounder")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                  inviteTab === "cofounder"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Co-Founder / Team
              </button>
            </div>

            {inviteTab === "investor" ? (
              <form onSubmit={handleInviteInvestor} className="space-y-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="investor@example.com"
                />
                <Input
                  label="Amount Invested"
                  name="amountInvested"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 5,000,000"
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
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full sm:w-auto"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invite
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleInviteCofounder} className="space-y-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="cofounder@example.com"
                />
                <Select
                  label="Role"
                  name="role"
                  options={[
                    { label: "Co-Founder (Admin)", value: "admin" },
                    { label: "Operator", value: "operator" },
                  ]}
                  required
                  placeholder="Select role"
                />
                <p className="text-xs text-slate-500 leading-relaxed rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <strong className="text-slate-700">Co-Founders</strong> get
                  full admin access to manage this property.{" "}
                  <strong className="text-slate-700">Operators</strong> can log
                  revenue, expenses, and manage daily operations.
                </p>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full sm:w-auto"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invite
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </Modal>

      {/* Investor Detail Modal */}
      <Modal
        open={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        title="Investor Details"
      >
        {selectedInvestor && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-lg font-bold">
                {selectedInvestor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {selectedInvestor.name}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {selectedInvestor.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Amount Invested
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatNaira(selectedInvestor.amountInvested)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Share</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedInvestor.percentageShare}%
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Agreement</p>
                <p className="mt-1">
                  <Badge
                    variant={
                      agreementBadgeVariant[
                        selectedInvestor.agreementType
                      ] || "default"
                    }
                  >
                    {selectedInvestor.agreementType.replace(/_/g, " ")}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Status</p>
                <p className="mt-1">
                  <Badge
                    variant={
                      statusBadgeVariant[selectedInvestor.status] ||
                      "default"
                    }
                  >
                    {selectedInvestor.status}
                  </Badge>
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-slate-500">
                  Date Invested
                </p>
                <p className="mt-1 text-sm text-slate-900">
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
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">
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
