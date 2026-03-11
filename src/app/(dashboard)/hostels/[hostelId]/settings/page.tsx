"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

interface HostelSettings {
  id: string;
  name: string;
  address: string;
  totalSetupCost: number;
  founderContribution: number;
  status: string;
}

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Setup", value: "setup" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
];

export default function HostelSettingsPage() {
  const params = useParams();
  const hostelId = params.hostelId as string;

  const [hostel, setHostel] = React.useState<HostelSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    async function fetchHostel() {
      try {
        const res = await fetch(`/api/hostels/${hostelId}`);
        if (!res.ok) throw new Error("Failed to fetch hostel");
        const json = await res.json();
        const h = json.hostel || json;
        setHostel({
          id: h.id,
          name: h.name || "",
          address: h.address || "",
          totalSetupCost: Number(h.totalSetupCost || 0),
          founderContribution: Number(h.founderContribution || 0),
          status: h.status || "active",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchHostel();
  }, [hostelId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      totalSetupCost: Number(formData.get("totalSetupCost")),
      founderContribution: Number(formData.get("founderContribution")),
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch(`/api/hostels/${hostelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !hostel) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!hostel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hostel Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update hostel configuration and details
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>General Settings</CardTitle>
            <p className="text-sm text-gray-500">
              Current status:{" "}
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
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Hostel Name"
              name="name"
              required
              defaultValue={hostel.name}
              placeholder="e.g. Sunrise Hostel"
            />
            <Input
              label="Address"
              name="address"
              defaultValue={hostel.address}
              placeholder="e.g. 10 University Road, Lagos"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Total Setup Cost (₦)"
                name="totalSetupCost"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={hostel.totalSetupCost}
              />
              <Input
                label="Founder Contribution (₦)"
                name="founderContribution"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={hostel.founderContribution}
              />
            </div>
            <Select
              label="Status"
              name="status"
              options={statusOptions}
              defaultValue={hostel.status}
              required
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Settings saved successfully.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
