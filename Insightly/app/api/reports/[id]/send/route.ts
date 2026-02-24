import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendReportEmail } from "@/lib/mailer";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [report, agency] = await Promise.all([
    db.report.findFirst({
      where: { id: params.id, agencyId: membership.agencyId },
      include: {
        client: {
          select: { name: true, contactEmail: true },
        },
      },
    }),
    db.agency.findUnique({
      where: { id: membership.agencyId },
      select: { name: true, brandColor: true },
    }),
  ]);

  if (!report)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  if (!["APPROVED", "READY"].includes(report.status))
    return NextResponse.json(
      { error: "Report must be Approved or Ready before sending." },
      { status: 400 }
    );

  if (!report.summary)
    return NextResponse.json(
      { error: "Report has no generated content to send." },
      { status: 400 }
    );

  if (!report.client.contactEmail)
    return NextResponse.json(
      { error: "No contact email set for this client. Add one in the client settings." },
      { status: 400 }
    );

  const start = report.periodStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const end = report.periodEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await sendReportEmail({
    to: report.client.contactEmail,
    reportTitle: report.title,
    clientName: report.client.name,
    periodLabel: `${start} – ${end}`,
    summary: report.summary,
    agencyName: agency?.name ?? "Your Agency",
    brandColor: agency?.brandColor ?? "#6366f1",
  });

  const updated = await db.report.update({
    where: { id: params.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      recipientEmails: [report.client.contactEmail],
    },
  });

  await logActivity({
    agencyId: membership.agencyId,
    userId: session.user.id,
    type: "REPORT_SENT",
    entityId: params.id,
    meta: { reportTitle: updated.title, clientName: report.client.name },
  });

  return NextResponse.json({ success: true });
}
