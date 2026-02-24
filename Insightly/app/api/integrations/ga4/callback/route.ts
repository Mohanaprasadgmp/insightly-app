import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const REDIRECT_BASE = `${process.env.NEXTAUTH_URL}/integrations`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // User denied consent
  if (errorParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=access_denied`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=invalid_callback`);
  }

  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=unauthorized`);
  }

  // Decode state
  let clientId: string;
  let propertyId: string;
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    clientId = decoded.clientId;
    propertyId = decoded.propertyId ?? "";
  } catch {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=invalid_state`);
  }

  // Verify client belongs to user's agency
  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=no_agency`);
  }

  const client = await db.client.findFirst({
    where: { id: clientId, agencyId: membership.agencyId },
  });
  if (!client) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=client_not_found`);
  }

  // Exchange authorization code for tokens
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/ga4/callback`;

  let access_token: string;
  let refresh_token: string | undefined;
  let expires_in: number;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("GA4 token exchange failed:", tokenData);
      return NextResponse.redirect(`${REDIRECT_BASE}?error=token_exchange_failed`);
    }

    access_token = tokenData.access_token;
    refresh_token = tokenData.refresh_token;
    expires_in = tokenData.expires_in ?? 3600;
  } catch (err) {
    console.error("GA4 token exchange error:", err);
    return NextResponse.redirect(`${REDIRECT_BASE}?error=token_exchange_failed`);
  }

  // Upsert DataSource (create or update if already exists for this client)
  try {
    const existing = await db.dataSource.findFirst({
      where: { clientId, type: "GOOGLE_ANALYTICS_4" },
    });

    const dataSourceData = {
      name: `GA4 — ${client.name}`,
      status: "CONNECTED" as const,
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      tokenExpiry: new Date(Date.now() + expires_in * 1000),
      syncError: null,
      lastSyncedAt: new Date(),
    };

    if (existing) {
      await db.dataSource.update({
        where: { id: existing.id },
        data: { ...dataSourceData, config: { propertyId } },
      });
    } else {
      await db.dataSource.create({
        data: {
          clientId,
          type: "GOOGLE_ANALYTICS_4",
          config: { propertyId },
          ...dataSourceData,
        },
      });
    }
  } catch (err) {
    console.error("GA4 DataSource save error:", err);
    return NextResponse.redirect(`${REDIRECT_BASE}?error=save_failed`);
  }

  return NextResponse.redirect(`${REDIRECT_BASE}?connected=ga4`);
}
