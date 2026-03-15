import { Building2, TrendingUp, Shield, BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand & Value Props (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_60%)]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-sm border border-blue-400/20">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              InvestPronto
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Smart Investment
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Management
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                Track performance, manage investors, and grow your property portfolio with full transparency.
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3">
              {[
                {
                  icon: TrendingUp,
                  title: "Real-time Analytics",
                  desc: "Live revenue tracking and financial insights",
                },
                {
                  icon: Shield,
                  title: "Transparent Operations",
                  desc: "Full audit trail for every transaction",
                },
                {
                  icon: BarChart3,
                  title: "Automated Reports",
                  desc: "Monthly profit distribution and payouts",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <feature.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom testimonial / social proof */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500"].map(
                (bg, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full ${bg} border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white`}
                  >
                    {["AO", "KM", "JD", "NI"][i]}
                  </div>
                )
              )}
            </div>
            <span>Trusted by property managers across Nigeria</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
