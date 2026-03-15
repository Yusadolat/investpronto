"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
  hostelId?: string;
  hostelName?: string;
}

export function DashboardLayout({
  children,
  user,
  hostelId,
  hostelName,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        user={user}
        hostelId={hostelId}
        hostelName={hostelName}
      />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pt-[72px] lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
