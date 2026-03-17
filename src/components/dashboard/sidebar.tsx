"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Home,
  CreditCard,
  Receipt,
  FileText,
  Menu,
  X,
  BarChart3,
  Percent,
} from "lucide-react";

interface SidebarProps {
  user: { name: string; email: string; role: string };
  hostelId?: string;
  hostelName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar({ user, hostelId, hostelName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const baseGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: <Home className="h-[18px] w-[18px]" />,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Hostels",
          href: "/hostels",
          icon: <Building2 className="h-[18px] w-[18px]" />,
        },
        {
          label: "Investors",
          href: "/investors",
          icon: <Users className="h-[18px] w-[18px]" />,
        },
      ],
    },
  ];

  const hostelGroups: NavGroup[] = hostelId
    ? [
        {
          title: hostelName || "Hostel",
          items: [
            {
              label: "Overview",
              href: `/hostels/${hostelId}`,
              icon: <Home className="h-[18px] w-[18px]" />,
            },
            {
              label: "Revenue",
              href: `/hostels/${hostelId}/revenue`,
              icon: <DollarSign className="h-[18px] w-[18px]" />,
            },
            {
              label: "Expenses",
              href: `/hostels/${hostelId}/expenses`,
              icon: <Receipt className="h-[18px] w-[18px]" />,
            },
            {
              label: "Investors",
              href: `/hostels/${hostelId}/investors`,
              icon: <Users className="h-[18px] w-[18px]" />,
            },
            {
              label: "Payouts",
              href: `/hostels/${hostelId}/payouts`,
              icon: <CreditCard className="h-[18px] w-[18px]" />,
            },
            {
              label: "Profit Sharing",
              href: `/hostels/${hostelId}/profit-sharing`,
              icon: <Percent className="h-[18px] w-[18px]" />,
            },
          ],
        },
        {
          title: "Reports",
          items: [
            {
              label: "Monthly Reports",
              href: `/hostels/${hostelId}/reports`,
              icon: <BarChart3 className="h-[18px] w-[18px]" />,
            },
            {
              label: "Audit Trail",
              href: `/hostels/${hostelId}/audit`,
              icon: <FileText className="h-[18px] w-[18px]" />,
            },
          ],
        },
      ]
    : [];

  const allGroups = [...baseGroups, ...hostelGroups];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const roleBadgeColor =
    user.role === "admin" || user.role === "super_admin"
      ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
      : user.role === "operator"
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
      : "bg-slate-500/15 text-slate-300 border border-slate-500/20";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 backdrop-blur-sm border border-blue-400/20">
          <Building2 className="h-4 w-4 text-blue-400" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          InvestPronto
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {allGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive(item.href)
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Settings link */}
      {hostelId && (
        <div className="border-t border-white/[0.06] px-3 py-2">
          <Link
            href={`/hostels/${hostelId}/settings`}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive(`/hostels/${hostelId}/settings`)
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
        </div>
      )}

      {/* User info */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-semibold text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <span
              className={cn(
                "inline-block mt-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                roleBadgeColor
              )}
            >
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/[0.05] hover:text-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 bg-slate-900/95 backdrop-blur-md px-4 lg:hidden border-b border-white/[0.06]">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 text-slate-300 hover:bg-white/10 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-400/20">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            InvestPronto
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-900 transition-transform duration-300 ease-out lg:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-slate-900">
        {sidebarContent}
      </aside>
    </>
  );
}
