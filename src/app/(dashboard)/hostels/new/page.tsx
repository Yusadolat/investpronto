"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewHostelPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    address: "",
    totalSetupCost: "",
    founderContribution: "",
    organizationName: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.address || !form.totalSetupCost || !form.founderContribution) {
      setError("Please fill in all required fields.");
      return;
    }

    const setupCost = parseFloat(form.totalSetupCost);
    const founderContrib = parseFloat(form.founderContribution);

    if (isNaN(setupCost) || setupCost <= 0) {
      setError("Total setup cost must be a positive number.");
      return;
    }

    if (isNaN(founderContrib) || founderContrib < 0) {
      setError("Founder contribution must be a valid number.");
      return;
    }

    if (founderContrib > setupCost) {
      setError("Founder contribution cannot exceed total setup cost.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          totalSetupCost: setupCost,
          founderContribution: founderContrib,
          organizationName: form.organizationName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create hostel");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/hostels/${data.hostel.id}`);
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Hostel</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hostel Details</CardTitle>
          <CardDescription>
            Set up a new hostel project with its financial structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Hostel Name *"
              type="text"
              placeholder="e.g. Grace Hall - UNILAG"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />

            <Input
              label="Address *"
              type="text"
              placeholder="e.g. University of Lagos, Akoka, Lagos"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              required
            />

            <Input
              label="Total Setup Cost (NGN) *"
              type="number"
              placeholder="e.g. 3000000"
              value={form.totalSetupCost}
              onChange={(e) => updateField("totalSetupCost", e.target.value)}
              required
            />

            <Input
              label="Founder Contribution (NGN) *"
              type="number"
              placeholder="e.g. 1500000"
              value={form.founderContribution}
              onChange={(e) => updateField("founderContribution", e.target.value)}
              required
            />

            <Input
              label="Organization Name (optional)"
              type="text"
              placeholder="e.g. Prontoville Internet Services"
              value={form.organizationName}
              onChange={(e) => updateField("organizationName", e.target.value)}
            />

            <p className="text-xs text-gray-500">
              The remaining amount (setup cost minus founder contribution) is the
              target investor funding. You can invite investors after creating the hostel.
            </p>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                Create Hostel
              </Button>
              <Link href="/admin">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
