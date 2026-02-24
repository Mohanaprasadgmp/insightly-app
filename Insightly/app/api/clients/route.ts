import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET — list all clients for the current user's agency
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ clients: [] });
  }

  const clients = await db.client.findMany({
    where: { agencyId: membership.agencyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { dataSources: true } } },
  });

  return NextResponse.json({ clients });
}

// POST — create a new client under the current user's agency
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "Agency not found." }, { status: 404 });
  }

  const body = await req.json();
  const { name, industry, website, contactName, contactEmail } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }

  const client = await db.client.create({
    data: {
      agencyId: membership.agencyId,
      name: name.trim(),
      industry: industry?.trim() || null,
      website: website?.trim() || null,
      contactName: contactName?.trim() || null,
      contactEmail: contactEmail?.trim() || null,
    },
    include: { _count: { select: { dataSources: true } } },
  });

  await logActivity({
    agencyId: membership.agencyId,
    userId: session.user.id,
    type: "CLIENT_CREATED",
    entityId: client.id,
    meta: { clientName: client.name },
  });

  return NextResponse.json({ client }, { status: 201 });
}
