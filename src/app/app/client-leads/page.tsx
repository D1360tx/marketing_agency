"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, RefreshCw, Save, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Client = { id: string; business_name: string | null; created_at: string };
type Routing = {
  onboarding_id: string;
  business_name: string | null;
  recipient_email: string | null;
  enabled: boolean;
  allowed_origin: string;
  revoked_at: string | null;
  endpoint: string;
};
type Lead = {
  id: string;
  onboarding_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  service: string;
  details: string;
  owner_notification_status: string;
  acknowledgment_status: string;
  created_at: string;
};

export default function ClientLeadsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [routing, setRouting] = useState<Routing | null>(null);
  const [recipient, setRecipient] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [allowedOrigin, setAllowedOrigin] = useState("same-origin");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedIdRef = useRef("");
  const loadAbortRef = useRef<AbortController | null>(null);

  const loadRouting = useCallback(async (id: string, signal?: AbortSignal) => {
    if (!id) return;
    const response = await fetch(`/api/client-lead-routing/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Routing could not be loaded");
    if (selectedIdRef.current !== id) return;
    setRouting(body);
    setRecipient(body.recipient_email || "");
    setEnabled(Boolean(body.enabled));
    setAllowedOrigin(body.allowed_origin || "same-origin");
  }, []);

  const loadLeads = useCallback(async (id?: string, signal?: AbortSignal) => {
    const query = id ? `?onboarding_id=${encodeURIComponent(id)}` : "";
    const response = await fetch(`/api/client-leads${query}`, { cache: "no-store", signal });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Leads could not be loaded");
    if (id && selectedIdRef.current !== id) return;
    setLeads(body.leads || []);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("client_onboarding")
          .select("id, business_name, created_at")
          .order("created_at", { ascending: false });
        if (error) throw new Error("Clients could not be loaded");
        const ownedClients = (data || []) as Client[];
        setClients(ownedClients);
        const firstId = ownedClients[0]?.id || "";
        setSelectedId(firstId);
        selectedIdRef.current = firstId;
        if (firstId) await Promise.all([loadRouting(firstId), loadLeads(firstId)]);
        else await loadLeads();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Client lead setup could not be loaded");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [loadLeads, loadRouting]);

  async function selectClient(id: string) {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setSelectedId(id);
    selectedIdRef.current = id;
    setRouting(null);
    setRecipient("");
    setEnabled(false);
    setAllowedOrigin("same-origin");
    setLoading(true);
    try {
      await Promise.all([loadRouting(id, controller.signal), loadLeads(id, controller.signal)]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "Client routing could not be loaded");
    } finally {
      if (selectedIdRef.current === id) setLoading(false);
    }
  }

  async function updateRouting(options: { rotate_token?: boolean; revoke_token?: boolean } = {}) {
    if (!selectedId || !recipient || !allowedOrigin || loading) return;
    const targetId = selectedId;
    setSaving(true);
    try {
      const response = await fetch(`/api/client-lead-routing/${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: recipient,
          enabled: options.revoke_token ? false : enabled,
          allowed_origin: allowedOrigin,
          rotate_token: Boolean(options.rotate_token),
          revoke_token: Boolean(options.revoke_token),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Routing could not be saved");
      if (selectedIdRef.current !== targetId) return;
      setRouting(body);
      setEnabled(Boolean(body.enabled));
      setAllowedOrigin(body.allowed_origin || "same-origin");
      toast.success(options.rotate_token ? "Endpoint rotated" : options.revoke_token ? "Endpoint revoked" : "Routing saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Routing could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function copyEndpoint() {
    if (!routing?.endpoint) return;
    const absolute = `${window.location.origin}${routing.endpoint}`;
    await navigator.clipboard.writeText(absolute);
    toast.success("Lead endpoint copied");
  }

  if (loading && clients.length === 0) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Website Leads</h1>
        <p className="text-muted-foreground">Configure tenant-specific email routing and inspect saved inquiries.</p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          Create a client onboarding record before enabling a website lead endpoint.
        </div>
      ) : (
        <>
          <section className="rounded-xl border bg-card p-5 space-y-5" aria-labelledby="routing-heading">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <Label htmlFor="client-select">Client</Label>
                <select
                  id="client-select"
                  className="h-10 min-w-64 rounded-md border bg-background px-3 text-sm"
                  value={selectedId}
                  onChange={(event) => void selectClient(event.target.value)}
                >
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.business_name || "Unnamed client"}</option>)}
                </select>
              </div>
              <Button variant="outline" onClick={() => void loadLeads(selectedId)}><RefreshCw className="mr-2 h-4 w-4" />Refresh leads</Button>
            </div>

            <div>
              <h2 id="routing-heading" className="font-semibold">Email routing</h2>
              <p className="text-sm text-muted-foreground">Provider acceptance is audited for both emails. Delivery is shown only when confirmed by a webhook.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="recipient">Owner notification recipient</Label>
                <Input id="recipient" type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="owner@example.com" required />
              </div>
              <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium">
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                Routing enabled
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowed-origin">Allowed website origin</Label>
              <Input id="allowed-origin" value={allowedOrigin} onChange={(event) => setAllowedOrigin(event.target.value)} placeholder="same-origin or https://www.example.com" required />
              <p className="text-xs text-muted-foreground">Use <code>same-origin</code> for a form hosted here, or one exact HTTPS origin with no path. Other origins receive no CORS access.</p>
            </div>
            {routing && (
              <div className="space-y-2">
                <Label>Public form endpoint</Label>
                <div className="flex gap-2">
                  <Input readOnly value={routing.revoked_at ? "Endpoint revoked" : routing.endpoint} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={copyEndpoint} disabled={Boolean(routing.revoked_at)}><Copy className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">Treat this endpoint as a bearer credential. It is shown only in this authenticated setup view.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void updateRouting()} disabled={saving || loading || !recipient || !allowedOrigin}><Save className="mr-2 h-4 w-4" />Save routing</Button>
              <Button variant="outline" onClick={() => void updateRouting({ rotate_token: true })} disabled={saving || loading || !recipient || !allowedOrigin}><RefreshCw className="mr-2 h-4 w-4" />Rotate endpoint</Button>
              <Button variant="ghost" className="text-red-600" onClick={() => void updateRouting({ revoke_token: true })} disabled={saving || loading || !recipient || !allowedOrigin || Boolean(routing?.revoked_at)}><ShieldOff className="mr-2 h-4 w-4" />Revoke endpoint</Button>
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="leads-heading">
            <div>
              <h2 id="leads-heading" className="text-lg font-semibold">Saved inquiries</h2>
              <p className="text-sm text-muted-foreground">Visible only to the authenticated client owner.</p>
            </div>
            {leads.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No inquiries saved for this client.</div>
            ) : (
              <div className="grid gap-3">
                {leads.map((lead) => (
                  <article key={lead.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:justify-between">
                      <div>
                        <h3 className="font-semibold">{lead.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{lead.email} • {lead.phone}</p>
                        <p className="text-sm">{lead.service} in {lead.city}</p>
                        {lead.details && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{lead.details}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground md:text-right">
                        <p>{new Date(lead.created_at).toLocaleString()}</p>
                        <p>Owner email: {lead.owner_notification_status}</p>
                        <p>Acknowledgment: {lead.acknowledgment_status}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
