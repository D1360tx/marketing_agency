"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeepScrapeTab from "@/components/deep-scrape-tab";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  WebsiteScoreBadge,
  NoWebsiteBadge,
} from "@/components/website-score-badge";
import {
  Search,
  Globe,
  Phone,
  Mail,
  Star,
  Loader2,
  BarChart3,
  ExternalLink,
  Shield,
  Smartphone,
  Clock,
  Eye,
  TrendingUp,
} from "lucide-react";
import type { Prospect, WebsiteAnalysis } from "@/types";

export default function ProspectorPage() {
  const [activeTab, setActiveTab] = useState<"quick" | "deep">("quick");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, WebsiteAnalysis>>({});
  const [extractedEmails, setExtractedEmails] = useState<Record<string, string[]>>({});
  const [emailSources, setEmailSources] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [detailAnalysis, setDetailAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<{ newCount: number; dupCount: number } | null>(null);
  const [analyzeAllProgress, setAnalyzeAllProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProspects([]);
    setAnalyses({});
    setExtractedEmails({});
    setEmailSources({});
    setSearchFeedback(null);

    try {
      const res = await fetch("/api/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location, limit: 20 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Search failed");
        return;
      }

      setProspects(data.prospects);
      setSearchFeedback({
        newCount: data.new_count ?? data.prospects.length,
        dupCount: data.duplicate_count ?? 0,
      });
    } catch {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(prospect: Prospect) {
    setAnalyzing((prev) => ({ ...prev, [prospect.id]: true }));

    try {
      const res = await fetch("/api/prospects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospect.id,
          website_url: prospect.website_url,
        }),
      });

      const data = await res.json();

      if (data.analysis) {
        setAnalyses((prev) => ({ ...prev, [prospect.id]: data.analysis }));
      }
      if (data.extracted_emails?.length > 0) {
        setExtractedEmails((prev) => ({
          ...prev,
          [prospect.id]: data.extracted_emails,
        }));
        // Update the prospect's email in local state
        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospect.id && !p.email
              ? { ...p, email: data.extracted_emails[0] }
              : p
          )
        );
      }
      if (data.email_source) {
        setEmailSources((prev) => ({ ...prev, [prospect.id]: data.email_source }));
      }
    } catch {
      console.error("Analysis failed");
    } finally {
      setAnalyzing((prev) => ({ ...prev, [prospect.id]: false }));
    }
  }

  async function handleAnalyzeAll() {
    const toAnalyze = prospects.filter(
      (p) => p.website_url && !analyses[p.id]
    );

    setAnalyzeAllProgress({ done: 0, total: toAnalyze.length });
    const CONCURRENCY = 3;

    for (let i = 0; i < toAnalyze.length; i += CONCURRENCY) {
      const batch = toAnalyze.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map((p) => handleAnalyze(p)));
      setAnalyzeAllProgress((prev) =>
        prev ? { ...prev, done: Math.min(i + CONCURRENCY, toAnalyze.length) } : null
      );
    }

    setAnalyzeAllProgress(null);
  }

  const [websiteFilter, setWebsiteFilter] = useState<"all" | "no_website" | "has_website">("all");

  const analyzedCount = Object.keys(analyses).length;
  const noWebsiteCount = prospects.filter((p) => !p.website_url).length;
  const poorGradeCount = Object.values(analyses).filter(
    (a) => a.overall_grade === "D" || a.overall_grade === "F"
  ).length;

  // Sort prospects by lead_score descending
  const sortedProspects = [...prospects]
    .filter((p) => {
      if (websiteFilter === "no_website") return !p.website_url;
      if (websiteFilter === "has_website") return !!p.website_url;
      return true;
    })
    .sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreA = (a as any).lead_score ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreB = (b as any).lead_score ?? 0;
      return scoreB - scoreA;
    });

  function exportCSV() {
    const rows = [
      ["Business Name", "Phone", "Email", "Website", "City", "State", "Google Maps", "Business Type", "Lead Score"],
      ...sortedProspects.map((p) => [
        p.business_name,
        p.phone || "",
        p.email || "",
        p.website_url || "NO WEBSITE",
        p.city || "",
        p.state || "",
        p.google_maps_url || "",
        p.business_type || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p as any).lead_score ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booked-out-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prospector</h1>
        <p className="text-muted-foreground">
          Find businesses that need your marketing services
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border overflow-hidden w-fit">
        <button
          onClick={() => setActiveTab("quick")}
          className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === "quick"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          }`}
        >
          Quick Search
        </button>
        <button
          onClick={() => setActiveTab("deep")}
          className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === "deep"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          }`}
        >
          Deep Scrape
        </button>
      </div>

      {/* Deep Scrape tab */}
      {activeTab === "deep" && <DeepScrapeTab />}

      {/* Quick Search tab — all existing content below */}
      {activeTab === "quick" && (
      <><Card>
        <CardHeader>
          <CardTitle>Search Google Maps</CardTitle>
          <CardDescription>
            Enter a business type and location to find prospects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="query">Business Type</Label>
              <Input
                id="query"
                placeholder="e.g. plumber, dentist, restaurant"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Austin, TX"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="sm:w-auto">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Search feedback: new vs duplicates */}
      {searchFeedback && (
        <div className="rounded-md border bg-muted/50 p-4">
          <p className="text-sm font-medium">
            {searchFeedback.newCount} new prospect{searchFeedback.newCount !== 1 ? "s" : ""} added
            {searchFeedback.dupCount > 0 && (
              <span className="text-muted-foreground">
                {" "}({searchFeedback.dupCount} already in pipeline, skipped)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Summary stats after analysis */}
      {prospects.length > 0 && analyzedCount > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{noWebsiteCount}</div>
              <p className="text-sm text-muted-foreground">No website at all</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{poorGradeCount}</div>
              <p className="text-sm text-muted-foreground">Poor website (D/F grade)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">
                {noWebsiteCount + poorGradeCount}
              </div>
              <p className="text-sm text-muted-foreground">Total hot prospects</p>
            </CardContent>
          </Card>
        </div>
      )}

      {prospects.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Results ({sortedProspects.length}{websiteFilter !== "all" ? ` of ${prospects.length}` : ""})</CardTitle>
              <CardDescription>
                Businesses found for &quot;{query}&quot; in {location}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Website filter */}
              <div className="flex rounded-md border overflow-hidden text-xs">
                {(["all", "no_website", "has_website"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setWebsiteFilter(f)}
                    className={`px-3 py-1.5 font-medium transition-colors ${websiteFilter === f ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  >
                    {f === "all" ? "All" : f === "no_website" ? `🔥 No Website (${noWebsiteCount})` : "Has Website"}
                  </button>
                ))}
              </div>
              {/* Export CSV */}
              <Button variant="outline" size="sm" onClick={exportCSV}>
                ⬇ Export CSV
              </Button>
              {analyzeAllProgress && (
                <span className="text-sm text-muted-foreground">
                  {analyzeAllProgress.done}/{analyzeAllProgress.total}
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleAnalyzeAll}
                disabled={Object.values(analyzing).some(Boolean) || !!analyzeAllProgress}
              >
                {analyzeAllProgress ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                {analyzeAllProgress ? "Analyzing..." : "Analyze All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProspects.map((prospect) => {
                    const analysis = analyses[prospect.id];
                    const emails = extractedEmails[prospect.id];
                    const emailSrc = emailSources[prospect.id];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const leadScore = (prospect as any).lead_score ?? 0;
                    const isHotLead = !prospect.website_url;
                    return (
                      <TableRow key={prospect.id} className={isHotLead ? "bg-red-50 dark:bg-red-950/20" : ""}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {prospect.business_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {[prospect.address, prospect.city]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                            {prospect.business_type && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {prospect.business_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <LeadScoreBadge score={leadScore} />
                        </TableCell>
                        <TableCell>
                          {prospect.website_url ? (
                            <div className="space-y-1">
                              <a
                                href={prospect.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                              >
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span className="max-w-[180px] truncate">
                                  {prospect.website_url.replace(/^https?:\/\//, "")}
                                </span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                              {analysis && (
                                <div className="flex gap-2">
                                  {analysis.has_ssl ? (
                                    <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                      <Shield className="h-2.5 w-2.5" /> SSL
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-xs text-red-700">
                                      <Shield className="h-2.5 w-2.5" /> No SSL
                                    </Badge>
                                  )}
                                  {analysis.is_mobile_friendly ? (
                                    <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                      <Smartphone className="h-2.5 w-2.5" /> Mobile
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-xs text-red-700">
                                      <Smartphone className="h-2.5 w-2.5" /> Not Mobile
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <NoWebsiteBadge />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {prospect.phone && (
                              <a
                                href={`tel:${prospect.phone}`}
                                className="flex items-center gap-1 text-sm hover:text-foreground"
                              >
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {prospect.phone}
                              </a>
                            )}
                            {prospect.email && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`mailto:${prospect.email}`}
                                  className="flex items-center gap-1 text-sm hover:text-foreground"
                                >
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {prospect.email}
                                </a>
                                {emailSrc && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {emailSrc === "hunter" ? "Hunter" : "Scraped"}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {emails && emails.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                +{emails.length - 1} more email{emails.length > 2 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {prospect.rating != null && (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">
                                {prospect.rating}
                              </span>
                              {prospect.review_count != null && (
                                <span className="text-xs text-muted-foreground">
                                  ({prospect.review_count})
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {analysis ? (
                            <button
                              onClick={() => setDetailAnalysis(analysis)}
                              className="flex flex-col items-center gap-1 mx-auto cursor-pointer hover:opacity-80"
                            >
                              <WebsiteScoreBadge
                                grade={analysis.overall_grade}
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                Perf: {analysis.performance_score ?? "-"}
                              </span>
                            </button>
                          ) : prospect.website_url ? (
                            <span className="text-xs text-muted-foreground">
                              Not analyzed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {prospect.website_url && !analysis && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyze(prospect)}
                              disabled={analyzing[prospect.id]}
                            >
                              {analyzing[prospect.id] ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <BarChart3 className="mr-1 h-3 w-3" />
                              )}
                              {analyzing[prospect.id] ? "Analyzing..." : "Analyze"}
                            </Button>
                          )}
                          {analysis && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailAnalysis(analysis)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis detail dialog */}
      <Dialog open={!!detailAnalysis} onOpenChange={() => setDetailAnalysis(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Website Analysis Details</DialogTitle>
          </DialogHeader>
          {detailAnalysis && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <WebsiteScoreBadge grade={detailAnalysis.overall_grade} size="lg" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ScoreBar label="Performance" score={detailAnalysis.performance_score} />
                <ScoreBar label="Accessibility" score={detailAnalysis.accessibility_score} />
                <ScoreBar label="Best Practices" score={detailAnalysis.best_practices_score} />
                <ScoreBar label="SEO" score={detailAnalysis.seo_score} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>SSL: {detailAnalysis.has_ssl ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile: {detailAnalysis.is_mobile_friendly ? "Yes" : "No"}</span>
                </div>
                {detailAnalysis.load_time_ms && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Load: {(detailAnalysis.load_time_ms / 1000).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
      {/* End Quick Search tab */}
    </div>
  );
}

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

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const value = score ?? 0;
  const color =
    value >= 90
      ? "bg-emerald-500"
      : value >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score ?? "-"}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
