"use client";

import { useEffect, useState, use } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Send,
  Pause,
  Play,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Reply,
} from "lucide-react";
import type { Campaign, CampaignMessage } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  paused: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

const messageStatusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-gray-500" />,
  sent: <Send className="h-3.5 w-3.5 text-blue-500" />,
  delivered: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  opened: <Eye className="h-3.5 w-3.5 text-purple-500" />,
  replied: <Reply className="h-3.5 w-3.5 text-amber-500" />,
  bounced: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

interface MessageWithProspect extends CampaignMessage {
  prospects?: { business_name: string } | null;
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<MessageWithProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      setCampaign(data.campaign);
      setMessages(data.messages || []);
    } catch {
      console.error("Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!campaign) return;
    setSending(true);

    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Send failed");
      } else {
        alert(`Sent ${data.sent} of ${data.total} messages`);
        fetchCampaign(); // Refresh data
      }
    } catch {
      alert("Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  async function handleTogglePause() {
    if (!campaign) return;
    const newStatus = campaign.status === "paused" ? "active" : "paused";

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      setCampaign(data.campaign);
    } catch {
      console.error("Failed to update campaign");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <p className="text-muted-foreground">Campaign not found.</p>
      </div>
    );
  }

  const pendingCount = messages.filter((m) => m.status === "pending").length;
  const sentCount = messages.filter((m) => m.status === "sent" || m.status === "delivered").length;
  const failedCount = messages.filter((m) => m.status === "failed" || m.status === "bounced").length;
  const openedCount = messages.filter((m) => m.status === "opened").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge variant="outline" className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              {campaign.type === "email" ? (
                <Mail className="h-3.5 w-3.5" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {campaign.type === "email" ? "Email" : "SMS"} campaign
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(campaign.status === "active" || campaign.status === "paused") && (
            <Button variant="outline" onClick={handleTogglePause}>
              {campaign.status === "paused" ? (
                <><Play className="mr-2 h-4 w-4" /> Resume</>
              ) : (
                <><Pause className="mr-2 h-4 w-4" /> Pause</>
              )}
            </Button>
          )}
          {pendingCount > 0 && (
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send {pendingCount} Pending
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">Total Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{sentCount}</div>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{openedCount}</div>
            <p className="text-xs text-muted-foreground">Opened</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{repliedCount}</div>
            <p className="text-xs text-muted-foreground">Replied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Template */}
      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          {campaign.subject_template && (
            <CardDescription>
              Subject: {campaign.subject_template}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
            {campaign.body_template}
          </pre>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recipients added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">
                      {msg.prospects?.business_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm">{msg.to_address}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {messageStatusIcons[msg.status]}
                        <span className="text-sm capitalize">{msg.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-red-600">
                      {msg.error_message || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
