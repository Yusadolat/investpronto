"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  Settings,
  LogOut,
  Home,
  CreditCard,
  Receipt,
  FileText,
  Menu,
  X,
  BarChart3,
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
        { label: "Dashboard", href: "/admin", icon: <Home className="h-5 w-5" /> },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Hostels", href: "/hostels", icon: <Building2 className="h-5 w-5" /> },
        { label: "Investors", href: "/investors", icon: <Users className="h-5 w-5" /> },
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
              icon: <Home className="h-5 w-5" />,
            },
            {
              label: "Revenue",
              href: `/hostels/${hostelId}/revenue`,
              icon: <DollarSign className="h-5 w-5" />,
            },
            {
              label: "Expenses",
              href: `/hostels/${hostelId}/expenses`,
              icon: <Receipt className="h-5 w-5" />,
            },
            {
              label: "Investors",
              href: `/hostels/${hostelId}/investors`,
              icon: <Users className="h-5 w-5" />,
            },
            {
              label: "Payouts",
              href: `/hostels/${hostelId}/payouts`,
              icon: <CreditCard className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Reports",
          items: [
            {
              label: "Monthly Reports",
              href: `/hostels/${hostelId}/reports`,
              icon: <BarChart3 className="h-5 w-5" />,
            },
            {
              label: "Audit Trail",
              href: `/hostels/${hostelId}/audit`,
              icon: <FileText className="h-5 w-5" />,
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
    user.role === "admin"
      ? "bg-blue-500/20 text-blue-300"
      : user.role === "manager"
      ? "bg-green-500/20 text-green-300"
      : "bg-gray-500/20 text-gray-300";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold text-white">InvestPronto</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {allGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
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
        <div className="border-t border-gray-800 px-3 py-2">
          <Link
            href={`/hostels/${hostelId}/settings`}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(`/hostels/${hostelId}/settings`)
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      )}

      {/* User info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <span
              className={cn(
                "inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                roleBadgeColor
              )}
            >
              {user.role}
            </span>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST" className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 p-2 text-white shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-1 text-gray-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-gray-900">
        {sidebarContent}
      </aside>
    </>
  );
}
