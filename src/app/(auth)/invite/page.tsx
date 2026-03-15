"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Verifying your invitation...
        </p>
      </div>
    );
  }

  // Invalid state
  if (status === "invalid") {
    return (
      <>
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            InvestPronto
          </span>
        </div>

        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
            This invitation link is invalid or has expired. Please contact the
            person who invited you for a new link.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }

  // Success state
  if (status === "done") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Welcome aboard!
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Your account has been created successfully.
          <br />
          Redirecting to login...
        </p>
        <div className="mt-6">
          <div className="h-1 w-24 mx-auto rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-full bg-emerald-500 rounded-full animate-[progress_2s_ease-in-out]" />
          </div>
        </div>
      </div>
    );
  }

  // Form state
  const roleLabel =
    invitation?.role === "admin"
      ? "Co-Founder"
      : invitation?.role === "operator"
      ? "Operator"
      : "Investor";

  const roleBg =
    invitation?.role === "investor"
      ? "bg-blue-50 border-blue-100 text-blue-700"
      : "bg-emerald-50 border-emerald-100 text-emerald-700";

  return (
    <>
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <Building2 className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">
          InvestPronto
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Accept your invitation
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Set up your account to get started.
        </p>
      </div>

      {/* Invitation details card */}
      <div className="mb-6 rounded-xl bg-slate-50/80 border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/70">
            <Users className="h-4.5 w-4.5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {invitation?.hostelName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Invited by {invitation?.invitedByName}
            </p>
            <span
              className={`inline-flex items-center mt-2 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${roleBg}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAccept} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Create password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={status === "accepting"}
          className="relative w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
        >
          {status === "accepting" ? (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <>
              Accept & Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          Sign in instead
        </button>
      </p>
    </>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      }
    >
      <InviteForm />
    </Suspense>
  );
}
