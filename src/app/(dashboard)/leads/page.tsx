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
import { WebsiteScoreBadge, NoWebsiteBadge } from "@/components/website-score-badge";
import {
  Phone,
  Mail,
  Globe,
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ProspectStatus, ProspectWithAnalysis } from "@/types";

const statusConfig: Record<ProspectStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800 border-purple-200" },
  interested: { label: "Interested", color: "bg-amber-100 text-amber-800 border-amber-200" },
  client: { label: "Client", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  not_interested: { label: "Not Interested", color: "bg-gray-100 text-gray-800 border-gray-200" },
  lost: { label: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
};

const pipelineStatuses: ProspectStatus[] = ["new", "contacted", "interested", "client"];

type SortField = "business_name" | "rating" | "lead_score" | "status" | "created_at";

export default function LeadsPage() {
  const [prospects, setProspects] = useState<ProspectWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField>("lead_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ business_name: "", phone: "", email: "", city: "", state: "", business_type: "", notes: "", source: "Facebook Group" });
  const [addLoading, setAddLoading] = useState(false);

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
      Name: p.business_name,
      Phone: p.phone || "",
      Email: p.email || "",
      Website: p.website_url || "",
      City: p.city || "",
      State: p.state || "",
      Rating: p.rating || "",
      Status: p.status,
      Grade: p.website_analyses?.[0]?.overall_grade || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Score: (p as any).lead_score ?? "",
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
    a.download = "leads-export.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  const filtered = prospects.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.business_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const grouped = pipelineStatuses.reduce(
    (acc, status) => {
      acc[status] = filtered.filter((p) => p.status === status);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} in your pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Quick Add Lead
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> Board
          </Button>
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            <List className="mr-1 h-4 w-4" /> Table
          </Button>
        </div>
      </div>

      {/* Filters + Bulk actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-1 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select onValueChange={(v) => handleBulkMove(v as ProspectStatus)}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              {pipelineStatuses.map((s) => (
                <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
              ))}
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {pipelineStatuses.map((status) => (
              <DroppableColumn
                key={status}
                id={status}
                label={statusConfig[status].label}
                color={statusConfig[status].color}
                count={grouped[status]?.length || 0}
              >
                {(grouped[status] || []).map((prospect) => (
                  <DraggableCard key={prospect.id} prospect={prospect} />
                ))}
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeProspect && <ProspectMiniCard prospect={activeProspect} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table view */}
      {view === "table" && (
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
                  <SortableHead field="lead_score" current={sortField} direction={sortDirection} onSort={handleSort}>
                    Score
                  </SortableHead>
                  <TableHead>Contact</TableHead>
                  <SortableHead field="rating" current={sortField} direction={sortDirection} onSort={handleSort}>
                    Rating
                  </SortableHead>
                  <TableHead className="text-center">Grade</TableHead>
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
                        <Link href={`/leads/${prospect.id}`} className="hover:underline">
                          <div className="font-medium">{prospect.business_name}</div>
                        </Link>
                        {prospect.business_type && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {prospect.business_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-center">
                        {prospect.rating != null && (
                          <span className="text-sm">{prospect.rating}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {analysis ? (
                          <WebsiteScoreBadge grade={analysis.overall_grade} />
                        ) : !prospect.website_url ? (
                          <NoWebsiteBadge />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[prospect.status].color}>
                          {statusConfig[prospect.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/leads/${prospect.id}`}>
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
      )}

      {/* Quick Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="space-y-1">
              <Label>Business Name *</Label>
              <Input placeholder="Mike's Plumbing" value={addForm.business_name} onChange={(e) => setAddForm({...addForm, business_name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input placeholder="(512) 555-0100" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="mike@example.com" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input placeholder="Dripping Springs" value={addForm.city} onChange={(e) => setAddForm({...addForm, city: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Business Type</Label>
                <Input placeholder="Plumber" value={addForm.business_type} onChange={(e) => setAddForm({...addForm, business_type: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm({...addForm, source: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook Group">Facebook Group</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Cold Email">Cold Email</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea placeholder="Saw them in DS Neighbors group, does masonry work..." value={addForm.notes} onChange={(e) => setAddForm({...addForm, notes: e.target.value})} rows={3} />
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
}: {
  field: SortField;
  current: SortField;
  direction: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const active = field === current;
  return (
    <TableHead>
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

function DraggableCard({ prospect }: { prospect: ProspectWithAnalysis }) {
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
      <ProspectMiniCard prospect={prospect} />
    </div>
  );
}

function useDraggable(id: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@dnd-kit/core").useDraggable({ id });
  return { attributes, listeners, setNodeRef, transform, isDragging };
}

function ProspectMiniCard({ prospect }: { prospect: ProspectWithAnalysis }) {
  const analysis = prospect.website_analyses?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadScore = (prospect as any).lead_score ?? 0;

  return (
    <Link href={`/leads/${prospect.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-3">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-sm font-medium leading-tight">
                  {prospect.business_name}
                </span>
              </div>
              {analysis ? (
                <WebsiteScoreBadge grade={analysis.overall_grade} />
              ) : !prospect.website_url ? (
                <NoWebsiteBadge />
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {[prospect.city, prospect.state].filter(Boolean).join(", ")}
              </p>
              {leadScore > 0 && <LeadScoreBadge score={leadScore} />}
            </div>
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
