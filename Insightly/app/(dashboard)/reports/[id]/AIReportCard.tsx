"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Loader2, AlertCircle, RefreshCw, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Single dynamic import — both PDFDownloadLink + ReportPDFDocument load together,
// preventing the "reading 'stack'" crash from two separate async imports racing each other
const PDFDownloadButton = dynamic(
  () => import("@/components/reports/PDFDownloadButton").then((m) => m.PDFDownloadButton),
  { ssr: false, loading: () => null }
);

// Render markdown-ish text: bold headers, bullet points, inline bold
function ReportNarrative({ summary }: { summary: string }) {
  const lines = summary.split("\n");
  return (
    <div className="prose prose-sm prose-invert max-w-none space-y-1 text-sm leading-relaxed text-foreground">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <h2 key={i} className="mt-5 text-base font-semibold text-foreground first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("# "))
          return <h1 key={i} className="mt-4 text-lg font-bold text-foreground first:mt-0">{line.slice(2)}</h1>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ") || line.startsWith("• "))
          return <li key={i} className="ml-4 list-disc text-muted-foreground">{line.slice(2)}</li>;
        if (line.trim() === "")
          return <div key={i} className="h-2" />;
        const rendered = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: rendered }} />;
      })}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  GENERATING: "Generating…",
  READY: "Ready for review",
  APPROVED: "Approved",
  SENT: "Sent",
};

export default function AIReportCard({
  reportId,
  initialSummary,
  initialStatus,
  reportTitle,
  clientName,
  clientEmail,
  periodLabel,
  agencyName,
  brandColor,
}: {
  reportId: string;
  initialSummary: string | null;
  initialStatus: string;
  reportTitle: string;
  clientName: string;
  clientEmail: string | null;
  periodLabel: string;
  agencyName: string;
  brandColor: string;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [generating, setGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"approve" | "send" | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setStreamedText("");
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/generate`, { method: "POST" });

      if (!res.ok) {
        let msg = "Generation failed. Please try again.";
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch { /* ignore */ }
        setError(msg);
        toast.error(msg);
        return;
      }

      if (!res.body) {
        setError("No response from server. Please try again.");
        toast.error("No response from server.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      if (fullText.includes("[Generation failed")) {
        setError("Generation failed. Check your API key or try again.");
        toast.error("AI generation failed. Please try again.");
        setSummary(null);
      } else {
        setSummary(fullText);
        setStreamedText("");
        setStatus("READY");
        toast.success("Report generated! Review it and approve when ready.");
      }
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    setActionLoading("approve");
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error();
      setStatus("APPROVED");
      toast.success("Report approved! Ready to send to client.");
    } catch {
      toast.error("Failed to approve report. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendToClient() {
    setActionLoading("send");
    try {
      const res = await fetch(`/api/reports/${reportId}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send report.");
        return;
      }
      setStatus("SENT");
      toast.success(`Report sent to ${clientEmail ?? "client"}!`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const displayText = generating ? streamedText : summary;
  const pdfFileName = `${reportTitle.replace(/\s+/g, "-")}-${clientName.replace(/\s+/g, "-")}.pdf`;
  const pdfProps = { title: reportTitle, clientName, periodLabel, summary: summary ?? "", agencyName, brandColor, fileName: pdfFileName };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">AI-Generated Report</CardTitle>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            {status !== "DRAFT" && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold
                ${status === "READY" ? "bg-blue-500/15 text-blue-400" : ""}
                ${status === "APPROVED" ? "bg-brand-500/15 text-brand-400" : ""}
                ${status === "SENT" ? "bg-emerald-500/15 text-emerald-400" : ""}
                ${status === "GENERATING" ? "bg-yellow-500/15 text-yellow-400" : ""}
              `}>
                {STATUS_LABELS[status] ?? status}
              </span>
            )}

            {/* Generate / Regenerate button */}
            <Button
              variant="gradient"
              size="sm"
              onClick={handleGenerate}
              disabled={generating || actionLoading !== null}
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
              ) : summary ? (
                <><RefreshCw className="h-3.5 w-3.5" />Regenerate</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Generate with AI</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error banner */}
        {error && !generating && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Report text */}
        {displayText ? (
          <div className="relative">
            <ReportNarrative summary={displayText} />
            {generating && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-400" />
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No narrative yet. Click &ldquo;Generate with AI&rdquo; to create one.
            </p>
          </div>
        )}

        {/* Action buttons — shown once report has content and generation is done */}
        {summary && !generating && status !== "SENT" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <p className="mr-auto text-xs text-muted-foreground">
              {status === "APPROVED"
                ? "Report approved — download or send it to your client."
                : "Review the report above, then approve or send it."}
            </p>

            <PDFDownloadButton {...pdfProps} disabled={actionLoading !== null} />

            {/* Approve (only if not yet approved) */}
            {status !== "APPROVED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                disabled={actionLoading !== null || generating}
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                Approve report
              </Button>
            )}

            {/* Send to client */}
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSendToClient}
              disabled={actionLoading !== null || generating}
            >
              {actionLoading === "send" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send to client
            </Button>
          </div>
        )}

        {/* Sent confirmation */}
        {status === "SENT" && !generating && summary && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              Report sent to {clientEmail ?? "client"} successfully.
            </div>
            <PDFDownloadButton {...pdfProps} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
