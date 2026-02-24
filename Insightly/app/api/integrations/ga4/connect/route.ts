import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const propertyId = searchParams.get("propertyId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  // Verify client belongs to user's agency
  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  const client = await db.client.findFirst({
    where: { id: clientId, agencyId: membership.agencyId },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Build Google OAuth URL
  const state = Buffer.from(JSON.stringify({ clientId, propertyId })).toString("base64url");

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/ga4/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(googleAuthUrl);
}
