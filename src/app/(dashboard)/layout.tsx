import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { name?: string | null; email?: string | null; role?: string; id?: string };
  const role = user.role || "admin";

  if (role === "investor") {
    redirect("/portal");
  }

  return (
    <DashboardLayout
      user={{
        name: user.name || "User",
        email: user.email || "",
        role: role,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
