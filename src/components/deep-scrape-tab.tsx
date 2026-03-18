"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Play, Download, ChevronDown, ChevronUp, Star } from "lucide-react";

interface ScrapeJob {
  id: string;
  query: string;
  niche: string | null;
  city: string | null;
  limit_count: number;
  enrich: boolean;
  status: "pending" | "processing" | "completed" | "failed";
  result_count: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface Business {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  review_count: string;
  email: string;
  maps_url: string;
  [key: string]: string;
}

interface JobResults {
  jobId: string;
  results: Business[];
}

function StatusBadge({ status }: { status: ScrapeJob["status"] }) {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">Pending</Badge>;
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border animate-pulse">
          Processing
        </Badge>
      );
    case "completed":
      return <Badge className="bg-green-100 text-green-800 border-green-200 border">Completed</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800 border-red-200 border">Failed</Badge>;
  }
}

function exportCSV(jobs: ScrapeJob[], results: Business[], jobQuery: string) {
  const headers = ["Business Name", "Category", "Phone", "Email", "Website", "Rating", "Reviews", "Address", "Maps URL"];
  const rows = results.map((b) => [
    b.name,
    b.category,
    b.phone,
    b.email,
    b.website,
    b.rating,
    b.review_count,
    b.address,
    b.maps_url,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deep-scrape-${jobQuery.replace(/\s+/g, "-").slice(0, 40)}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  void jobs; // suppress unused warning
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeepScrapeTab() {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(60);
  const [enrich, setEnrich] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [loadedResults, setLoadedResults] = useState<Record<string, JobResults>>({});
  const [loadingResults, setLoadingResults] = useState<Record<string, boolean>>({});

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/scraper/jobs");
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-poll every 5s if any job is processing
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "pending" || j.status === "processing");

    if (hasActive) {
      pollRef.current = setTimeout(() => {
        fetchJobs();
      }, 5000);
    }

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [jobs, fetchJobs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const query = [niche, city].filter(Boolean).join(" ") || niche;
      const res = await fetch("/api/scraper/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, niche: niche || null, city: city || null, limit, enrich }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to queue job");
        return;
      }
      // Refresh job list
      await fetchJobs();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpandJob(job: ScrapeJob) {
    if (expandedJob === job.id) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(job.id);

    if (job.status !== "completed") return;
    if (loadedResults[job.id]) return;

    setLoadingResults((prev) => ({ ...prev, [job.id]: true }));
    try {
      const res = await fetch(`/api/scraper/status/${job.id}`);
      const data = await res.json();
      if (res.ok && data.results) {
        setLoadedResults((prev) => ({
          ...prev,
          [job.id]: { jobId: job.id, results: data.results },
        }));
      }
    } finally {
      setLoadingResults((prev) => ({ ...prev, [job.id]: false }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Scrape form */}
      <Card>
        <CardHeader>
          <CardTitle>New Deep Scrape</CardTitle>
          <CardDescription>
            Runs a full Playwright-based Google Maps scrape on the ThinkPad. Results arrive in 2–10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-niche">Niche / Business Type</Label>
                <Input
                  id="ds-niche"
                  placeholder="e.g. HVAC contractors"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-city">City</Label>
                <Input
                  id="ds-city"
                  placeholder="e.g. Austin TX"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds-limit">
                Result Limit: <span className="font-semibold">{limit}</span>
              </Label>
              <input
                id="ds-limit"
                type="range"
                min={10}
                max={100}
                step={10}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>100</span>
              </div>
            </div>

            {/* Enrich toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={enrich}
                onClick={() => setEnrich((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  enrich ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    enrich ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <Label className="cursor-pointer" onClick={() => setEnrich((v) => !v)}>
                Enrich results (email + socials) — adds ~30s per business
              </Label>
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto min-h-[44px]">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {submitting ? "Queuing..." : "Start Deep Scrape"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Job history */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>Click a completed job to view results</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingJobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No jobs yet. Start your first deep scrape above.
            </p>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => {
                const isExpanded = expandedJob === job.id;
                const jobResults = loadedResults[job.id];
                const isLoadingR = loadingResults[job.id];
                const isClickable = job.status === "completed";

                return (
                  <div key={job.id}>
                    {/* Job row */}
                    <button
                      onClick={() => handleExpandJob(job)}
                      disabled={!isClickable && job.status !== "failed"}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isClickable ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{job.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(job.created_at)}
                          {job.result_count != null && ` · ${job.result_count} results`}
                          {job.limit_count && ` · limit ${job.limit_count}`}
                          {job.enrich && " · enriched"}
                        </p>
                        {job.status === "failed" && job.error_message && (
                          <p className="text-xs text-destructive mt-0.5 truncate">{job.error_message}</p>
                        )}
                      </div>
                      <StatusBadge status={job.status} />
                      {isClickable && (
                        isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )
                      )}
                    </button>

                    {/* Expanded results */}
                    {isExpanded && isClickable && (
                      <div className="border-t bg-muted/30 px-4 py-4 space-y-3">
                        {isLoadingR ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading results...
                          </div>
                        ) : jobResults ? (
                          <>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-sm font-medium">
                                {jobResults.results.length} businesses
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportCSV(jobs, jobResults.results, job.query)}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Export CSV
                              </Button>
                            </div>
                            <div className="overflow-x-auto rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="whitespace-nowrap">Business</TableHead>
                                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                                    <TableHead className="whitespace-nowrap">Email</TableHead>
                                    <TableHead className="whitespace-nowrap">Website</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Rating</TableHead>
                                    <TableHead className="whitespace-nowrap">Address</TableHead>
                                    <TableHead className="whitespace-nowrap">Category</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {jobResults.results.map((biz, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="font-medium whitespace-nowrap">
                                        {biz.maps_url ? (
                                          <a
                                            href={biz.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            {biz.name}
                                          </a>
                                        ) : biz.name}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-sm">
                                        {biz.phone ? (
                                          <a href={`tel:${biz.phone}`} className="hover:underline">
                                            {biz.phone}
                                          </a>
                                        ) : <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-sm">
                                        {biz.email ? (
                                          <a href={`mailto:${biz.email}`} className="text-blue-600 hover:underline">
                                            {biz.email}
                                          </a>
                                        ) : <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-sm max-w-[160px] truncate">
                                        {biz.website ? (
                                          <a
                                            href={biz.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate block"
                                          >
                                            {biz.website.replace(/^https?:\/\//, "")}
                                          </a>
                                        ) : <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap text-sm">
                                        {biz.rating ? (
                                          <span className="flex items-center justify-center gap-1">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            {biz.rating}
                                            {biz.review_count && (
                                              <span className="text-xs text-muted-foreground">({biz.review_count})</span>
                                            )}
                                          </span>
                                        ) : <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                      <TableCell className="text-sm max-w-[200px] truncate">
                                        {biz.address || <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                      <TableCell className="text-sm whitespace-nowrap">
                                        {biz.category || <span className="text-muted-foreground">—</span>}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No results data.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
