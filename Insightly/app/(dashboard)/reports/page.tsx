"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, FileText, Calendar, Eye, MoreHorizontal, Sparkles, Loader2, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getStatusColor } from "@/lib/utils";

type Report = {
  id: string;
  title: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  client: { name: string };
};

type Client = { id: string; name: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  GENERATING: "Generating…",
  READY: "Ready for review",
  APPROVED: "Approved",
  SENT: "Sent",
  SCHEDULED: "Scheduled",
};

const FILTER_TABS = ["All", "Draft", "Ready", "Sent"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const fetchReports = useCallback(() => {
    setLoading(true);
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter((r) => {
    if (activeTab === "All") return true;
    if (activeTab === "Ready") return r.status === "READY" || r.status === "APPROVED";
    return r.status === activeTab.toUpperCase();
  });

  async function handleDelete(id: string, title: string) {
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success(`"${title}" deleted.`);
    } else {
      toast.error("Failed to delete report.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated performance reports for your clients
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New report
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-brand-500 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List / loading / empty */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyReports onNew={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onView={() => router.push(`/reports/${report.id}`)}
              onDelete={() => handleDelete(report.id, report.title)}
            />
          ))}
        </div>
      )}

      <CreateReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          setModalOpen(false);
          toast.success("Report created! Redirecting…");
          router.push(`/reports/${id}`);
        }}
      />
    </div>
  );
}

function EmptyReports({ onNew }: { onNew: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/20 to-cyan-500/20">
          <Sparkles className="h-7 w-7 text-brand-400" />
        </div>
        <h3 className="mb-1 font-semibold text-foreground">No reports yet</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Create your first report and let Reportiq write the AI narrative for you.
        </p>
        <Button variant="gradient" onClick={onNew}>
          <Plus className="h-4 w-4" />
          Generate first report
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportRow({
  report,
  onView,
  onDelete,
}: {
  report: Report;
  onView: () => void;
  onDelete: () => void;
}) {
  const statusLabel = STATUS_LABELS[report.status] ?? report.status;
  const statusClass = getStatusColor(report.status);
  const start = new Date(report.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const end = new Date(report.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand-500/30">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{report.title}</p>
          <p className="text-xs text-muted-foreground">{report.client.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Calendar className="h-3.5 w-3.5" />
          {start} – {end}
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusClass)}>
          {statusLabel}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4" />
                View report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function CreateReportModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((d) => {
          const list: Client[] = d.clients ?? [];
          setClients(list);
          if (list.length === 1) setClientId(list[0].id);
        });
    }
  }, [open]);

  function reset() {
    setClientId(""); setTitle(""); setPeriodStart(""); setPeriodEnd("");
    setError(null); setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (periodStart && periodEnd && periodEnd < periodStart) {
      setError("Period end date must be on or after the start date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, title, periodStart, periodEnd }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create report."); return; }
      reset();
      onCreated(data.report.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) { reset(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New report</DialogTitle>
          <DialogDescription>
            Select a client and period — Reportiq will draft an AI narrative for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Client <span className="text-destructive">*</span></Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-title">Report title <span className="text-destructive">*</span></Label>
            <Input
              id="report-title"
              placeholder="e.g. Q1 2025 Performance Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="period-start">Period start <span className="text-destructive">*</span></Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => { setPeriodStart(e.target.value); setError(null); }}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="period-end">Period end <span className="text-destructive">*</span></Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={(e) => { setPeriodEnd(e.target.value); setError(null); }}
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
