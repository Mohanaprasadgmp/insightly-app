import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-foreground">Reportiq</span>
              <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">report + intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-300">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered reporting for digital agencies
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Client reports that{" "}
          <span className="text-gradient">write themselves</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Connect your clients&apos; GA4 and Meta Ads accounts. Reportiq fetches the
          data, generates narrative insights with Claude AI, and delivers
          beautiful white-labeled PDF reports — automatically.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup">
            <Button variant="gradient" size="xl">
              Start for free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="xl">
              Sign in to workspace
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          {[
            "Connect GA4 & Meta Ads",
            "AI narrative generation",
            "White-labeled PDF reports",
            "Monthly auto-delivery",
            "Agency team access",
          ].map((feature) => (
            <span
              key={feature}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {feature}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Everything your agency needs
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Automated data sync",
                desc: "Connect GA4 and Meta Ads via OAuth. Data is fetched automatically on a schedule — no manual exports.",
              },
              {
                icon: Sparkles,
                title: "AI narrative insights",
                desc: "Claude analyzes your clients' metrics and writes plain-English explanations of what happened and why.",
              },
              {
                icon: FileText,
                title: "White-labeled PDF reports",
                desc: "Beautiful branded reports with your agency's logo and colors. Clients see your brand, not ours.",
              },
              {
                icon: Shield,
                title: "Review before sending",
                desc: "Edit, approve, or override any AI-generated section before the report reaches your client.",
              },
              {
                icon: Globe,
                title: "Multi-client workspace",
                desc: "Manage all your agency's clients from one dashboard. Scale to hundreds of clients seamlessly.",
              },
              {
                icon: BarChart3,
                title: "Rich data sections",
                desc: "Traffic, paid search, Meta ads, SEO, audience — each section gets its own AI narrative.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-brand-500/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-400" />
            <span className="font-medium">Reportiq</span>
          </div>
          <p>© {new Date().getFullYear()} Reportiq. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
