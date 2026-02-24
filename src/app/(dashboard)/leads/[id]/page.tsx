"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WebsiteScoreBadge,
  NoWebsiteBadge,
} from "@/components/website-score-badge";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Shield,
  Smartphone,
  Clock,
  Loader2,
  Save,
  ExternalLink,
  Trash2,
  Palette,
  TrendingUp,
  MessageSquare,
  Activity,
} from "lucide-react";
import type { ProspectStatus, ProspectWithAnalysis, WebsiteAnalysis } from "@/types";

const statusConfig: Record<ProspectStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800 border-purple-200" },
  interested: { label: "Interested", color: "bg-amber-100 text-amber-800 border-amber-200" },
  client: { label: "Client", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  not_interested: { label: "Not Interested", color: "bg-gray-100 text-gray-800 border-gray-200" },
  lost: { label: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
};

interface ProspectActivity {
  id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ProspectMessage {
  id: string;
  channel: string;
  to_address: string;
  subject: string | null;
  body: string;
  status: string;
  sent_at: string | null;
  campaigns: { name: string; type: string } | null;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [prospect, setProspect] = useState<ProspectWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activities, setActivities] = useState<ProspectActivity[]>([]);
  const [messages, setMessages] = useState<ProspectMessage[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch prospect
        const res = await fetch("/api/prospects");
        const data = await res.json();
        const found = (data.prospects || []).find(
          (p: ProspectWithAnalysis) => p.id === id
        );
        if (found) {
          setProspect(found);
          setNotes(found.notes || "");
        }

        // Fetch messages for this prospect
        const msgRes = await fetch(`/api/prospects/${id}/messages`);
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
      } catch {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchActivities();
  }, [id]);

  async function fetchActivities() {
    // Activities are fetched client-side via a direct query approach
    // Since we don't have a dedicated endpoint, we'll use the existing patterns
    try {
      const res = await fetch(`/api/prospects/${id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      // Activity log endpoint may not exist yet, fail silently
    }
  }

  async function handleStatusChange(status: string) {
    if (!prospect) return;
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, status }),
      });
      setProspect({ ...prospect, status: status as ProspectStatus });
      // Refresh activities after status change
      setTimeout(fetchActivities, 500);
    } catch {
      console.error("Failed to update status");
    }
  }

  async function handleSaveNotes() {
    if (!prospect) return;
    setSavingNotes(true);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, notes }),
      });
      setProspect({ ...prospect, notes });
      setTimeout(fetchActivities, 500);
    } catch {
      console.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!prospect || !confirm("Delete this lead? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch("/api/prospects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id }),
      });
      router.push("/leads");
    } catch {
      console.error("Failed to delete");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="space-y-4">
        <Link href="/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
          </Button>
        </Link>
        <p className="text-muted-foreground">Lead not found.</p>
      </div>
    );
  }

  const analysis = prospect.website_analyses?.[0] as WebsiteAnalysis | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadScore = (prospect as any).lead_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{prospect.business_name}</h1>
              {leadScore > 0 && (
                <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  leadScore >= 70
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : leadScore >= 40
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  Score: {leadScore}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {prospect.business_type && (
                <Badge variant="secondary">{prospect.business_type}</Badge>
              )}
              {prospect.rating != null && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {prospect.rating} ({prospect.review_count} reviews)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={prospect.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href={`/generator?prospect=${prospect.id}`}>
            <Button variant="outline" size="sm">
              <Palette className="mr-2 h-4 w-4" />
              Generate Website
            </Button>
          </Link>
          <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Contact info + Notes + Messages + Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {prospect.phone && (
                  <a href={`tel:${prospect.phone}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{prospect.phone}</p>
                    </div>
                  </a>
                )}
                {prospect.email && (
                  <a href={`mailto:${prospect.email}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{prospect.email}</p>
                    </div>
                  </a>
                )}
                {prospect.website_url && (
                  <a href={prospect.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="flex items-center gap-1 font-medium">
                        {prospect.website_url.replace(/^https?:\/\//, "").slice(0, 30)}
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </a>
                )}
                {prospect.address && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[prospect.address, prospect.city, prospect.state, prospect.zip]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {!prospect.phone && !prospect.email && !prospect.website_url && (
                <p className="text-muted-foreground">No contact information available.</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Keep track of your interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add notes about this prospect..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === (prospect.notes || "")}
                size="sm"
              >
                {savingNotes ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3 w-3" />
                )}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Messages / Communication History */}
          {messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages ({messages.length})
                </CardTitle>
                <CardDescription>All outreach sent to this lead</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {msg.channel === "email" ? "Email" : "SMS"}
                          </Badge>
                          {msg.campaigns && (
                            <span className="text-xs text-muted-foreground">
                              {msg.campaigns.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              msg.status === "sent" || msg.status === "delivered"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : msg.status === "failed"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-gray-200 text-gray-600"
                            }
                          >
                            {msg.status}
                          </Badge>
                          {msg.sent_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.sent_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {msg.subject && (
                        <p className="text-sm font-medium">{msg.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {msg.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        To: {msg.to_address}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          {activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {activities.map((act, i) => (
                    <div key={act.id} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        {i < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm">{act.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(act.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Website Analysis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {!prospect.website_url ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <NoWebsiteBadge />
                  <p className="text-sm text-muted-foreground">
                    This business has no website — great opportunity!
                  </p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <WebsiteScoreBadge grade={analysis.overall_grade} size="lg" />
                  </div>

                  <div className="space-y-3">
                    <ScoreBar label="Performance" score={analysis.performance_score} />
                    <ScoreBar label="Accessibility" score={analysis.accessibility_score} />
                    <ScoreBar label="Best Practices" score={analysis.best_practices_score} />
                    <ScoreBar label="SEO" score={analysis.seo_score} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> SSL Certificate
                      </span>
                      <Badge variant="outline" className={analysis.has_ssl ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                        {analysis.has_ssl ? "Secure" : "Not Secure"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Mobile Friendly
                      </span>
                      <Badge variant="outline" className={analysis.is_mobile_friendly ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                        {analysis.is_mobile_friendly ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {analysis.load_time_ms && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Load Time
                        </span>
                        <span className="font-medium">
                          {(analysis.load_time_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Not yet analyzed. Go to Prospector to analyze.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const value = score ?? 0;
  const color =
    value >= 90 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score ?? "-"}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
