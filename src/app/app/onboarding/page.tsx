"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OnboardingRecord = {
  id: string;
  token: string;
  prospect_id: string | null;
  business_name: string | null;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  service_areas: string | null;
  services_offered: string[];
  has_google_my_business: boolean;
  google_my_business_url: string | null;
  existing_website: string | null;
  brand_colors: string | null;
  style_notes: string | null;
  logo_url: string | null;
  photo_urls: string[];
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  preferred_contact_method: string | null;
  review_process_notes: string | null;
  additional_notes: string | null;
  status: "pending" | "reviewed" | "complete";
  submitted_at: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm py-1">
      <span className="font-medium text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-foreground break-words">{value}</span>
    </div>
  );
}

function ExpandedRow({ record }: { record: OnboardingRecord }) {
  return (
    <div className="px-4 py-4 bg-muted/20 border-t text-sm space-y-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Business Info</p>
          <DetailRow label="Address" value={[record.address, record.city, record.state, record.zip].filter(Boolean).join(", ")} />
          <DetailRow label="Service Areas" value={record.service_areas} />
          <DetailRow label="Services" value={record.services_offered?.join(", ")} />
          <DetailRow label="Existing Website" value={record.existing_website} />
          <DetailRow label="GBP URL" value={record.google_my_business_url} />
        </div>
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Brand</p>
          <DetailRow label="Brand Colors" value={record.brand_colors} />
          <DetailRow label="Style Notes" value={record.style_notes} />
          {record.logo_url && (
            <div className="py-1">
              <span className="font-medium text-muted-foreground text-sm">Logo</span>
              <div className="mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.logo_url} alt="Logo" className="h-12 object-contain rounded border bg-white p-1" />
              </div>
            </div>
          )}
          {record.photo_urls?.length > 0 && (
            <div className="py-1">
              <span className="font-medium text-muted-foreground text-sm block mb-1">Photos</span>
              <div className="flex flex-wrap gap-1">
                {record.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-12 w-12 object-cover rounded border" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pt-2">
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
          <DetailRow label="Contact Name" value={record.primary_contact_name} />
          <DetailRow label="Email" value={record.primary_contact_email} />
          <DetailRow label="Phone" value={record.primary_contact_phone} />
          <DetailRow label="Preferred Method" value={record.preferred_contact_method} />
        </div>
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</p>
          <DetailRow label="Review Process" value={record.review_process_notes} />
          <DetailRow label="Additional Notes" value={record.additional_notes} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("client_onboarding")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to fetch onboarding records:", err);
      toast.error("Failed to load onboarding submissions");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function generateLink() {
    setGenerating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("client_onboarding")
        .insert({ status: "pending" })
        .select("token")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/onboarding/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", {
        description: url,
      });

      // Refresh list
      await fetchRecords();
    } catch (err) {
      console.error("Failed to generate link:", err);
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("client_onboarding")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: status as OnboardingRecord["status"] } : r
        )
      );
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/onboarding/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!", { description: url });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const submitted = records.filter((r) => r.submitted_at);
  const pending = records.filter((r) => !r.submitted_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Onboarding</h1>
          <p className="text-muted-foreground">
            {submitted.length} submission{submitted.length !== 1 ? "s" : ""},&nbsp;
            {pending.length} link{pending.length !== 1 ? "s" : ""} pending
          </p>
        </div>
        <Button onClick={generateLink} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LinkIcon className="mr-2 h-4 w-4" />
          )}
          Generate Link
        </Button>
      </div>

      {/* Submitted records */}
      {submitted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Submissions
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Table header — desktop */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1fr] gap-4 px-4 py-2.5 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Business</span>
              <span>Owner / Phone</span>
              <span>Services</span>
              <span>Submitted</span>
              <span>Status</span>
              <span></span>
            </div>
            {submitted.map((record) => (
              <div key={record.id}>
                {/* Row */}
                <div
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1fr] gap-2 md:gap-4 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleExpanded(record.id)}
                >
                  {/* Business name */}
                  <div className="flex items-center gap-2">
                    {expanded.has(record.id) ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm truncate">{record.business_name || "—"}</p>
                      {record.city && (
                        <p className="text-xs text-muted-foreground">{record.city}{record.state ? `, ${record.state}` : ""}</p>
                      )}
                    </div>
                  </div>
                  {/* Owner / phone */}
                  <div className="md:flex md:flex-col md:justify-center">
                    <p className="text-sm">{record.owner_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{record.phone || ""}</p>
                  </div>
                  {/* Services */}
                  <div className="md:flex md:items-center">
                    <p className="text-xs text-muted-foreground truncate">
                      {record.services_offered?.length ? record.services_offered.slice(0, 2).join(", ") + (record.services_offered.length > 2 ? "…" : "") : "—"}
                    </p>
                  </div>
                  {/* Submitted at */}
                  <div className="md:flex md:items-center">
                    <p className="text-xs text-muted-foreground">
                      {record.submitted_at
                        ? new Date(record.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  {/* Status */}
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    {updatingStatus[record.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Select
                        value={record.status}
                        onValueChange={(v) => updateStatus(record.id, v)}
                      >
                        <SelectTrigger className={`h-7 w-auto min-w-[110px] border text-xs font-medium ${statusColors[record.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(record.token)}
                      title="Copy link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Expanded details */}
                {expanded.has(record.id) && <ExpandedRow record={record} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending links (not yet submitted) */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Pending Links (Not Yet Submitted)
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            {pending.map((record) => (
              <div key={record.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{record.business_name || "Unnamed Link"}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(record.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    &nbsp;&middot;&nbsp;
                    <span className="font-mono text-[10px]">{record.token.slice(0, 8)}…</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(record.token)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No onboarding links yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &quot;Generate Link&quot; to create a client intake form link.
          </p>
        </div>
      )}
    </div>
  );
}
