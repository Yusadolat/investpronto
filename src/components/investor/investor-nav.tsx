"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Building2, LogOut, Briefcase } from "lucide-react";

interface InvestorNavProps {
  user: { name: string; email: string };
}

export function InvestorNav({ user }: InvestorNavProps) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/portal", label: "Portfolio", icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-900 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/portal" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 border border-amber-400/20 transition-colors group-hover:bg-amber-400/25">
            <Building2 className="h-4 w-4 text-amber-400" />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            Invest<span className="text-amber-400">Pronto</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right mr-1">
            <p className="text-sm font-medium text-slate-200 leading-none">{user.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Investor</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 text-xs font-bold text-amber-300">
            {initials}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
    </header>
  );
}
