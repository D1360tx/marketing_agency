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
import { CheckSquare, Phone, Calendar, ArrowRight } from "lucide-react";

function parseNotesPreview(raw: string | null): string {
  if (!raw) return "";
  // Get the last note entry (after last ---separator or the whole thing)
  const lastSepIdx = raw.lastIndexOf("\n---\n");
  const lastEntry = lastSepIdx >= 0 ? raw.slice(lastSepIdx + 5).trim() : raw.trim();
  // Strip timestamp header if present
  const lines = lastEntry.split("\n");
  const text = lines[0]?.match(/^\[.+\]$/) ? lines.slice(1).join(" ").trim() : lastEntry;
  return text.slice(0, 120) + (text.length > 120 ? "…" : "");
}

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, business_name, phone, follow_up_date, notes, city, state, business_type")
    .eq("status", "follow_up")
    .lte("follow_up_date", today)
    .order("follow_up_date", { ascending: true });

  const tasks = prospects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Follow-ups due today or overdue
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {tasks.length} due
        </Badge>
      </div>

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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
