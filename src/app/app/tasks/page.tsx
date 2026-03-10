import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Phone, Calendar, ArrowRight, Clock } from "lucide-react";
import { TaskCardActions } from "@/components/task-card-actions";

function parseNotesPreview(raw: string | null): string {
  if (!raw) return "";
  const lastSepIdx = raw.lastIndexOf("\n---\n");
  const lastEntry = lastSepIdx >= 0 ? raw.slice(lastSepIdx + 5).trim() : raw.trim();
  const lines = lastEntry.split("\n");
  const text = lines[0]?.match(/^\[.+\]$/) ? lines.slice(1).join(" ").trim() : lastEntry;
  return text.slice(0, 120) + (text.length > 120 ? "…" : "");
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string; week?: string }> }) {
  const { view = "today" } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, business_name, phone, follow_up_date, notes, city, state, business_type, status")
    .eq("status", "follow_up")
    .lte("follow_up_date", today)
    .order("follow_up_date", { ascending: true });

  const tasks = prospects || [];

  // Upcoming scheduled calls
  const { data: scheduledCalls } = await supabase
    .from("prospects")
    .select("id, business_name, phone, call_scheduled_at, notes")
    .eq("status", "call_scheduled")
    .order("call_scheduled_at", { ascending: true });

  // Week view data
  let weekTasks: Array<{
    id: string;
    business_name: string;
    phone: string | null;
    follow_up_date: string | null;
    notes: string | null;
    status: string;
    call_scheduled_at: string | null;
  }> = [];
  let monday: Date | null = null;

  if (view === "week") {
    const now = new Date();
    const dayOfWeek = now.getDay();
    monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayDate = monday.toISOString().split("T")[0];
    const sundayDate = sunday.toISOString().split("T")[0];

    const { data: wt } = await supabase
      .from("prospects")
      .select("id, business_name, phone, follow_up_date, notes, status, call_scheduled_at")
      .or(
        `and(status.eq.follow_up,follow_up_date.gte.${mondayDate},follow_up_date.lte.${sundayDate}),and(status.eq.call_scheduled,call_scheduled_at.gte.${monday.toISOString()},call_scheduled_at.lte.${sunday.toISOString()})`
      )
      .order("follow_up_date", { ascending: true });

    weekTasks = wt || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            {view === "week" ? "This week's schedule" : "Follow-ups due today or overdue"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {tasks.length} due
          </Badge>
          <div className="flex gap-2">
            <Link href="/tasks?view=today">
              <Button variant={view === "today" ? "default" : "outline"} size="sm">Today</Button>
            </Link>
            <Link href="/tasks?view=week">
              <Button variant={view === "week" ? "default" : "outline"} size="sm">This Week</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Week View */}
      {view === "week" && monday && (
        <div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const day = new Date(monday!);
              day.setDate(monday!.getDate() + i);
              const dateStr = day.toISOString().split("T")[0];
              const isToday = dateStr === today;
              const dayTasks = weekTasks.filter(t =>
                t.follow_up_date === dateStr ||
                t.call_scheduled_at?.startsWith(dateStr)
              );
              return (
                <div key={i} className={`rounded-lg border p-2 min-h-[120px] ${isToday ? "border-primary bg-primary/5" : ""}`}>
                  <p className={`text-xs font-semibold mb-2 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50">—</p>
                  ) : dayTasks.map(t => (
                    <Link key={t.id} href={`/leads/${t.id}`}>
                      <div className={`mb-1 rounded px-1.5 py-1 text-xs ${t.status === "call_scheduled" ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800"}`}>
                        {t.business_name}
                        {t.phone && <span className="block text-[10px] opacity-75">{t.phone}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today View */}
      {view === "today" && (
        <>
          {/* Upcoming Scheduled Calls */}
          {(scheduledCalls || []).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-700">
                <Clock className="h-5 w-5" /> Upcoming Calls ({scheduledCalls!.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scheduledCalls!.map((prospect) => {
                  const notesPreview = parseNotesPreview(prospect.notes);
                  return (
                    <Card key={prospect.id} className="hover:shadow-md transition-shadow border-indigo-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-start justify-between gap-2">
                          <span>{prospect.business_name}</span>
                          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs shrink-0">
                            Scheduled
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5 text-sm">
                          {prospect.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{prospect.phone}</span>
                            </div>
                          )}
                          {prospect.call_scheduled_at && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {new Date(prospect.call_scheduled_at).toLocaleString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        {notesPreview && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
                            {notesPreview}
                          </p>
                        )}
                        <Link href={`/leads/${prospect.id}`}>
                          <Button size="sm" className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700">
                            View Lead <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Follow-ups Due</h2>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckSquare className="h-12 w-12 text-emerald-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-1">No follow-ups due today.</h2>
                  <p className="text-muted-foreground">Great work! Check back tomorrow.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((prospect) => {
                  const notesPreview = parseNotesPreview(prospect.notes);
                  const isOverdue = prospect.follow_up_date && prospect.follow_up_date < today;
                  return (
                    <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-start justify-between gap-2">
                          <span>{prospect.business_name}</span>
                          {isOverdue ? (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs shrink-0">
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-xs shrink-0">
                              Due Today
                            </Badge>
                          )}
                        </CardTitle>
                        {prospect.business_type && (
                          <Badge variant="secondary" className="w-fit text-xs">{prospect.business_type}</Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5 text-sm">
                          {prospect.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{prospect.phone}</span>
                            </div>
                          )}
                          {prospect.follow_up_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {new Date(prospect.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        {notesPreview && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
                            {notesPreview}
                          </p>
                        )}
                        <Link href={`/leads/${prospect.id}`}>
                          <Button size="sm" className="w-full mt-1">
                            View Lead <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <TaskCardActions prospectId={prospect.id} currentStatus={prospect.status} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
