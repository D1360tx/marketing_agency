"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteScoreBadge, NoWebsiteBadge } from "@/components/website-score-badge";
import {
  Phone,
  Mail,
  Loader2,
  Users,
  LayoutGrid,
  List,
  Download,
  Trash2,
  GripVertical,
  Search,
  ExternalLink,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  UserPlus,
  ChevronDown,
  MapPin,
  Archive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ProspectStatus, ProspectWithAnalysis } from "@/types";

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

const pipelineStatuses: ProspectStatus[] = ["new", "contacted", "interested", "follow_up", "call_scheduled", "client"];

const activeStatuses: ProspectStatus[] = ["new", "contacted", "interested", "follow_up"];

function getDaysSince(dateStr: string | null | undefined, fallback: string): number {
  const ref = dateStr || fallback;
  const ms = Date.now() - new Date(ref).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function StalenessBadge({ prospect }: { prospect: ProspectWithAnalysis }) {
  if (!activeStatuses.includes(prospect.status as ProspectStatus)) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = getDaysSince((prospect as any).last_contacted_at, prospect.created_at);
  if (days < 5) return null;
  const color = days >= 10
    ? "bg-red-100 text-red-700 border-red-200"
    : "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      {days}d ago
    </span>
  );
}

type SortField = "business_name" | "rating" | "lead_score" | "status" | "created_at";

export default function LeadsPage() {
  const [prospects, setProspects] = useState<ProspectWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField>("lead_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ business_name: "", phone: "", email: "", city: "", state: "", business_type: "", notes: "", source: "Facebook Group" });
  const [addLoading, setAddLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [phoneDuplicate, setPhoneDuplicate] = useState<ProspectWithAnalysis | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [showArchived, setShowArchived] = useState(false);

  // Quick Call state
  const [quickCallProspect, setQuickCallProspect] = useState<ProspectWithAnalysis | null>(null);
  const [quickCallOutcome, setQuickCallOutcome] = useState("Answered");
  const [quickCallNote, setQuickCallNote] = useState("");
  const [quickCallLoading, setQuickCallLoading] = useState(false);

  async function handleQuickCall() {
    if (!quickCallProspect) return;
    setQuickCallLoading(true);
    try {
      const timestamp = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const callEntry = `[${timestamp}]\nCall — ${quickCallOutcome}${quickCallNote.trim() ? `: ${quickCallNote.trim()}` : ""}`;
      const existing = quickCallProspect.notes?.trim() || "";
      const appendedNote = existing ? `${existing}\n---\n${callEntry}` : callEntry;
      const autoPromote = quickCallProspect.status === "new" ? "contacted" : quickCallProspect.status;

      const res = await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quickCallProspect.id,
          last_contacted_at: new Date().toISOString(),
          notes: appendedNote,
          status: autoPromote,
        }),
      });

      if (!res.ok) { toast.error("Failed to log call"); return; }

      setProspects((prev) =>
        prev.map((p) =>
          p.id === quickCallProspect.id
            ? {
                ...p,
                last_contacted_at: new Date().toISOString(),
                notes: appendedNote,
                status: autoPromote as ProspectStatus,
              }
            : p
        )
      );
      setQuickCallProspect(null);
      setQuickCallOutcome("Answered");
      setQuickCallNote("");
      toast.success("Call logged!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setQuickCallLoading(false);
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to add lead"); return; }
      setProspects((prev) => [data.prospect, ...prev]);
      setShowAddDialog(false);
      setAddForm({ business_name: "", phone: "", email: "", city: "", state: "", business_type: "", notes: "", source: "Facebook Group" });
      toast.success("Lead added!");
    } catch { toast.error("Something went wrong"); }
    finally { setAddLoading(false); }
  }

  function handlePhoneBlur(phone: string) {
    const normalized = phone.replace(/\D/g, "");
    if (!normalized) { setPhoneDuplicate(null); return; }
    const dup = prospects.find((p) => p.phone && p.phone.replace(/\D/g, "") === normalized);
    setPhoneDuplicate(dup || null);
  }

  async function handleCsvImport() {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvProgress(null);
    setCsvResult(null);

    const text = await csvFile.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { setCsvResult("⚠️ File is empty or has no data rows."); setCsvImporting(false); return; }

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
    const rows = lines.slice(1);

    let imported = 0;
    let skipped = 0;
    let duplicates = 0;

    // Build sets of existing phones and emails for dupe detection
    const existingPhones = new Set(
      prospects.map(p => p.phone?.replace(/\D/g, "")).filter(Boolean) as string[]
    );
    const existingEmails = new Set(
      prospects.map(p => p.email?.toLowerCase()).filter(Boolean) as string[]
    );

    for (let i = 0; i < rows.length; i++) {
      setCsvProgress(`Importing ${i + 1}/${rows.length}...`);
      const cols = rows[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const get = (key: string) => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? cols[idx] || "" : "";
      };

      const businessName = get("business name") || get("name") || get("business_name");
      if (!businessName) { skipped++; continue; }

      // Check for duplicates
      const rowPhone = get("phone")?.replace(/\D/g, "");
      const rowEmail = get("email")?.toLowerCase();
      if ((rowPhone && existingPhones.has(rowPhone)) || (rowEmail && existingEmails.has(rowEmail))) {
        duplicates++;
        skipped++;
        continue;
      }

      try {
        const res = await fetch("/api/prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_name: businessName,
            phone: get("phone") || null,
            email: get("email") || null,
            city: get("city") || null,
            business_type: get("business type") || get("business_type") || null,
            source: "CSV Import",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProspects((prev) => [data.prospect, ...prev]);
          imported++;
          // Add to sets to catch intra-CSV dupes
          if (data.prospect?.phone) existingPhones.add(data.prospect.phone.replace(/\D/g, ""));
          if (data.prospect?.email) existingEmails.add(data.prospect.email.toLowerCase());
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    setCsvProgress(null);
    setCsvResult(`✅ ${imported} imported${duplicates > 0 ? `, ⏭️ ${duplicates} duplicates skipped` : ""}${(skipped - duplicates) > 0 ? `, ⚠️ ${skipped - duplicates} skipped (missing name or error)` : ""}`);
    setCsvImporting(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    try {
      const res = await fetch("/api/prospects");
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch {
      console.error("Failed to fetch prospects");
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = useCallback(async (id: string, status: ProspectStatus) => {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch {
      console.error("Failed to update status");
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  async function handleInlineStatusChange(id: string, status: ProspectStatus) {
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch {
      console.error("Failed to update status");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleBulkMove(status: ProspectStatus) {
    for (const id of selected) {
      await updateStatus(id, status);
    }
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    for (const id of selected) {
      await fetch("/api/prospects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    setProspects((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  }

  function handleExportCSV() {
    const rows = filtered.map((p) => ({
      "Business Name": p.business_name,
      Phone: p.phone || "",
      Email: p.email || "",
      Website: p.website_url || "",
      City: p.city || "",
      State: p.state || "",
      Rating: p.rating ?? "",
      Reviews: p.review_count ?? "",
      Status: p.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Source: (p as any).source || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Tags: ((p as any).tags || []).join("; "),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "Follow Up Date": (p as any).follow_up_date || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "Last Contacted": (p as any).last_contacted_at ? new Date((p as any).last_contacted_at).toLocaleDateString() : "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "Lead Score": (p as any).lead_score ?? "",
      Grade: p.website_analyses?.[0]?.overall_grade || "",
      Notes: (p.notes || "").replace(/\n/g, " | ").slice(0, 500),
      "Added": new Date(p.created_at).toLocaleDateString(),
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h as keyof typeof r]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booked-out-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleInstantlyExport(params?: string) {
    setExportLoading(true);
    try {
      const url = `/api/prospects/export${params ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "instantly-leads.csv";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("Instantly CSV downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const prospectId = String(active.id);
    const newStatus = String(over.id) as ProspectStatus;

    if (pipelineStatuses.includes(newStatus)) {
      const prospect = prospects.find((p) => p.id === prospectId);
      if (prospect && prospect.status !== newStatus) {
        updateStatus(prospectId, newStatus);
      }
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "business_name" ? "asc" : "desc");
    }
  }

  // Unique tags across all prospects for the tag filter
  const allTags = Array.from(
    new Set(prospects.flatMap((p) => p.tags || []))
  ).sort();

  const filtered = prospects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.business_name.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.business_type?.toLowerCase().includes(term) ||
      p.phone?.replace(/\D/g, "").includes(term.replace(/\D/g, "")) ||
      p.email?.toLowerCase().includes(term) ||
      p.notes?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchesSource = sourceFilter === "all" || (p as any).source === sourceFilter;
    const matchesTag = tagFilter === "all" || p.tags?.includes(tagFilter);
    const matchesArchived = showArchived || !["not_interested", "lost"].includes(p.status);
    return matchesSearch && matchesStatus && matchesSource && matchesTag && matchesArchived;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "business_name":
        return dir * a.business_name.localeCompare(b.business_name);
      case "rating":
        return dir * ((a.rating ?? 0) - (b.rating ?? 0));
      case "lead_score": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sa = (a as any).lead_score ?? 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = (b as any).lead_score ?? 0;
        return dir * (sa - sb);
      }
      case "status": {
        const statusOrder: Record<string, number> = { new: 0, contacted: 1, interested: 2, client: 3, not_interested: 4, lost: 5 };
        return dir * ((statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0));
      }
      case "created_at":
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  const sortedIds = sorted.map((p) => p.id);

  const grouped = pipelineStatuses.reduce(
    (acc, status) => {
      acc[status] = filtered
        .filter((p) => p.status === status)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a, b) => ((b as any).lead_score ?? 0) - ((a as any).lead_score ?? 0));
      return acc;
    },
    {} as Record<ProspectStatus, ProspectWithAnalysis[]>
  );

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} in your pipeline
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Quick Add Lead
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCsvFile(null); setCsvProgress(null); setCsvResult(null); setShowCsvDialog(true); }}>
            <Download className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exportLoading}>
                {exportLoading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Export to Instantly</span>
                <span className="sm:hidden">Export</span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Instantly.ai Export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleInstantlyExport()}>
                <Download className="mr-2 h-4 w-4" />
                All leads with email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInstantlyExport("sequence=A")}>
                <Download className="mr-2 h-4 w-4" />
                Sequence A — Review Gap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInstantlyExport("sequence=B")}>
                <Download className="mr-2 h-4 w-4" />
                Sequence B — No Website (Hot)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline ml-1">Board</span>
          </Button>
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" /><span className="hidden sm:inline ml-1">Table</span>
          </Button>
        </div>
      </div>

      {/* Filters + Bulk actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, city, phone, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 flex-1 sm:flex-none sm:w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-9 flex-1 sm:flex-none sm:w-[140px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Cold Call">Cold Call</SelectItem>
              <SelectItem value="Door Knock">Door Knock</SelectItem>
              <SelectItem value="Facebook Group">Facebook Group</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Cold Email">Cold Email</SelectItem>
              <SelectItem value="CSV Import">CSV Import</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-9 flex-1 sm:flex-none sm:w-[140px]">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none">
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(prev => !prev)}
            className="flex-1 sm:flex-none"
          >
            <Archive className="mr-1 h-4 w-4" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (() => {
        const selectedProspects = filtered.filter(p => selected.has(p.id));
        const hasArchived = selectedProspects.some(p => ["not_interested", "lost"].includes(p.status));
        return (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <span className="text-sm font-medium whitespace-nowrap">{selected.size} selected</span>
            <Select onValueChange={(v) => handleBulkMove(v as ProspectStatus)}>
              <SelectTrigger className="h-8 w-[140px] flex-1 sm:flex-none">
                <SelectValue placeholder="Move to..." />
              </SelectTrigger>
              <SelectContent>
                {pipelineStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                ))}
                <SelectItem value="not_interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
            {hasArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkMove("new" as ProspectStatus)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
              >
                ↩ Re-activate as New
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex-1 sm:flex-none">
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="flex-1 sm:flex-none">
              Clear
            </Button>
          </div>
        );
      })()}

      {/* Kanban view */}
      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-6" style={{ minWidth: "min(100%, 1200px)" }}>
              {pipelineStatuses.map((status) => (
                <div key={status} className="w-72 shrink-0 md:w-auto">
                  <DroppableColumn
                    id={status}
                    label={statusConfig[status].label}
                    color={statusConfig[status].color}
                    count={grouped[status]?.length || 0}
                  >
                    {(grouped[status] || []).map((prospect) => (
                      <DraggableCard
                        key={prospect.id}
                        prospect={prospect}
                        onLogCall={setQuickCallProspect}
                        listIds={sortedIds}
                      />
                    ))}
                  </DroppableColumn>
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeProspect && <ProspectMiniCard prospect={activeProspect} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-x-auto">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <SortableHead field="business_name" current={sortField} direction={sortDirection} onSort={handleSort}>
                    Business
                  </SortableHead>
                  <SortableHead field="lead_score" current={sortField} direction={sortDirection} onSort={handleSort} className="hidden sm:table-cell">
                    Score
                  </SortableHead>
                  <TableHead>Contact</TableHead>
                  <SortableHead field="rating" current={sortField} direction={sortDirection} onSort={handleSort} className="hidden md:table-cell">
                    Rating
                  </SortableHead>
                  <TableHead className="text-center hidden md:table-cell">Grade</TableHead>
                  <SortableHead field="status" current={sortField} direction={sortDirection} onSort={handleSort}>
                    Status
                  </SortableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((prospect) => {
                  const analysis = prospect.website_analyses?.[0];
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const leadScore = (prospect as any).lead_score ?? 0;
                  return (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(prospect.id)}
                          onCheckedChange={() => toggleSelect(prospect.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/leads/${prospect.id}`}
                          className="hover:underline"
                          onClick={() => sessionStorage.setItem("leadListIds", JSON.stringify(sortedIds))}
                        >
                          <div className="font-medium">{prospect.business_name}</div>
                        </Link>
                        {prospect.business_type && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {prospect.business_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <LeadScoreBadge score={leadScore} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {prospect.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {prospect.phone}
                            </div>
                          )}
                          {prospect.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {prospect.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        {prospect.rating != null && (
                          <span className="text-sm">{prospect.rating}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        {analysis ? (
                          <WebsiteScoreBadge grade={analysis.overall_grade} />
                        ) : !prospect.website_url ? (
                          <NoWebsiteBadge />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {updatingStatus[prospect.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Select
                              value={prospect.status}
                              onValueChange={(v) => handleInlineStatusChange(prospect.id, v as ProspectStatus)}
                              disabled={updatingStatus[prospect.id]}
                            >
                              <SelectTrigger className={`h-7 w-auto min-w-[120px] border text-xs font-medium ${statusConfig[prospect.status].color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                  <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <StalenessBadge prospect={prospect} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/leads/${prospect.id}`}
                          onClick={() => sessionStorage.setItem("leadListIds", JSON.stringify(sortedIds))}
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8" />
                      No leads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Quick Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="space-y-1">
              <Label>Business Name *</Label>
              <Input placeholder="Mike's Plumbing" value={addForm.business_name} onChange={(e) => setAddForm({...addForm, business_name: e.target.value})} required className="text-base sm:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  placeholder="(512) 555-0100"
                  value={addForm.phone}
                  onChange={(e) => { setAddForm({...addForm, phone: e.target.value}); setPhoneDuplicate(null); }}
                  onBlur={(e) => handlePhoneBlur(e.target.value)}
                  className="text-base sm:text-sm"
                />
                {phoneDuplicate && (
                  <p className="text-xs text-amber-600">
                    ⚠️ This phone number already exists —{" "}
                    <Link href={`/leads/${phoneDuplicate.id}`} className="underline font-medium">{phoneDuplicate.business_name}</Link>
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="mike@example.com" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} className="text-base sm:text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input placeholder="Dripping Springs" value={addForm.city} onChange={(e) => setAddForm({...addForm, city: e.target.value})} className="text-base sm:text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Business Type</Label>
                <Input placeholder="Plumber" value={addForm.business_type} onChange={(e) => setAddForm({...addForm, business_type: e.target.value})} className="text-base sm:text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm({...addForm, source: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Door Knock">Door Knock</SelectItem>
                  <SelectItem value="Facebook Group">Facebook Group</SelectItem>
                  <SelectItem value="Cold Email">Cold Email</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea placeholder="Saw them in DS Neighbors group, does masonry work..." value={addForm.notes} onChange={(e) => setAddForm({...addForm, notes: e.target.value})} rows={3} className="text-base sm:text-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              CSV must have columns: <strong>Business Name</strong>, Phone (optional), Email (optional), City (optional), Business Type (optional)
            </p>
            <div className="space-y-1">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => { setCsvFile(e.target.files?.[0] || null); setCsvResult(null); setCsvProgress(null); }}
              />
            </div>
            {csvProgress && <p className="text-sm text-muted-foreground">{csvProgress}</p>}
            {csvResult && <p className="text-sm font-medium">{csvResult}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCsvDialog(false)}>Close</Button>
            <Button onClick={handleCsvImport} disabled={!csvFile || csvImporting}>
              {csvImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Call Dialog */}
      <Dialog open={!!quickCallProspect} onOpenChange={(open) => !open && setQuickCallProspect(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Call — {quickCallProspect?.business_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Outcome</Label>
              <Select value={quickCallOutcome} onValueChange={setQuickCallOutcome}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                value={quickCallNote}
                onChange={(e) => setQuickCallNote(e.target.value)}
                rows={3}
                className="text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCallProspect(null)}>Cancel</Button>
            <Button onClick={handleQuickCall} disabled={quickCallLoading}>
              {quickCallLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Sort Header ---------- */

function SortableHead({
  field,
  current,
  direction,
  onSort,
  children,
  className,
}: {
  field: SortField;
  current: SortField;
  direction: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = field === current;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowDown className="h-3 w-3 opacity-0" />
        )}
      </button>
    </TableHead>
  );
}

/* ---------- Lead Score Badge ---------- */

function LeadScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : score >= 40
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <TrendingUp className="h-3 w-3" />
      {score}
    </div>
  );
}

/* ---------- Kanban components ---------- */

function DroppableColumn({
  id,
  label,
  color,
  count,
  children,
}: {
  id: string;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card ref={setNodeRef} className={isOver ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <Badge variant="outline" className={color}>{label}</Badge>
          <span className="text-muted-foreground">{count}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 min-h-[100px]">
        {children}
        {count === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Drag leads here
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableCard({
  prospect,
  onLogCall,
  listIds,
}: {
  prospect: ProspectWithAnalysis;
  onLogCall?: (p: ProspectWithAnalysis) => void;
  listIds?: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable(prospect.id);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : ""}
      {...attributes}
      {...listeners}
    >
      <ProspectMiniCard prospect={prospect} onLogCall={onLogCall} listIds={listIds} />
    </div>
  );
}

function useDraggable(id: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@dnd-kit/core").useDraggable({ id });
  return { attributes, listeners, setNodeRef, transform, isDragging };
}

function getLastNotePreview(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const lastSep = notes.lastIndexOf("\n---\n");
  const lastEntry = lastSep >= 0 ? notes.slice(lastSep + 5).trim() : notes.trim();
  const lines = lastEntry.split("\n");
  const text = lines[0]?.match(/^\[.+\]$/) ? lines.slice(1).join(" ").trim() : lastEntry;
  return text.slice(0, 70) + (text.length > 70 ? "…" : "");
}

function ProspectMiniCard({
  prospect,
  onLogCall,
  listIds,
}: {
  prospect: ProspectWithAnalysis;
  onLogCall?: (p: ProspectWithAnalysis) => void;
  listIds?: string[];
}) {
  const analysis = prospect.website_analyses?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadScore = (prospect as any).lead_score ?? 0;

  const mapsHref =
    prospect.google_maps_url ||
    `https://maps.google.com/?q=${encodeURIComponent(
      [prospect.address, prospect.city, prospect.state].filter(Boolean).join(", ")
    )}`;

  return (
    <Link
      href={`/leads/${prospect.id}`}
      onClick={() => {
        if (listIds) sessionStorage.setItem("leadListIds", JSON.stringify(listIds));
      }}
    >
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-3">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-sm font-medium leading-tight truncate">
                  {prospect.business_name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {analysis ? (
                  <WebsiteScoreBadge grade={analysis.overall_grade} />
                ) : !prospect.website_url ? (
                  <NoWebsiteBadge />
                ) : null}
                {onLogCall && prospect.phone && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onLogCall(prospect);
                    }}
                    className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Log Call"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                )}
                {(prospect.google_maps_url || prospect.address) && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Open in Maps"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {[prospect.city, prospect.state].filter(Boolean).join(", ")}
              </p>
              <div className="flex items-center gap-1">
                <StalenessBadge prospect={prospect} />
                {leadScore > 0 && <LeadScoreBadge score={leadScore} />}
              </div>
            </div>
            {prospect.follow_up_date && (
              <p className="text-xs font-medium text-orange-500">
                📅 {new Date(prospect.follow_up_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {prospect.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5" /> {prospect.phone}
                </span>
              )}
              {prospect.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" /> Email
                </span>
              )}
            </div>
            {prospect.tags && prospect.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {prospect.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {(() => {
              const preview = getLastNotePreview(prospect.notes);
              return preview ? (
                <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2 mt-0.5">
                  {preview}
                </p>
              ) : null;
            })()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
