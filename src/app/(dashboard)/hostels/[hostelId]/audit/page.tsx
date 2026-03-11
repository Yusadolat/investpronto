"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading";

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

export default function HostelAuditPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [logs, setLogs] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const res = await fetch(`/api/audit?hostelId=${hostelId}&limit=100`);
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        const json = await res.json();
        setLogs(json.auditLogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();
  }, [hostelId]);

  const columns: Column<AuditRow>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (row) => new Date(row.createdAt).toLocaleString("en-NG"),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => <Badge variant="info">{row.action.replace(/_/g, " ")}</Badge>,
    },
    {
      key: "entityType",
      header: "Entity",
      render: (row) => row.entityType.replace(/_/g, " "),
    },
    {
      key: "userName",
      header: "User",
      render: (row) => row.userName || row.userEmail || "System",
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
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chronological record of important hostel actions.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <DataTable columns={columns} data={logs} />
          ) : (
            <EmptyState
              title="No audit logs"
              description="Audit events will appear here when users create or update records."
              icon={<FileText className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
