import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — fetch the current user's agency
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
    include: { agency: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json({ agency: membership.agency });
}

// PATCH — update agency name, website, slug
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, website, slug } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Agency name is required." }, { status: 400 });
  }

  // Find the agency this user owns
  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
  });

  if (!membership) {
    return NextResponse.json({ error: "Agency not found or insufficient permissions." }, { status: 403 });
  }

  // If slug is changing, check it's not taken by another agency
  if (slug) {
    const existing = await db.agency.findFirst({
      where: { slug, NOT: { id: membership.agencyId } },
    });
    if (existing) {
      return NextResponse.json({ error: "This workspace URL is already taken." }, { status: 409 });
    }
  }

  const updated = await db.agency.update({
    where: { id: membership.agencyId },
    data: {
      name: name.trim(),
      website: website?.trim() || null,
      slug: slug?.trim() || undefined,
    },
  });

  return NextResponse.json({ agency: updated });
}
