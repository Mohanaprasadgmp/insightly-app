import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowRight,
  UserPlus,
  Sparkles,
  Send,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActivityType } from "@prisma/client";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; bg: string; label: (meta: Record<string, string>) => string }> = {
  CLIENT_CREATED: {
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    label: (m) => `Client "${m.clientName}" added`,
  },
  CLIENT_UPDATED: {
    icon: Pencil,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    label: (m) => `Client "${m.clientName}" updated`,
  },
  CLIENT_DELETED: {
    icon: Trash2,
    color: "text-red-400",
    bg: "bg-red-500/10",
    label: (m) => `Client "${m.clientName}" deleted`,
  },
  REPORT_CREATED: {
    icon: FileText,
    color: "text-brand-400",
    bg: "bg-brand-500/10",
    label: (m) => `Report created for ${m.clientName}`,
  },
  REPORT_UPDATED: {
    icon: Pencil,
    color: "text-brand-400",
    bg: "bg-brand-500/10",
    label: (m) => `Report updated — ${m.reportTitle}`,
  },
  REPORT_GENERATED: {
    icon: Sparkles,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    label: (m) => `AI report generated — ${m.reportTitle}`,
  },
  REPORT_SENT: {
    icon: Send,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: (m) => `Report sent — ${m.reportTitle}`,
  },
  REPORT_DELETED: {
    icon: Trash2,
    color: "text-red-400",
    bg: "bg-red-500/10",
    label: (m) => `Report deleted — ${m.reportTitle}`,
  },
};

// ─── Quick action cards ───────────────────────────────────────────────────────
const quickActions = [
  {
    title: "Add your first client",
    desc: "Set up a client profile and connect their data sources.",
    href: "/clients",
    cta: "Add client",
  },
  {
    title: "Connect integrations",
    desc: "Link GA4 and Meta Ads to start pulling performance data.",
    href: "/integrations",
    cta: "Connect",
  },
  {
    title: "Generate a report",
    desc: "Let Reportiq fetch data and write AI insights automatically.",
    href: "/reports",
    cta: "New report",
  },
];

export default async function DashboardPage() {
  const session = await auth();

  let clientCount = 0;
  let reportsGenerated = 0;
  let reportsSent = 0;
  let pendingReview = 0;
  let recentActivities: { id: string; type: ActivityType; meta: Record<string, string>; createdAt: Date; entityId: string | null }[] = [];

  if (session?.user?.id) {
    const membership = await db.agencyMember.findFirst({
      where: { userId: session.user.id },
    });

    if (membership) {
      const agencyId = membership.agencyId;
      [clientCount, reportsGenerated, reportsSent, pendingReview, recentActivities] = await Promise.all([
        db.client.count({ where: { agencyId } }),
        db.report.count({ where: { agencyId } }),
        db.report.count({ where: { agencyId, status: "SENT" } }),
        db.report.count({ where: { agencyId, status: "READY" } }),
        db.activity.findMany({
          where: { agencyId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }) as Promise<{ id: string; type: ActivityType; meta: Record<string, string>; createdAt: Date; entityId: string | null }[]>,
      ]);
    }
  }

  const stats = [
    {
      label: "Total Clients",
      value: String(clientCount),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/clients",
    },
    {
      label: "Reports Generated",
      value: String(reportsGenerated),
      icon: FileText,
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      href: "/reports",
    },
    {
      label: "Reports Sent",
      value: String(reportsSent),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/reports",
    },
    {
      label: "Pending Review",
      value: String(pendingReview),
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/reports",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your agency&apos;s reporting workspace
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="group cursor-pointer transition-colors hover:border-brand-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions — shown when workspace is empty */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Get started
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete these steps to start generating automated reports.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, i) => (
                <div
                  key={action.title}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {action.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <Link href={action.href}>
                    <Button variant="outline" size="sm" className="shrink-0">
                      {action.cta}
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  No activity yet.
                  <br />
                  Add a client or generate a report.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivities.map((activity) => {
                  const config = activityConfig[activity.type];
                  const Icon = config.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {config.label(activity.meta)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {timeAgo(new Date(activity.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
