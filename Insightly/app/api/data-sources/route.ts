import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — list all data sources for the current user's agency
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ dataSources: [] });
  }

  const dataSources = await db.dataSource.findMany({
    where: { client: { agencyId: membership.agencyId } },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Flatten clientName into each record for easy consumption
  const result = dataSources.map((ds) => ({
    id: ds.id,
    type: ds.type,
    name: ds.name,
    clientName: ds.client.name,
    clientId: ds.clientId,
    status: ds.status,
    lastSyncedAt: ds.lastSyncedAt?.toISOString() ?? null,
    syncError: ds.syncError,
  }));

  return NextResponse.json({ dataSources: result });
}
