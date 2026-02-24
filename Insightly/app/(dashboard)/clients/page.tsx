"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Globe, Mail, Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  contactEmail: string | null;
  contactName: string | null;
  isActive: boolean;
  _count: { dataSources: number };
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function handleDelete(client: Client) {
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${client.name}" deleted.`);
      fetchClients();
    } catch {
      toast.error("Failed to delete client. Please try again.");
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the businesses your agency reports for
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="px-3 py-1.5 text-xs">
          {clients.length} total
        </Badge>
      </div>

      {/* Client list / empty state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyClients onAdd={() => setAddModalOpen(true)} hasSearch={search.length > 0} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => setEditingClient(client)}
              onDelete={() => handleDelete(client)}
            />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          setAddModalOpen(false);
          fetchClients();
          toast.success("Client added successfully!");
        }}
      />

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={() => {
            setEditingClient(null);
            fetchClients();
            toast.success("Client updated successfully!");
          }}
        />
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyClients({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No clients match your search.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-semibold text-foreground">No clients yet</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Add your first client to start connecting their data sources and generating reports.
        </p>
        <Button variant="gradient" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add your first client
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Client card ────────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group transition-colors hover:border-brand-500/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground leading-tight">{client.name}</p>
              {client.industry && (
                <p className="text-xs text-muted-foreground">{client.industry}</p>
              )}
            </div>
          </div>

          {/* Three-dot dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit client
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-1.5">
          {client.website && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.website}</span>
            </div>
          )}
          {client.contactEmail && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.contactEmail}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant={client.isActive ? "success" : "secondary"}>
            {client.isActive ? "Active" : "Inactive"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {client._count.dataSources} source
            {client._count.dataSources !== 1 ? "s" : ""} connected
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Shared form fields ─────────────────────────────────────────────────────────

function ClientFormFields({
  name, setName,
  industry, setIndustry,
  website, setWebsite,
  contactName, setContactName,
  contactEmail, setContactEmail,
  error,
}: {
  name: string; setName: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  contactName: string; setContactName: (v: string) => void;
  contactEmail: string; setContactEmail: (v: string) => void;
  error: string | null;
}) {
  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="client-name">
          Client / business name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="client-name"
          placeholder="Acme Coffee Co."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            placeholder="e.g. E-commerce"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="client-website">Website</Label>
          <Input
            id="client-website"
            placeholder="https://..."
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="contact-name">Contact name</Label>
          <Input
            id="contact-name"
            placeholder="John Smith"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-email">Contact email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="john@acme.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  );
}

// ─── Add Client Modal ───────────────────────────────────────────────────────────

function AddClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(""); setIndustry(""); setWebsite("");
    setContactName(""); setContactEmail("");
    setError(null); setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, website, contactName, contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create client."); return; }
      reset();
      onCreated();
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
          <DialogTitle>Add new client</DialogTitle>
          <DialogDescription>
            Enter the details of the business you&apos;re reporting for.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <ClientFormFields
            name={name} setName={setName}
            industry={industry} setIndustry={setIndustry}
            website={website} setWebsite={setWebsite}
            contactName={contactName} setContactName={setContactName}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            error={error}
          />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Client Modal ──────────────────────────────────────────────────────────

function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [industry, setIndustry] = useState(client.industry ?? "");
  const [website, setWebsite] = useState(client.website ?? "");
  const [contactName, setContactName] = useState(client.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(client.contactEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, website, contactName, contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update client."); return; }
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>
            Update the details for <strong>{client.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <ClientFormFields
            name={name} setName={setName}
            industry={industry} setIndustry={setIndustry}
            website={website} setWebsite={setWebsite}
            contactName={contactName} setContactName={setContactName}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            error={error}
          />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
