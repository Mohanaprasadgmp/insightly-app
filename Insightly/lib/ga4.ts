import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GA4Metrics = {
  sessions: number;
  activeUsers: number;
  pageviews: number;
  bounceRate: number;          // 0–1 float
  avgSessionDuration: number;  // seconds
  channels: { name: string; sessions: number; share: number }[];
  topPages: { path: string; views: number }[];
};

type DataSourceRecord = {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  config: unknown;
};

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshAccessToken(dataSource: DataSourceRecord): Promise<string | null> {
  if (!dataSource.refreshToken) return dataSource.accessToken;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: dataSource.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.access_token) return null;

  // Persist the new token
  await db.dataSource.update({
    where: { id: dataSource.id },
    data: {
      accessToken: data.access_token,
      tokenExpiry: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    },
  });

  return data.access_token;
}

// ─── Ensure valid access token ────────────────────────────────────────────────

async function getValidToken(dataSource: DataSourceRecord): Promise<string | null> {
  const isExpired =
    !dataSource.tokenExpiry || dataSource.tokenExpiry < new Date(Date.now() + 60_000);

  if (isExpired) {
    return refreshAccessToken(dataSource);
  }
  return dataSource.accessToken;
}

// ─── GA4 Data API helper ──────────────────────────────────────────────────────

async function runGAReport(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  metrics: string[]
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
        limit: 10,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("GA4 runReport error:", err);
    return null;
  }
  return res.json();
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export async function fetchGA4Metrics(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<GA4Metrics | null> {
  // Find connected GA4 DataSource for this client
  const dataSource = await db.dataSource.findFirst({
    where: { clientId, type: "GOOGLE_ANALYTICS_4", status: "CONNECTED" },
  });
  if (!dataSource) return null;

  const config = dataSource.config as Record<string, string>;
  const propertyId = config?.propertyId;
  if (!propertyId) return null;

  // Get a valid access token (refresh if needed)
  const accessToken = await getValidToken(dataSource);
  if (!accessToken) return null;

  // Format dates as YYYY-MM-DD for the GA4 API
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const startDate = fmt(periodStart);
  const endDate = fmt(periodEnd);

  try {
    // Fetch overview metrics (sessions, users, pageviews, etc.)
    const overviewReport = await runGAReport(
      accessToken,
      propertyId,
      startDate,
      endDate,
      [],
      ["sessions", "activeUsers", "screenPageViews", "bounceRate", "averageSessionDuration"]
    );

    // Fetch channel breakdown
    const channelReport = await runGAReport(
      accessToken,
      propertyId,
      startDate,
      endDate,
      ["sessionDefaultChannelGrouping"],
      ["sessions"]
    );

    // Fetch top pages
    const pagesReport = await runGAReport(
      accessToken,
      propertyId,
      startDate,
      endDate,
      ["pagePath"],
      ["screenPageViews"]
    );

    if (!overviewReport) return null;

    // Parse overview
    const row = overviewReport.rows?.[0];
    const val = (i: number) => parseFloat(row?.metricValues?.[i]?.value ?? "0");

    const sessions = Math.round(val(0));
    const activeUsers = Math.round(val(1));
    const pageviews = Math.round(val(2));
    const bounceRate = val(3);
    const avgSessionDuration = val(4);

    // Parse channel breakdown
    const channels: GA4Metrics["channels"] = [];
    if (channelReport?.rows) {
      const totalSessions = channelReport.rows.reduce(
        (sum: number, r: { metricValues: { value: string }[] }) =>
          sum + parseInt(r.metricValues[0].value, 10),
        0
      );
      for (const r of channelReport.rows) {
        const chSessions = parseInt(r.metricValues[0].value, 10);
        channels.push({
          name: r.dimensionValues[0].value,
          sessions: chSessions,
          share: totalSessions > 0 ? chSessions / totalSessions : 0,
        });
      }
      // Sort descending by sessions
      channels.sort((a, b) => b.sessions - a.sessions);
    }

    // Parse top pages
    const topPages: GA4Metrics["topPages"] = [];
    if (pagesReport?.rows) {
      for (const r of pagesReport.rows.slice(0, 5)) {
        topPages.push({
          path: r.dimensionValues[0].value,
          views: parseInt(r.metricValues[0].value, 10),
        });
      }
    }

    // Update lastSyncedAt
    await db.dataSource.update({
      where: { id: dataSource.id },
      data: { lastSyncedAt: new Date() },
    });

    return { sessions, activeUsers, pageviews, bounceRate, avgSessionDuration, channels, topPages };
  } catch (err) {
    console.error("fetchGA4Metrics error:", err);
    return null;
  }
}

// ─── Format metrics for AI prompt ─────────────────────────────────────────────

export function formatGA4ForPrompt(metrics: GA4Metrics): string {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const num = (n: number) => n.toLocaleString();
  const dur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec}s`;
  };

  const channelLines = metrics.channels
    .slice(0, 5)
    .map((c) => `  - ${c.name}: ${num(c.sessions)} sessions (${pct(c.share)})`)
    .join("\n");

  const pageLines = metrics.topPages
    .map((p) => `  - ${p.path}: ${num(p.views)} views`)
    .join("\n");

  return `
REAL Google Analytics 4 Data (use these exact numbers in your report):
- Total Sessions: ${num(metrics.sessions)}
- Active Users: ${num(metrics.activeUsers)}
- Page Views: ${num(metrics.pageviews)}
- Bounce Rate: ${pct(metrics.bounceRate)}
- Avg. Session Duration: ${dur(metrics.avgSessionDuration)}

Traffic by Channel:
${channelLines || "  - No channel data available"}

Top Pages by Views:
${pageLines || "  - No page data available"}
`.trim();
}
