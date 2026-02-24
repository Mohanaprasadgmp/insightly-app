"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Building2, Palette, Bell, CreditCard, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "agency", label: "Agency", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, agency, and workspace preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 space-y-1">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {activeTab === "profile" && (
            <ProfileSettings user={session?.user} />
          )}
          {activeTab === "agency" && <AgencySettings />}
          {activeTab === "branding" && <BrandingSettings />}
          {activeTab === "billing" && <BillingSettings />}
          {(activeTab === "notifications" || activeTab === "security") && (
            <ComingSoonPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({
  user,
}: {
  user?: { name?: string | null; email?: string | null } | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            defaultValue={user?.name ?? ""}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            defaultValue={user?.email ?? ""}
            placeholder="you@agency.com"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed after signup.
          </p>
        </div>
        <Separator />
        <Button variant="default" size="sm">
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}

function AgencySettings() {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/agency")
      .then((r) => r.json())
      .then((data) => {
        if (data.agency) {
          setName(data.agency.name ?? "");
          setWebsite(data.agency.website ?? "");
          setSlug(data.agency.slug ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website, slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? "Failed to save." });
      } else {
        setStatus({ type: "success", msg: "Agency settings saved." });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency</CardTitle>
        <CardDescription>
          Configure your agency&apos;s profile and default settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="agency-name">Agency name</Label>
          <Input
            id="agency-name"
            placeholder="Acme Digital Marketing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="agency-website">Website</Label>
          <Input
            id="agency-website"
            type="url"
            placeholder="https://acmedigital.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="agency-slug">
            Workspace URL
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (used in report links)
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">reportiq.app/</span>
            <Input
              id="agency-slug"
              placeholder="acme-digital"
              className="flex-1"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {status && (
          <p className={cn("text-xs", status.type === "success" ? "text-emerald-400" : "text-red-400")}>
            {status.msg}
          </p>
        )}
        <Separator />
        <Button variant="default" size="sm" onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BrandingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>White-label branding</CardTitle>
        <CardDescription>
          Customize how your reports look to clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Logo</Label>
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
            Click to upload logo (PNG, SVG recommended)
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-color">Primary brand color</Label>
          <div className="flex items-center gap-3">
            <input
              id="brand-color"
              type="color"
              defaultValue="#6366f1"
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
            />
            <Input
              defaultValue="#6366f1"
              placeholder="#6366f1"
              className="w-32 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for headings, accents, and buttons in PDF reports.
          </p>
        </div>
        <Separator />
        <Button variant="default" size="sm">
          Save branding
        </Button>
      </CardContent>
    </Card>
  );
}

function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & plan</CardTitle>
        <CardDescription>Manage your subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Free plan</p>
              <p className="text-xs text-muted-foreground">
                Limited to 3 clients and 5 reports/month
              </p>
            </div>
            <Button variant="gradient" size="sm">
              Upgrade
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Stripe billing integration coming soon.
        </p>
      </CardContent>
    </Card>
  );
}

function ComingSoonPanel() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">Coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This settings section will be available in a future release.
        </p>
      </CardContent>
    </Card>
  );
}
