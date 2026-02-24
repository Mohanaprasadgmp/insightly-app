import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchGA4Metrics, formatGA4ForPrompt } from "@/lib/ga4";
import { logActivity } from "@/lib/activity";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildMockReport(clientName: string, industry: string | null, period: string): string {
  const ind = industry ?? "digital services";
  return `## Executive Summary

${clientName} delivered a strong performance during ${period}, demonstrating consistent growth across key digital channels. Overall website traffic increased by **18%** month-over-month, while paid media campaigns achieved an average ROAS of **3.4×**, exceeding the target benchmark. The brand's online presence continues to strengthen within the ${ind} sector.

## Key Performance Highlights

- **Website Sessions:** 24,850 sessions — up 18% from the previous period (illustrative figure)
- **Organic Search Traffic:** 9,200 sessions driven by SEO, a 12% increase reflecting improved keyword rankings
- **Paid Search (Google Ads):** 6,100 clicks at an average CPC of $1.42, with a conversion rate of 4.8%
- **Meta Ads:** Reach of 142,000 unique users; 380 link clicks at a CPM of $8.20
- **Email Open Rate:** 27.4% — above the ${ind} industry average of 21%

*Note: Figures above are illustrative placeholders. Live GA4 and Meta Ads integrations will replace these with real data once connected.*

## Channel Performance

**Organic Search** remains the top-performing acquisition channel for ${clientName}, contributing approximately 37% of total sessions. Continued investment in content and on-page SEO is paying off with steady ranking improvements for priority keywords.

**Paid Search** campaigns are operating efficiently within budget. The Search Impression Share of 62% suggests room to increase visibility through bid adjustments or expanded keyword coverage.

**Social Media (Meta)** performance shows strong reach for brand awareness objectives. Engagement rates on organic posts averaged 3.1%, outperforming the ${ind} sector benchmark of 2.4%.

## Insights & Observations

1. **High-intent traffic is converting well** — the 4.8% paid search conversion rate indicates strong landing page relevance. A/B testing new ad creatives could push this above 5.5%.

2. **Organic growth is compounding** — the 12% organic traffic increase reflects keyword rankings improving from positions 8–12 into the top 5 for several target terms. This trend should accelerate in the next 60–90 days.

3. **Audience engagement on social is above benchmark** — this signals strong brand affinity. Retargeting warm audiences from Meta with offer-based creative could capture latent purchase intent.

## Recommended Next Steps

1. **Launch retargeting campaign** targeting website visitors from the past 30 days with a conversion-focused offer on Meta Ads — estimated 20–30% lower CPA than cold audiences.

2. **Expand top-performing keywords** in Google Ads based on search term reports — identify 10–15 high-converting long-tail terms currently receiving impressions but not targeted directly.

3. **Publish 2 supporting blog posts** targeting informational queries in the ${ind} space — this will strengthen topical authority and support the organic ranking momentum observed this period.`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.agencyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership)
    return NextResponse.json({ error: "Agency not found." }, { status: 404 });

  const report = await db.report.findFirst({
    where: { id: params.id, agencyId: membership.agencyId },
    include: { client: true, sections: true },
  });
  if (!report)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const agency = await db.agency.findUnique({ where: { id: membership.agencyId } });

  const startDate = report.periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const endDate = report.periodEnd.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const periodLabel = startDate === endDate ? startDate : `${startDate} – ${endDate}`;

  const clientInfo = [
    `Client: ${report.client.name}`,
    report.client.industry ? `Industry: ${report.client.industry}` : null,
    report.client.website ? `Website: ${report.client.website}` : null,
  ].filter(Boolean).join("\n");

  // Try to fetch real GA4 metrics for this client
  const ga4Metrics = await fetchGA4Metrics(
    report.clientId,
    report.periodStart,
    report.periodEnd
  ).catch(() => null);

  const ga4Section = ga4Metrics
    ? `\n${formatGA4ForPrompt(ga4Metrics)}\n\nIMPORTANT: Use the EXACT numbers above from the real GA4 data in your Key Performance Highlights and Channel Performance sections. Do NOT invent or change these figures.`
    : "\n(No live analytics data connected — use realistic illustrative placeholder figures and clearly note they are estimates.)";

  const prompt = `You are a senior digital marketing analyst writing a professional client performance report for a marketing agency.

Agency: ${agency?.name ?? "Our Agency"}
${clientInfo}
Report Period: ${periodLabel}
${ga4Section}

Write a comprehensive executive summary report for this client covering the reporting period. The report should:

1. **Executive Summary** — A 2-3 sentence overview of overall performance and key highlights.
2. **Key Performance Highlights** — 3-5 bullet points of notable achievements or metrics.
3. **Channel Performance** — Narrative on digital channels (website traffic, paid search, social media) based on the data above.
4. **Insights & Observations** — 2-3 strategic observations about what the data suggests.
5. **Recommended Next Steps** — 3 actionable recommendations for the next reporting period.

Write in a professional, confident tone. Format using markdown with clear section headings.`;

  // Mark report as GENERATING
  await db.report.update({
    where: { id: params.id },
    data: { status: "GENERATING" },
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullText = "";

      try {
        // Stream from OpenAI
        const openaiStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        });

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch {
        // API unavailable — stream mock report word-by-word for the typing effect
        fullText = "";
        const mockText = buildMockReport(
          report.client.name,
          report.client.industry ?? null,
          periodLabel
        );

        const words = mockText.split(/(?<=\s)/);
        for (const word of words) {
          fullText += word;
          controller.enqueue(encoder.encode(word));
          await sleep(18);
        }
      }

      // Save completed summary and mark READY
      await db.report.update({
        where: { id: params.id },
        data: { summary: fullText, status: "READY" },
      });

      await logActivity({
        agencyId: membership.agencyId,
        userId: session.user.id!,
        type: "REPORT_GENERATED",
        entityId: params.id,
        meta: { reportTitle: report.title, clientName: report.client.name },
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
