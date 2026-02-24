import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET — list all reports for the current user's agency
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return NextResponse.json({ reports: [] });

  const reports = await db.report.findMany({
    where: { agencyId: membership.agencyId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json({ reports });
}

// POST — create a new draft report
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership)
    return NextResponse.json({ error: "Agency not found." }, { status: 404 });

  const body = await req.json();
  const { clientId, title, periodStart, periodEnd } = body;

  if (!title?.trim())
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!clientId)
    return NextResponse.json({ error: "Client is required." }, { status: 400 });
  if (!periodStart || !periodEnd)
    return NextResponse.json({ error: "Date range is required." }, { status: 400 });

  // Verify client belongs to this agency
  const client = await db.client.findFirst({
    where: { id: clientId, agencyId: membership.agencyId },
  });
  if (!client)
    return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const report = await db.report.create({
    data: {
      agencyId: membership.agencyId,
      clientId,
      title: title.trim(),
      status: "DRAFT",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    },
  });

  await logActivity({
    agencyId: membership.agencyId,
    userId: session.user.id,
    type: "REPORT_CREATED",
    entityId: report.id,
    meta: { reportTitle: report.title, clientName: client.name },
  });

  return NextResponse.json({ report }, { status: 201 });
}
