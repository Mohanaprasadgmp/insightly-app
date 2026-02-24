import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { cn, getStatusColor } from "@/lib/utils";
import AIReportCard from "./AIReportCard";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  GENERATING: "Generating…",
  READY: "Ready for review",
  APPROVED: "Approved",
  SENT: "Sent",
  SCHEDULED: "Scheduled",
};

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) notFound();

  const [report, agency] = await Promise.all([
    db.report.findFirst({
      where: { id: params.id, agencyId: membership.agencyId },
      include: {
        client: { select: { name: true, industry: true, website: true, contactEmail: true } },
      },
    }),
    db.agency.findUnique({
      where: { id: membership.agencyId },
      select: { name: true, brandColor: true },
    }),
  ]);
  if (!report) notFound();

  const start = report.periodStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const end = report.periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const periodLabel = `${start} – ${end}`;
  const statusLabel = STATUS_LABELS[report.status] ?? report.status;
  const statusClass = getStatusColor(report.status);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>

      {/* Report header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{report.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {report.client.name}
              {report.client.industry && ` · ${report.client.industry}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {periodLabel}
            </span>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* AI Report Card — handles generation + live streaming */}
      <AIReportCard
        reportId={report.id}
        initialSummary={report.summary}
        initialStatus={report.status}
        reportTitle={report.title}
        clientName={report.client.name}
        clientEmail={report.client.contactEmail ?? null}
        periodLabel={periodLabel}
        agencyName={agency?.name ?? ""}
        brandColor={agency?.brandColor ?? "#6366f1"}
      />
    </div>
  );
}
