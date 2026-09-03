"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildGoogleCalendarDraft } from "@/lib/lead-sales";
import type { ProspectWithAnalysis } from "@/types";

export default function LeadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prospect, setProspect] = useState<ProspectWithAnalysis | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [calendarOpened, setCalendarOpened] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/prospects/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (!response.ok || !result.prospect) throw new Error(result.error || "Lead not found");
        setProspect(result.prospect as ProspectWithAnalysis);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load this lead");
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [id]);

  const calendarUrl = useMemo(() => {
    if (!prospect || !startsAt) return "";
    try {
      return buildGoogleCalendarDraft({
        businessName: prospect.business_name,
        startsAt,
        durationMinutes: Number(duration),
        phone: prospect.phone,
        email: prospect.email,
        address: [prospect.address, prospect.city, prospect.state].filter(Boolean).join(", "),
      });
    } catch {
      return "";
    }
  }, [duration, prospect, startsAt]);

  function openCalendar() {
    if (!prospect || !calendarUrl) return;
    window.open(calendarUrl, "_blank", "noopener,noreferrer");
    setCalendarOpened(true);
  }

  async function markScheduled() {
    if (!prospect || !startsAt) return;
    setUpdating(true);
    try {
      const response = await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prospect.id,
          status: "call_scheduled",
          call_scheduled_at: new Date(startsAt).toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Lead status update failed");
      toast.success("Lead marked Call Scheduled");
    } catch {
      toast.error("The lead status was not updated");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 sm:h-9 sm:w-9">
          <Link href={`/app/leads/${id}`} aria-label="Back to lead"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Schedule Fit Call</h1>
          <p className="truncate text-sm text-muted-foreground">{prospect?.business_name || "Lead"}</p>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200"><CardContent className="p-4 text-sm text-red-700 sm:p-6">{error}</CardContent></Card>
      ) : prospect && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Choose a time</CardTitle>
            <CardDescription>
              Create a prefilled Google Calendar event. After saving it, mark the lead Call Scheduled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <Label htmlFor="call-time">Date and time</Label>
              <Input id="call-time" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">{prospect.business_name}</p>
              {prospect.phone && <p className="mt-1 text-muted-foreground">{prospect.phone}</p>}
              {prospect.email && <p className="break-all text-muted-foreground">{prospect.email}</p>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {prospect.phone && (
                <Button asChild variant="outline" className="min-h-11">
                  <a href={`tel:${prospect.phone}`}><Phone className="mr-2 h-4 w-4" />Call Now</a>
                </Button>
              )}
              <Button onClick={openCalendar} disabled={!calendarUrl} className="min-h-11">
                <CalendarPlus className="mr-2 h-4 w-4" />Open Calendar Draft
              </Button>
            </div>
            {calendarOpened && (
              <Button onClick={markScheduled} disabled={updating} className="min-h-11 w-full">
                {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                Mark Call Scheduled
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
