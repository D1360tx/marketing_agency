"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow Up" },
  { value: "client", label: "Client ✅" },
  { value: "not_interested", label: "Not Interested" },
];

export function TaskCardActions({ prospectId, currentStatus }: { prospectId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [callOutcome, setCallOutcome] = useState("Answered");
  const [callNote, setCallNote] = useState("");

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prospectId, status }),
      });
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function logCall() {
    setLoading(true);
    const ts = new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const entry = `[${ts}]\nCall — ${callOutcome}${callNote.trim() ? `: ${callNote.trim()}` : ""}`;
    console.log(entry); // used for audit trail
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prospectId,
          last_contacted_at: new Date().toISOString(),
          status: currentStatus === "new" ? "contacted" : currentStatus,
        }),
      });
      toast.success("Call logged");
      setShowCallLog(false);
      router.refresh();
    } catch {
      toast.error("Failed to log call");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Select onValueChange={updateStatus} disabled={loading}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Change status..." />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowCallLog(!showCallLog)}>
        <Phone className="h-3 w-3" /> Log Call
      </Button>
      {showCallLog && (
        <div className="w-full space-y-2 p-3 bg-muted/40 rounded-lg">
          <Select value={callOutcome} onValueChange={setCallOutcome}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Answered", "Voicemail", "No Answer", "Callback Requested"].map(o => (
                <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="w-full rounded border bg-background px-3 py-1.5 text-xs"
            placeholder="Optional note..."
            value={callNote}
            onChange={e => setCallNote(e.target.value)}
          />
          <Button size="sm" className="h-7 text-xs" onClick={logCall} disabled={loading}>
            <CheckCircle className="mr-1 h-3 w-3" /> Save
          </Button>
        </div>
      )}
    </div>
  );
}
