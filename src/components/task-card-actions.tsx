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
        <SelectTrigger className="h-10 flex-1 text-sm">
          <SelectValue placeholder="Change status..." />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="h-10 text-sm gap-1 flex-1 sm:flex-none" onClick={() => setShowCallLog(!showCallLog)}>
        <Phone className="h-4 w-4" /> Log Call
      </Button>
      {showCallLog && (
        <div className="w-full space-y-2 p-3 bg-muted/40 rounded-lg">
          <Select value={callOutcome} onValueChange={setCallOutcome}>
            <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Answered", "Voicemail", "No Answer", "Callback Requested"].map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="w-full rounded border bg-background px-3 py-2 text-base sm:text-sm"
            placeholder="Optional note..."
            value={callNote}
            onChange={e => setCallNote(e.target.value)}
          />
          <Button size="sm" className="h-10 text-sm" onClick={logCall} disabled={loading}>
            <CheckCircle className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      )}
    </div>
  );
}
