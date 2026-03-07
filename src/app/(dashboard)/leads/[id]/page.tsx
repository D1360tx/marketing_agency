"use client";

import { useEffect, useState, use } from "react";
import { createPortal } from "react-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lightbulb,
  DollarSign,
  UserPlus,
  RefreshCw,
  FileText,
  Send,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { ProspectStatus, ProspectWithAnalysis, WebsiteAnalysis } from "@/types";

const statusConfig: Record<ProspectStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800 border-purple-200" },
  interested: { label: "Interested", color: "bg-amber-100 text-amber-800 border-amber-200" },
  follow_up: { label: "Follow Up", color: "bg-orange-100 text-orange-800 border-orange-200" },
  call_scheduled: { label: "Call Scheduled", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  client: { label: "Client", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  not_interested: { label: "Not Interested", color: "bg-gray-100 text-gray-800 border-gray-200" },
  lost: { label: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
};

const NOTE_TEMPLATES = [
  "Left voicemail",
  "No answer",
  "Interested — will call back",
  "Sent Facebook DM",
  "Not a good fit",
  "Bad reviews / not a target",
];

const PRESET_TAGS = [
  "No website 🔥",
  "Hot lead 🔥",
  "Left VM",
  "Price objection",
  "Bad reviews",
  "Call back",
  "Needs review mgmt",
  "Seasonal",
];

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

// Parse note log from plain text (entries separated by \n---\n)
function parseNoteLog(raw: string | null): Array<{ timestamp: string; text: string; rawBody: string; images?: string[] }> {
  if (!raw) return [];
  const entries = raw.split("\n---\n").filter(Boolean);
  return entries.map((entry) => {
    const lines = entry.trim().split("\n");
    const headerMatch = lines[0]?.match(/^\[(.+)\]$/);
    const body = headerMatch ? lines.slice(1).join("\n").trim() : entry.trim();
    // Extract [img:URL] tags
    const imgRegex = /\[img:(https?:\/\/[^\]]+)\]/g;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(body)) !== null) images.push(match[1]);
    const text = body.replace(/\[img:https?:\/\/[^\]]+\]/g, "").trim();
    return {
      timestamp: headerMatch ? headerMatch[1] : "",
      text,
      rawBody: body, // preserve original including [img:] tags for rebuilding
      ...(images.length > 0 ? { images } : {}),
    };
  });
}

function formatNoteTimestamp(): string {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function generatePitch(prospect: ProspectWithAnalysis, analysis?: WebsiteAnalysis): string {
  const name = prospect.business_name;
  const city = prospect.city || "your area";
  const type = prospect.business_type || "business";

  let hook = "";
  if (!prospect.website_url) {
    hook = `I noticed ${name} doesn't have a website yet`;
  } else if (analysis?.overall_grade === "F" || analysis?.overall_grade === "D") {
    hook = `I noticed ${name}'s website could use some work`;
  } else {
    hook = `I came across ${name} while looking for ${type} businesses in ${city}`;
  }

  const reviewNote = (prospect.review_count ?? 0) < 10
    ? ` and only has ${prospect.review_count ?? 0} Google reviews`
    : "";

  return `Hey ${name}! ${hook}${reviewNote}. I help local ${type} businesses in ${city} get more customers through professional websites and better Google reviews. Would you be open to a quick 5-minute chat? — Maria`;
}

function getTalkingPoints(prospect: ProspectWithAnalysis, analysis?: WebsiteAnalysis): string[] {
  const points: string[] = [];
  const reviews = prospect.review_count ?? 0;
  const rating = prospect.rating ?? 0;

  if (!prospect.website_url) {
    points.push("🔥 No website — they're invisible online. Lead with this.");
  } else if (analysis?.overall_grade === "F") {
    points.push("🔥 Grade F website — actively hurting their business.");
  } else if (analysis?.overall_grade === "D") {
    points.push("⚠️ Grade D website — customers are bouncing.");
  } else if (analysis?.overall_grade === "C") {
    points.push("📉 Grade C website — room for major improvement.");
  }

  if (reviews < 5) {
    points.push(`📊 Only ${reviews} Google reviews — competitors have way more.`);
  } else if (reviews < 20) {
    points.push(`📊 ${reviews} reviews is below average for their industry.`);
  } else if (reviews >= 50 && rating >= 4.3) {
    points.push(`⭐ ${reviews} reviews at ${rating}★ — great reputation to leverage.`);
  }

  if (!analysis?.has_ssl && prospect.website_url) {
    points.push("🔒 No SSL certificate — site shows as 'Not Secure'.");
  }

  if (analysis?.is_mobile_friendly === false) {
    points.push("📱 Website not mobile-friendly — most customers search on phones.");
  }

  if (rating > 0 && rating < 3.5) {
    points.push(`⚠️ ${rating}★ rating — reputation is hurting them.`);
  }

  if (points.length === 0) {
    points.push("✅ Strong online presence — pitch the growth angle.");
  }

  return points;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) count++;
  }
  return result;
}

function addBusinessDaysStr(date: Date, days: number): string {
  return addBusinessDays(date, days).toISOString().split("T")[0];
}

function ActivityIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "created": return <UserPlus className={cls} />;
    case "status_changed": return <RefreshCw className={cls} />;
    case "notes_updated": return <FileText className={cls} />;
    case "call_logged": return <Phone className={cls} />;
    case "email_sent": return <Mail className={cls} />;
    case "email_found": return <Mail className={cls} />;
    case "analyzed": return <TrendingUp className={cls} />;
    case "drip_enrolled": return <Send className={cls} />;
    default: return <Activity className={cls} />;
  }
}

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [prospect, setProspect] = useState<ProspectWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activities, setActivities] = useState<ProspectActivity[]>([]);
  const [messages, setMessages] = useState<ProspectMessage[]>([]);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callOutcome, setCallOutcome] = useState("Answered");
  const [callNote, setCallNote] = useState("");
  const [loggingCall, setLoggingCall] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Prev/Next nav
  const [listIds, setListIds] = useState<string[]>([]);
  const [listIndex, setListIndex] = useState(-1);

  // Win/Loss dialog state
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [lossDetail, setLossDetail] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Deal value state
  const [dealValue, setDealValue] = useState<string>("");
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [pendingDealValue, setPendingDealValue] = useState("");

  // Call scheduled state
  const [callScheduledAt, setCallScheduledAt] = useState<string>("");

  // Find email state
  const [findingEmail, setFindingEmail] = useState(false);

  // Note editing state
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Image attachment state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]); // URLs staged before adding note
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Inline edit state
  const [editing, setEditing] = useState<"phone" | "email" | "business_name" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    // Read prev/next list from sessionStorage
    try {
      const stored = sessionStorage.getItem("leadListIds");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        setListIds(ids);
        setListIndex(ids.indexOf(id));
      }
    } catch {
      // fail silently
    }
  }, [id]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/prospects/${id}`);
        const data = await res.json();
        if (data.prospect) {
          setProspect(data.prospect);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFollowUpDate((data.prospect as any).follow_up_date || "");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setDealValue(String((data.prospect as any).deal_value || ""));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCallScheduledAt((data.prospect as any).call_scheduled_at?.slice(0, 16) || "");
        }

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
    try {
      const res = await fetch(`/api/prospects/${id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      // fail silently
    }
  }

  async function handleStatusChange(status: string) {
    if (!prospect) return;

    // Win/loss dialog intercept
    if (status === "not_interested" || status === "lost") {
      setPendingStatus(status);
      setShowLossDialog(true);
      return;
    }

    setSavingStatus(true);
    try {
      const body: Record<string, unknown> = { id: prospect.id, status };
      if (status === "follow_up" && !followUpDate) {
        const suggested = addBusinessDaysStr(new Date(), 3);
        setFollowUpDate(suggested);
        body.follow_up_date = suggested;
      } else if (status === "follow_up" && followUpDate) {
        body.follow_up_date = followUpDate;
      } else if (status !== "follow_up") {
        body.follow_up_date = null;
      }

      // Auto-set call_scheduled_at if not already set
      if (status === "call_scheduled" && !callScheduledAt) {
        const next = addBusinessDays(new Date(), 1);
        next.setHours(10, 0, 0, 0);
        const nextStr = next.toISOString().slice(0, 16);
        setCallScheduledAt(nextStr);
        body.call_scheduled_at = next.toISOString();
      }

      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setProspect({ ...prospect, status: status as ProspectStatus });
      setTimeout(fetchActivities, 500);

      // Show deal dialog when converting to client
      if (status === "client") {
        setShowDealDialog(true);
      }
    } catch {
      console.error("Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleLossConfirm() {
    if (!prospect || !pendingStatus) return;
    setSavingStatus(true);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prospect.id,
          status: pendingStatus,
          loss_reason: lossReason,
          loss_reason_detail: lossDetail,
        }),
      });
      setProspect({ ...prospect, status: pendingStatus as ProspectStatus } as ProspectWithAnalysis);
      setTimeout(fetchActivities, 500);
    } catch {
      console.error("Failed to update status");
    } finally {
      setSavingStatus(false);
      setShowLossDialog(false);
      setPendingStatus(null);
      setLossReason("");
      setLossDetail("");
    }
  }

  async function handleFollowUpDateSave() {
    if (!prospect) return;
    setSavingStatus(true);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, follow_up_date: followUpDate || null }),
      });
    } catch {
      console.error("Failed to save follow-up date");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNoteEdit(index: number) {
    if (!prospect) return;
    setSavingNotes(true);
    try {
      const entries = parseNoteLog(prospect.notes);
      // Rebuild body: keep existing [img:] tags, replace only the text portion
      const imgTags = (entries[index].images || []).map((u) => `[img:${u}]`).join("\n");
      const newBody = [editingNoteText.trim(), imgTags].filter(Boolean).join("\n");
      const updated = entries
        .map((e, i) => {
          const body = i === index ? newBody : e.rawBody;
          return e.timestamp ? `[${e.timestamp}]\n${body}` : body;
        })
        .join("\n---\n");
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, notes: updated }),
      });
      setProspect({ ...prospect, notes: updated });
      setEditingNoteIndex(null);
      setEditingNoteText("");
    } catch {
      console.error("Failed to save note edit");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDeleteNote(index: number) {
    if (!prospect || !confirm("Delete this note entry?")) return;
    setSavingNotes(true);
    try {
      const entries = parseNoteLog(prospect.notes);
      entries.splice(index, 1);
      const updated = entries
        .map((e) => (e.timestamp ? `[${e.timestamp}]\n${e.rawBody}` : e.rawBody))
        .join("\n---\n");
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, notes: updated }),
      });
      setProspect({ ...prospect, notes: updated });
    } catch {
      console.error("Failed to delete note");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!prospect) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/prospects/${prospect.id}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setPendingImages((prev) => [...prev, data.url]);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddNote() {
    if (!prospect || (!newNote.trim() && pendingImages.length === 0)) return;
    setSavingNotes(true);
    try {
      const timestamp = formatNoteTimestamp();
      const imgTags = pendingImages.map((url) => `[img:${url}]`).join("\n");
      const noteText = [newNote.trim(), imgTags].filter(Boolean).join("\n");
      const entry = `[${timestamp}]\n${noteText}`;
      const existing = prospect.notes?.trim() || "";
      const updated = existing ? `${existing}\n---\n${entry}` : entry;

      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, notes: updated }),
      });
      setProspect({ ...prospect, notes: updated });
      setNewNote("");
      setPendingImages([]);
      setTimeout(fetchActivities, 500);
    } catch {
      console.error("Failed to save note");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleLogCall() {
    if (!prospect) return;
    setLoggingCall(true);
    try {
      const timestamp = formatNoteTimestamp();
      const callEntry = `[${timestamp}]\nCall — ${callOutcome}${callNote.trim() ? `: ${callNote.trim()}` : ""}`;
      const existing = prospect.notes?.trim() || "";
      const updatedNotes = existing ? `${existing}\n---\n${callEntry}` : callEntry;

      const patchBody: Record<string, unknown> = {
        id: prospect.id,
        notes: updatedNotes,
        last_contacted_at: new Date().toISOString(),
      };
      if (prospect.status === "new") {
        patchBody.status = "contacted";
      }

      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      setProspect({
        ...prospect,
        notes: updatedNotes,
        last_contacted_at: new Date().toISOString(),
        status: prospect.status === "new" ? "contacted" : prospect.status,
      });
      setCallNote("");
      setCallOutcome("Answered");
      setShowCallDialog(false);
      setTimeout(fetchActivities, 500);
    } catch {
      console.error("Failed to log call");
    } finally {
      setLoggingCall(false);
    }
  }

  async function handleAddTag(tag: string) {
    if (!prospect) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    const currentTags = prospect.tags || [];
    if (currentTags.includes(trimmed)) { setNewTag(""); return; }
    const newTags = [...currentTags, trimmed];
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, tags: newTags }),
      });
      setProspect({ ...prospect, tags: newTags });
      setNewTag("");
    } catch {
      toast.error("Failed to add tag");
    }
  }

  async function handleRemoveTag(tag: string) {
    if (!prospect) return;
    const newTags = (prospect.tags || []).filter((t) => t !== tag);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, tags: newTags }),
      });
      setProspect({ ...prospect, tags: newTags });
    } catch {
      toast.error("Failed to remove tag");
    }
  }

  async function handleInlineEditSave() {
    if (!prospect || !editing) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospect.id, [editing]: editValue || null }),
      });
      if (res.ok) {
        setProspect({ ...prospect, [editing]: editValue || null } as ProspectWithAnalysis);
        toast.success("Updated");
        setEditing(null);
        setEditValue("");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingEdit(false);
    }
  }

  function startEdit(field: "phone" | "email" | "business_name") {
    setEditing(field);
    setEditValue((prospect as Record<string, unknown>)?.[field] as string || "");
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakdown = (prospect as any).lead_score_breakdown;
  const colorClass = leadScore >= 70
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : leadScore >= 40
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  const noteLog = parseNoteLog(prospect.notes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Top row: back + prev/next + title */}
        <div className="flex items-start gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {/* Prev/Next navigation */}
          {listIds.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 mt-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={listIndex <= 0}
                onClick={() => router.push(`/leads/${listIds[listIndex - 1]}`)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {listIndex + 1}/{listIds.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={listIndex >= listIds.length - 1}
                onClick={() => router.push(`/leads/${listIds[listIndex + 1]}`)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {editing === "business_name" ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-9 text-xl font-bold flex-1 text-base sm:text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleInlineEditSave(); if (e.key === "Escape") cancelEdit(); }}
                  />
                  <Button size="sm" onClick={handleInlineEditSave} disabled={savingEdit}>
                    {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold break-words">{prospect.business_name}</h1>
                  <button
                    onClick={() => startEdit("business_name")}
                    className="md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 p-1"
                    title="Edit business name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {leadScore > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-help ${colorClass}`}>
                        <TrendingUp className="h-3 w-3" />
                        Score: {leadScore}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-56">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold mb-2">Score Breakdown</p>
                        {breakdown && Object.entries({
                          website_quality: "Website Opportunity",
                          contactability: "Contactability",
                          business_activity: "Business Activity",
                          quality_signal: "Quality Signal",
                          hot_lead_bonus: "Hot Lead Bonus 🔥",
                        }).map(([key, label]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <span className="font-medium">+{(breakdown as any)[key] ?? 0}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1.5 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{leadScore}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {prospect.business_type && (
                <Badge variant="secondary">{prospect.business_type}</Badge>
              )}
              {(() => {
                const days = Math.floor((Date.now() - new Date(prospect.created_at).getTime()) / 86400000);
                const label = days === 0 ? "Added today" : days === 1 ? "Added yesterday" : `Added ${days} days ago`;
                return <span className="text-xs text-muted-foreground">{label}</span>;
              })()}
              {prospect.rating != null && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {prospect.rating} ({prospect.review_count} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action row: status full-width on mobile, buttons below */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
          <div className="flex flex-col gap-1 w-full sm:flex-1 sm:min-w-[160px]">
            <Select value={prospect.status} onValueChange={handleStatusChange} disabled={savingStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {prospect.status === "follow_up" && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs shrink-0" onClick={handleFollowUpDateSave} disabled={savingStatus}>
                  {savingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                </Button>
              </div>
            )}
            {prospect.status === "call_scheduled" && (
              <div className="flex items-center gap-1">
                <Input
                  type="datetime-local"
                  value={callScheduledAt}
                  onChange={(e) => setCallScheduledAt(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={async () => {
                  await fetch("/api/prospects", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: prospect.id, call_scheduled_at: callScheduledAt || null }),
                  });
                }}>
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(prospect as any).loss_reason && (
              <p className="text-xs text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                Lost reason: {(prospect as any).loss_reason}{(prospect as any).loss_reason_detail ? ` — ${(prospect as any).loss_reason_detail}` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:contents">
            <Button variant="outline" size="sm" onClick={() => {
              const pitch = generatePitch(prospect, analysis);
              navigator.clipboard.writeText(pitch);
              toast.success("Pitch copied to clipboard!");
            }} className="flex-1 sm:flex-none">
              <Copy className="mr-1 h-4 w-4" />
              Pitch
            </Button>
            <Link href={`/generator?prospect=${prospect.id}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full">
                <Palette className="mr-1 h-4 w-4" />
                Generate
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="shrink-0 px-3">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Phone */}
                {editing === "phone" ? (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 flex-1"
                      autoFocus
                      placeholder="(512) 555-0100"
                      onKeyDown={(e) => { if (e.key === "Enter") handleInlineEditSave(); if (e.key === "Escape") cancelEdit(); }}
                    />
                    <Button size="sm" onClick={handleInlineEditSave} disabled={savingEdit}>
                      {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="col-span-full sm:col-span-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <a href={prospect.phone ? `tel:${prospect.phone}` : undefined} className="flex flex-1 items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 min-w-0">
                        <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium truncate">{prospect.phone || <span className="text-muted-foreground italic text-sm">Not set</span>}</p>
                        </div>
                      </a>
                      <button
                        onClick={() => startEdit("phone")}
                        className="text-muted-foreground hover:text-foreground transition-colors p-2 shrink-0"
                        title="Edit phone"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {prospect.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCallDialog(true)}
                        className="w-full h-9"
                      >
                        <Phone className="h-3.5 w-3.5 mr-2" />
                        Log Call
                      </Button>
                    )}
                  </div>
                )}

                {/* Email */}
                {editing === "email" ? (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 flex-1"
                      autoFocus
                      placeholder="email@example.com"
                      onKeyDown={(e) => { if (e.key === "Enter") handleInlineEditSave(); if (e.key === "Escape") cancelEdit(); }}
                    />
                    <Button size="sm" onClick={handleInlineEditSave} disabled={savingEdit}>
                      {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <a href={prospect.email ? `mailto:${prospect.email}` : undefined} className="flex flex-1 items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{prospect.email || <span className="text-muted-foreground italic text-sm">Not set</span>}</p>
                      </div>
                    </a>
                    <button
                      onClick={() => startEdit("email")}
                      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1.5 shrink-0"
                      title="Edit email"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                  <div className="flex items-center gap-3 rounded-lg border p-3 col-span-full">
                    <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium break-words">{prospect.address}</p>
                    </div>
                  </div>
                )}

                {/* Navigate button */}
                {(prospect.google_maps_url || prospect.address) && (
                  <a
                    href={
                      prospect.google_maps_url ||
                      `https://maps.google.com/?q=${encodeURIComponent(
                        [prospect.address, prospect.city, prospect.state]
                          .filter(Boolean)
                          .join(", ")
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 col-span-full sm:col-span-1"
                  >
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Navigate</p>
                      <p className="font-medium flex items-center gap-1">
                        Open in Maps <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </a>
                )}

                {/* Facebook search */}
                <a
                  href={`https://www.facebook.com/search/top?q=${encodeURIComponent(`${prospect.business_name} ${prospect.city || ""}`.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <div>
                    <p className="text-xs text-muted-foreground">Facebook</p>
                    <p className="font-medium flex items-center gap-1">Find on Facebook <ExternalLink className="h-3 w-3" /></p>
                  </div>
                </a>

                {/* Google search */}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${prospect.business_name} ${prospect.city || ""} ${prospect.state || ""}`.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <div>
                    <p className="text-xs text-muted-foreground">Google</p>
                    <p className="font-medium flex items-center gap-1">Search on Google <ExternalLink className="h-3 w-3" /></p>
                  </div>
                </a>

                {/* Find Email button (only when no email set and has website) */}
                {!prospect.email && prospect.website_url && (
                  <button
                    onClick={async () => {
                      setFindingEmail(true);
                      try {
                        const res = await fetch(`/api/prospects/${prospect.id}/find-email`, { method: "POST" });
                        const data = await res.json();
                        if (data.found) {
                          setProspect(p => p ? { ...p, email: data.email } : p);
                          toast.success(`Email found: ${data.email}`);
                        } else {
                          toast.error("No email found on their website");
                        }
                      } catch { toast.error("Search failed"); }
                      finally { setFindingEmail(false); }
                    }}
                    disabled={findingEmail}
                    className="flex items-center gap-3 rounded-lg border border-dashed p-3 hover:bg-muted/50 w-full text-left"
                  >
                    {findingEmail
                      ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      : <Mail className="h-5 w-5 text-muted-foreground" />
                    }
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-muted-foreground">{findingEmail ? "Searching..." : "Find Email"}</p>
                    </div>
                  </button>
                )}
              </div>
              {!prospect.phone && !prospect.email && !prospect.website_url && editing !== "phone" && editing !== "email" && (
                <p className="text-muted-foreground">No contact information available.</p>
              )}
              {/* Last contacted */}
              {prospect.last_contacted_at && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last contacted: {relativeTime(prospect.last_contacted_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Keep track of your interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing note log */}
              {noteLog.length > 0 && (
                <div className="space-y-3 max-h-72 overflow-y-auto overflow-x-hidden rounded-lg border bg-muted/30 p-3">
                  {noteLog.map((entry, i) => (
                    <div key={i} className="text-sm group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-600 mb-1">
                            {entry.timestamp || "Note (no date)"}
                          </p>
                          {editingNoteIndex === i ? (
                            <div className="space-y-2 mt-1">
                              <Textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                rows={3}
                                className="text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveNoteEdit(i)} disabled={savingNotes}>
                                  {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingNoteIndex(null); setEditingNoteText(""); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{entry.text || <span className="text-muted-foreground italic text-xs">Photo only</span>}</p>
                          )}
                        </div>
                        {editingNoteIndex !== i && (
                          <div className="flex gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingNoteIndex(i); setEditingNoteText(entry.text); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit note"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(i)}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50"
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {i < noteLog.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Attachment thumbnails — all images across all notes */}
              {(() => {
                const allImages = noteLog.flatMap((e) => e.images || []);
                if (allImages.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">📎 Attachments ({allImages.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {allImages.map((url, i) => (
                        <button key={i} onClick={() => setLightboxUrl(url)} className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Attachment ${i + 1}`}
                            className="h-16 w-16 rounded-lg border object-cover hover:opacity-80 active:opacity-60 transition-opacity cursor-zoom-in"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Quick insert templates */}
              <div className="flex flex-wrap gap-1.5">
                <p className="text-xs text-muted-foreground w-full mb-0.5">Quick insert:</p>
                {NOTE_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewNote((prev) => (prev ? `${prev} — ${t}` : t))}
                    className="text-xs rounded-full border px-2.5 py-1.5 hover:bg-muted transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Add new note */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Add a note</Label>
                <Textarea
                  placeholder="Add a new note about this prospect..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="text-base sm:text-sm"
                />

                {/* Pending image previews */}
                {pendingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pendingImages.map((url, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Pending ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border" />
                        <button
                          onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleAddNote}
                    disabled={savingNotes || (!newNote.trim() && pendingImages.length === 0)}
                    size="sm"
                  >
                    {savingNotes ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                    Add Note
                  </Button>

                  {/* Image upload button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        for (const file of files) await handleImageUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <span className={`inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {uploadingImage ? "Uploading…" : "Add Photo"}
                    </span>
                  </label>
                </div>
              </div>
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
                <div className="relative space-y-0 overflow-hidden">
                  {activities.map((act, i) => (
                    <div key={act.id} className="flex gap-3 pb-4 min-w-0">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground mt-0.5">
                          <ActivityIcon type={act.activity_type} />
                        </div>
                        {i < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        {(() => {
                          const raw = act.description || "";
                          const photoMatch = raw.match(/\[photos:([^\]]+)\]/);
                          const photoUrls = photoMatch ? photoMatch[1].split("|").filter(Boolean) : [];
                          const cleanDesc = raw
                            .replace(/\n?\[photos:[^\]]+\]/g, "")
                            .replace(/\[img:https?:\/\/[^\]]+\]/g, "")
                            .replace(/\s+/g, " ")
                            .trim();
                          return (
                            <>
                              <p className="text-sm break-words">{cleanDesc}</p>
                              {photoUrls.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {photoUrls.map((url, pi) => (
                                    <button key={pi} onClick={() => setLightboxUrl(url)} className="shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`Screenshot ${pi + 1}`}
                                        className="h-10 w-10 rounded object-cover border hover:opacity-80 transition-opacity cursor-zoom-in"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <p className="text-xs text-muted-foreground mt-0.5">
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

        {/* Right column: Website Analysis + Tags */}
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

          {/* Deal Value */}
          {prospect.status === "client" && (prospect as any).deal_value && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly Value</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="font-semibold text-emerald-700">${(prospect as any).deal_value}/mo</p>
              </div>
            </div>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current tags */}
              <div className="flex flex-wrap gap-1.5">
                {(prospect.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {(prospect.tags || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No tags yet</p>
                )}
              </div>

              {/* Preset suggestions */}
              <div className="flex flex-wrap gap-1">
                {PRESET_TAGS.filter((t) => !(prospect.tags || []).includes(t)).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="text-xs border rounded-full px-2 py-0.5 hover:bg-muted text-muted-foreground"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag(newTag)}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddTag(newTag)}
                  className="h-8"
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Talking Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getTalkingPoints(prospect, analysis).map((point, i) => (
                  <li key={i} className="text-sm">{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Lightbox — portal to document.body, bypasses layout stacking */}
      {lightboxUrl && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white/60 text-sm">Tap × to close</span>
            <button
              onClick={() => setLightboxUrl(null)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white text-2xl leading-none hover:bg-white/30 active:bg-white/40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Image — tap background to close */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={() => setLightboxUrl(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Full size attachment"
              style={{ maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100vh - 80px)" }}
              className="w-auto h-auto object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Win/Loss Dialog */}
      <Dialog open={showLossDialog} onOpenChange={(open) => { if (!open) { setShowLossDialog(false); setPendingStatus(null); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Why did this lead go cold?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason..." /></SelectTrigger>
              <SelectContent>
                {["Price", "Bad timing", "Already has someone", "No budget", "Not interested in website", "Happy with current situation", "Other"].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lossReason === "Other" && (
              <Textarea placeholder="What happened?" value={lossDetail} onChange={e => setLossDetail(e.target.value)} rows={2} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLossDialog(false); setPendingStatus(null); }}>Cancel</Button>
            <Button onClick={handleLossConfirm} disabled={!lossReason}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Value Dialog */}
      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xs">
          <DialogHeader><DialogTitle>🎉 New Client!</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">What&apos;s the monthly value of this contract?</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input type="number" placeholder="500" value={pendingDealValue}
              onChange={e => setPendingDealValue(e.target.value)} className="h-9" />
            <span className="text-muted-foreground text-sm">/mo</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDealDialog(false)}>Skip</Button>
            <Button onClick={async () => {
              if (pendingDealValue) {
                await fetch("/api/prospects", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: prospect!.id, deal_value: parseFloat(pendingDealValue) }),
                });
                setProspect(p => p ? { ...p, deal_value: parseFloat(pendingDealValue) } as ProspectWithAnalysis : p);
                setDealValue(pendingDealValue);
              }
              setShowDealDialog(false);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Log Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Log Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Outcome</Label>
              <Select value={callOutcome} onValueChange={setCallOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Answered">Answered</SelectItem>
                  <SelectItem value="Voicemail">Voicemail</SelectItem>
                  <SelectItem value="No Answer">No Answer</SelectItem>
                  <SelectItem value="Callback Requested">Callback Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="What was said..."
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                rows={3}
                className="text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>Cancel</Button>
            <Button onClick={handleLogCall} disabled={loggingCall}>
              {loggingCall ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
