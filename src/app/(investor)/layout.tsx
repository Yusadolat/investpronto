import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvestorNav } from "@/components/investor/investor-nav";

export default async function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "investor") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <InvestorNav user={{ name: session.user.name || "Investor", email: session.user.email || "" }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
