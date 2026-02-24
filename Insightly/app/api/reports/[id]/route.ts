import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

async function getAgencyReport(userId: string, reportId: string) {
  const membership = await db.agencyMember.findFirst({
    where: { userId },
  });
  if (!membership) return null;

  const report = await db.report.findFirst({
    where: { id: reportId, agencyId: membership.agencyId },
    include: {
      client: { select: { id: true, name: true, industry: true, website: true } },
      sections: { orderBy: { order: "asc" } },
    },
  });
  return report;
}

// GET — fetch a single report
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getAgencyReport(session.user.id, params.id);
  if (!report)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  return NextResponse.json({ report });
}

// PATCH — update report title, status, summary
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getAgencyReport(session.user.id, params.id);
  if (!report)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const body = await req.json();
  const { title, status, summary } = body;

  const updated = await db.report.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(status !== undefined && { status }),
      ...(summary !== undefined && { summary }),
    },
  });

  if (status === "SENT") {
    await logActivity({
      agencyId: report.agencyId,
      userId: session.user.id,
      type: "REPORT_SENT",
      entityId: report.id,
      meta: { reportTitle: updated.title, clientName: report.client.name },
    });
  } else {
    await logActivity({
      agencyId: report.agencyId,
      userId: session.user.id,
      type: "REPORT_UPDATED",
      entityId: report.id,
      meta: { reportTitle: updated.title, clientName: report.client.name },
    });
  }

  return NextResponse.json({ report: updated });
}

// DELETE — remove a report
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getAgencyReport(session.user.id, params.id);
  if (!report)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  // Log before delete so we still have the title/client
  await logActivity({
    agencyId: report.agencyId,
    userId: session.user.id,
    type: "REPORT_DELETED",
    entityId: params.id,
    meta: { reportTitle: report.title, clientName: report.client.name },
  });

  await db.report.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
