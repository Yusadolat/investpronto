"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";

interface InvitationDetails {
  email: string;
  hostelName: string;
  role: string;
  invitedByName: string;
}

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "valid" | "invalid" | "accepting" | "done"
  >("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/invitations/verify?token=${token}`);
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        const data = await res.json();
        setInvitation(data);
        setStatus("valid");
      } catch {
        setStatus("invalid");
      }
    }

    verifyToken();
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus("accepting");

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invitation");
        setStatus("valid");
        return;
      }

      setStatus("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("An unexpected error occurred");
      setStatus("valid");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner />
        <p className="text-sm text-gray-500">Verifying invitation...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "done") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome aboard!</CardTitle>
          <CardDescription>
            Your account has been created. Redirecting to login...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">InvestPronto</h1>
        <p className="mt-1 text-sm text-gray-500">Accept Your Invitation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set up your account</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <span className="font-medium text-gray-900">
              {invitation?.hostelName}
            </span>{" "}
            as{" "}
            <span className="font-medium text-gray-900">
              {invitation?.role}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={status === "accepting"}
            >
              Accept Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <InviteForm />
    </Suspense>
  );
}
