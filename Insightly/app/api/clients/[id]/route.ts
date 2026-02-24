import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

async function getAgencyClient(userId: string, clientId: string) {
  const membership = await db.agencyMember.findFirst({
    where: { userId },
  });
  if (!membership) return null;

  const client = await db.client.findFirst({
    where: { id: clientId, agencyId: membership.agencyId },
  });
  return client ? { client, agencyId: membership.agencyId } : null;
}

// GET — fetch a single client
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getAgencyClient(session.user.id, params.id);
  if (!result)
    return NextResponse.json({ error: "Client not found." }, { status: 404 });

  return NextResponse.json({ client: result.client });
}

// PATCH — update client fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getAgencyClient(session.user.id, params.id);
  if (!result)
    return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const body = await req.json();
  const { name, industry, website, contactName, contactEmail } = body;

  const updated = await db.client.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(industry !== undefined && { industry: industry?.trim() || null }),
      ...(website !== undefined && { website: website?.trim() || null }),
      ...(contactName !== undefined && { contactName: contactName?.trim() || null }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null }),
    },
  });

  await logActivity({
    agencyId: result.agencyId,
    userId: session.user.id,
    type: "CLIENT_UPDATED",
    entityId: params.id,
    meta: { clientName: updated.name },
  });

  return NextResponse.json({ client: updated });
}

// DELETE — remove a client
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getAgencyClient(session.user.id, params.id);
  if (!result)
    return NextResponse.json({ error: "Client not found." }, { status: 404 });

  // Log before delete so we still have the name
  await logActivity({
    agencyId: result.agencyId,
    userId: session.user.id,
    type: "CLIENT_DELETED",
    entityId: params.id,
    meta: { clientName: result.client.name },
  });

  await db.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
