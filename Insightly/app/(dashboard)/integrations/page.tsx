"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Plug,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DataSource = {
  id: string;
  type: string;
  name: string;
  clientName: string;
  clientId: string;
  status: string;
  lastSyncedAt: string | null;
  syncError: string | null;
};

type Client = {
  id: string;
  name: string;
};

// ─── Integration catalog ──────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    id: "GOOGLE_ANALYTICS_4",
    name: "Google Analytics 4",
    description:
      "Track website traffic, user behavior, conversions, and audience demographics.",
    iconFallback: "GA4",
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
    available: true,
    comingSoon: false,
  },
  {
    id: "META_ADS",
    name: "Meta Ads",
    description:
      "Facebook and Instagram ad performance — spend, reach, clicks, and conversions.",
    iconFallback: "META",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    available: false,
    comingSoon: true,
  },
  {
    id: "GOOGLE_ADS",
    name: "Google Ads",
    description:
      "Search and display campaign performance including CPC, CTR, and ROAS.",
    iconFallback: "GAds",
    iconBg: "bg-green-500/15",
    iconColor: "text-green-400",
    available: false,
    comingSoon: true,
  },
  {
    id: "GOOGLE_SEARCH_CONSOLE",
    name: "Google Search Console",
    description:
      "Organic search impressions, clicks, average position, and top queries.",
    iconFallback: "GSC",
    iconBg: "bg-teal-500/15",
    iconColor: "text-teal-400",
    available: false,
    comingSoon: true,
  },
  {
    id: "LINKEDIN_ADS",
    name: "LinkedIn Ads",
    description: "B2B campaign performance, lead generation, and audience insights.",
    iconFallback: "LI",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
    available: false,
    comingSoon: true,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data sources and clients in parallel
    Promise.all([
      fetch("/api/data-sources").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([dsData, clientData]) => {
      setDataSources(dsData.dataSources ?? []);
      setClients(clientData.clients ?? []);
      setLoading(false);
    });

    // Handle OAuth callback params
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "ga4") {
      toast.success("Google Analytics 4 connected successfully!");
      router.replace("/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "Authorization was cancelled.",
        token_exchange_failed: "Failed to exchange tokens. Please try again.",
        save_failed: "Failed to save integration. Please try again.",
        unauthorized: "You must be logged in to connect integrations.",
        client_not_found: "Client not found.",
        invalid_state: "Invalid OAuth state. Please try again.",
      };
      toast.error(
        errorMessages[error] ?? "Failed to connect integration. Please try again."
      );
      router.replace("/integrations");
    }
  }, [searchParams, router]);

  function handleConnectClick(integrationId: string) {
    setConnectingType(integrationId);
    setConnectModalOpen(true);
  }

  async function handleDisconnect(ds: DataSource) {
    if (!confirm(`Disconnect "${ds.name}"? This will remove the integration.`)) return;
    try {
      const res = await fetch(`/api/data-sources/${ds.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${ds.name}" disconnected.`);
      setDataSources((prev) => prev.filter((s) => s.id !== ds.id));
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your clients&apos; marketing platforms to pull performance data
        </p>
      </div>

      {/* Connected sources */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Connected sources
          <span className="ml-2 font-normal text-muted-foreground">
            ({dataSources.length})
          </span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : dataSources.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No integrations connected yet. Connect a source below.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {dataSources.map((source) => (
              <ConnectedSourceRow
                key={source.id}
                source={source}
                onDisconnect={() => handleDisconnect(source)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available integrations */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Available integrations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              connectedCount={
                dataSources.filter((ds) => ds.type === integration.id).length
              }
              onConnect={() => handleConnectClick(integration.id)}
            />
          ))}
        </div>
      </section>

      {/* Connect GA4 Modal */}
      <ConnectGA4Modal
        open={connectModalOpen && connectingType === "GOOGLE_ANALYTICS_4"}
        clients={clients}
        onClose={() => {
          setConnectModalOpen(false);
          setConnectingType(null);
        }}
      />
    </div>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  connectedCount,
  onConnect,
}: {
  integration: (typeof INTEGRATIONS)[number];
  connectedCount: number;
  onConnect: () => void;
}) {
  return (
    <Card className="transition-colors hover:border-border/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold",
              integration.iconBg,
              integration.iconColor
            )}
          >
            {integration.iconFallback}
          </div>
          <div className="flex items-center gap-2">
            {connectedCount > 0 && (
              <Badge variant="success" className="text-[10px]">
                {connectedCount} connected
              </Badge>
            )}
            {integration.comingSoon && (
              <Badge variant="secondary" className="text-[10px]">
                Coming soon
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-3">
          <p className="font-semibold text-foreground">{integration.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {integration.description}
          </p>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={integration.comingSoon}
            onClick={integration.available ? onConnect : undefined}
          >
            {integration.comingSoon ? (
              "Coming soon"
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                {connectedCount > 0 ? "Add another" : "Connect"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Connected source row ─────────────────────────────────────────────────────

function ConnectedSourceRow({
  source,
  onDisconnect,
}: {
  source: DataSource;
  onDisconnect: () => void;
}) {
  const statusIcon =
    source.status === "CONNECTED" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : source.status === "ERROR" ? (
      <AlertCircle className="h-4 w-4 text-red-400" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-400" />
    );

  const formattedSync = source.lastSyncedAt
    ? new Date(source.lastSyncedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <p className="text-sm font-medium text-foreground">{source.name}</p>
          <p className="text-xs text-muted-foreground">{source.clientName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {formattedSync && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Synced {formattedSync}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDisconnect}
          title="Disconnect"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Connect GA4 Modal ────────────────────────────────────────────────────────

function ConnectGA4Modal({
  open,
  clients,
  onClose,
}: {
  open: boolean;
  clients: Client[];
  onClose: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [propertyError, setPropertyError] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedClientId(clients[0]?.id ?? "");
      setPropertyId("");
      setPropertyError("");
    }
  }, [open, clients]);

  function handleAuthorize() {
    if (!selectedClientId) return;
    const trimmed = propertyId.trim().replace(/\D/g, ""); // digits only
    if (!trimmed) {
      setPropertyError("Property ID is required (numeric, e.g. 123456789).");
      return;
    }
    setPropertyError("");
    window.location.href = `/api/integrations/ga4/connect?clientId=${selectedClientId}&propertyId=${trimmed}`;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/15 text-[10px] font-bold text-orange-400">
              GA4
            </span>
            Connect Google Analytics 4
          </DialogTitle>
          <DialogDescription>
            Select the client and enter your GA4 Property ID, then authorize
            with Google.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {clients.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              You need to add a client first before connecting an integration.
            </p>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="connect-client">Client</Label>
                <select
                  id="connect-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="property-id">
                  GA4 Property ID <span className="text-destructive">*</span>
                </Label>
                <input
                  id="property-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 123456789"
                  value={propertyId}
                  onChange={(e) => { setPropertyId(e.target.value); setPropertyError(""); }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {propertyError && (
                  <p className="text-xs text-destructive">{propertyError}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Find it in GA4 → Admin → Property Settings → Property ID
                  (numeric, not G-XXXXXXXX)
                </p>
              </div>
            </>
          )}

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What happens next:</p>
            <p>
              You&apos;ll be redirected to Google to approve read-only access to
              your Analytics data. We never write to your account.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleAuthorize}
            disabled={!selectedClientId || !propertyId.trim() || clients.length === 0}
          >
            <Plug className="h-3.5 w-3.5" />
            Authorize with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
