"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Plus,
  Loader2,
  Play,
  Pause,
  Zap,
  Mail,
  MessageSquare,
  Users,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { DripSequenceStatus } from "@/types";

interface SequenceWithStats {
  id: string;
  name: string;
  description: string | null;
  channel: "email" | "sms";
  status: DripSequenceStatus;
  created_at: string;
  drip_steps: { id: string; step_order: number; delay_days: number }[];
  stats: {
    total_enrolled: number;
    active: number;
    completed: number;
    cancelled: number;
  };
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<SequenceWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSequences();
  }, []);

  async function fetchSequences() {
    try {
      const res = await fetch("/api/drip");
      const data = await res.json();
      setSequences(data.sequences || []);
    } catch {
      toast.error("Failed to load sequences");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(seq: SequenceWithStats) {
    const newStatus = seq.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/drip/${seq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(
          `Sequence ${newStatus === "active" ? "activated" : "paused"}`
        );
        fetchSequences();
      }
    } catch {
      toast.error("Failed to update sequence");
    }
  }

  async function handleProcessQueue() {
    setProcessing(true);
    try {
      const res = await fetch("/api/drip/process", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        if (data.processed === 0) {
          toast.info("No messages due — queue is empty");
        } else {
          toast.success(
            `Processed ${data.processed}: ${data.sent} sent, ${data.completed} completed, ${data.failed} failed`
          );
        }
        fetchSequences();
      } else {
        toast.error(data.error || "Processing failed");
      }
    } catch {
      toast.error("Failed to process queue");
    } finally {
      setProcessing(false);
    }
  }

  const statusColors: Record<DripSequenceStatus, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    archived: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Drip Sequences
          </h1>
          <p className="text-muted-foreground">
            Automated multi-step outreach campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleProcessQueue}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Process Queue
          </Button>
          <Link href="/sequences/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sequence
            </Button>
          </Link>
        </div>
      </div>

      {sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No sequences yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first drip sequence to automate follow-ups
            </p>
            <Link href="/sequences/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Sequence
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sequences
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sequences.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Play className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sequences.filter((s) => s.status === "active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Enrolled Prospects
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sequences.reduce(
                    (sum, s) => sum + s.stats.total_enrolled,
                    0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sequences.reduce(
                    (sum, s) => sum + s.stats.completed,
                    0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sequences table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sequences</CardTitle>
              <CardDescription>
                Click a sequence to view details and manage enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequences.map((seq) => (
                    <TableRow key={seq.id}>
                      <TableCell>
                        <Link
                          href={`/sequences/${seq.id}`}
                          className="font-medium hover:underline"
                        >
                          {seq.name}
                        </Link>
                        {seq.description && (
                          <p className="text-xs text-muted-foreground">
                            {seq.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {seq.channel === "email" ? (
                            <Mail className="h-3 w-3" />
                          ) : (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          {seq.channel}
                        </div>
                      </TableCell>
                      <TableCell>{seq.drip_steps.length} steps</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[seq.status]}
                        >
                          {seq.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{seq.stats.total_enrolled}</TableCell>
                      <TableCell>{seq.stats.active}</TableCell>
                      <TableCell>{seq.stats.completed}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(seq)}
                          disabled={seq.status === "archived"}
                        >
                          {seq.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
