import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE — disconnect (remove) a data source
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  // Verify data source belongs to a client in this agency
  const dataSource = await db.dataSource.findFirst({
    where: {
      id: params.id,
      client: { agencyId: membership.agencyId },
    },
  });

  if (!dataSource) {
    return NextResponse.json({ error: "Data source not found" }, { status: 404 });
  }

  await db.dataSource.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
