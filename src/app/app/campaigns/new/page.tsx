"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Eye,
} from "lucide-react";
import type { ProspectWithAnalysis, ProspectStatus } from "@/types";

const templateVars = [
  { key: "business_name", label: "Business Name" },
  { key: "website_grade", label: "Website Grade" },
  { key: "city", label: "City" },
  { key: "phone", label: "Phone" },
  { key: "website_url", label: "Website URL" },
  { key: "rating", label: "Rating" },
];

const emailTemplates: Record<string, { name: string; subject: string; body: string }> = {
  website_pain: {
    name: "Website Pain Point",
    subject: "Quick question about {{business_name}}'s website",
    body: `Hi {{business_name}},

I was checking out local {{city}} businesses online and came across yours — your Google reviews look great, but your website isn't doing you justice.

Most customers check a website before calling. If it's slow, outdated, or hard to use on a phone, they move on to a competitor.

We build modern, mobile-friendly websites for local service businesses — usually live in 48 hours, no setup fees.

Would it be worth a 10-minute call this week to show you what we'd build for you?

Diego
Booked Out`,
  },
  no_website: {
    name: "No Website",
    subject: "{{business_name}} — your competitors have websites",
    body: `Hi {{business_name}},

I noticed you don't have a website yet. In {{city}}, most of your competitors do — and that means customers searching online aren't finding you.

We build clean, professional websites for local service businesses starting at $299. Usually live within 48 hours.

Worth a quick 10-minute chat? I can show you exactly what we'd build.

Diego
Booked Out`,
  },
  google_reviews: {
    name: "Google Reviews",
    subject: "More Google reviews = more calls for {{business_name}}",
    body: `Hi {{business_name}},

Quick question — are you actively asking your customers for Google reviews after each job?

Most local businesses in {{city}} aren't, and it's costing them leads. Google ranks businesses with more reviews higher, which means more calls.

We set up an automated system that sends your customers a review request right after the job is done. Takes zero effort on your end.

Mind if I show you how it works on a quick call this week?

Diego
Booked Out`,
  },
  social_proof: {
    name: "Social Proof / FOMO",
    subject: "How {{city}} businesses are getting more calls",
    body: `Hi {{business_name}},

We recently helped a local {{city}} business go from 12 Google reviews to 47 in under 60 days — their phone started ringing noticeably more.

The secret? An automated review request system that texts or emails customers right after the job. Most say yes because the timing is perfect.

We also redesigned their website while we were at it. The whole thing was live in 48 hours.

Would love to show you what this could look like for {{business_name}}. Have 10 minutes this week?

Diego
Booked Out`,
  },
  cold_call_followup: {
    name: "Post Cold Call Follow-Up",
    subject: "Following up — {{business_name}}",
    body: `Hi {{business_name}},

Just tried giving you a call — wanted to follow up by email.

We help local service businesses in {{city}} get more customers through a better website and automated Google review requests.

If you're open to it, I'd love to show you a quick demo. Takes about 10 minutes and there's no pitch — just showing you what's possible.

What does your schedule look like this week?

Diego
Booked Out`,
  },
};

const defaultEmailTemplate = emailTemplates.website_pain.body;

const defaultSmsTemplate = `Hi {{business_name}}! We noticed your website scored {{website_grade}}. We help businesses in {{city}} get modern, fast websites. Interested in a free consultation? Reply YES`;

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"email" | "sms">("email");
  const [selectedTemplate, setSelectedTemplate] = useState("website_pain");
  const [subject, setSubject] = useState(emailTemplates.website_pain.subject);
  const [body, setBody] = useState(defaultEmailTemplate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prospects & recipient selection
  const [prospects, setProspects] = useState<ProspectWithAnalysis[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>("has_contact");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function fetchProspects() {
      try {
        const res = await fetch("/api/prospects");
        const data = await res.json();
        setProspects(data.prospects || []);
      } catch {
        console.error("Failed to fetch prospects");
      } finally {
        setLoadingProspects(false);
      }
    }
    fetchProspects();
  }, []);

  // Switch template when type changes
  useEffect(() => {
    setBody(type === "email" ? defaultEmailTemplate : defaultSmsTemplate);
  }, [type]);

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const hasEmail = !!p.email;
      const hasPhone = !!p.phone;

      if (type === "email" && contactFilter === "has_contact" && !hasEmail)
        return false;
      if (type === "sms" && contactFilter === "has_contact" && !hasPhone)
        return false;
      if (contactFilter === "all") return matchesStatus;

      return matchesStatus;
    });
  }, [prospects, statusFilter, contactFilter, type]);

  function toggleProspect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProspects.map((p) => p.id)));
    }
  }

  function insertVar(key: string) {
    setBody((prev) => prev + `{{${key}}}`);
  }

  // Live preview with first selected prospect's data
  const previewProspect = useMemo(() => {
    const firstId = Array.from(selectedIds)[0];
    return prospects.find((p) => p.id === firstId);
  }, [selectedIds, prospects]);

  function renderPreview(template: string) {
    if (!previewProspect) return template;
    const grade = previewProspect.website_analyses?.[0]?.overall_grade || "N/A";
    return template
      .replace(/\{\{business_name\}\}/g, previewProspect.business_name)
      .replace(/\{\{city\}\}/g, previewProspect.city || "")
      .replace(/\{\{state\}\}/g, previewProspect.state || "")
      .replace(/\{\{phone\}\}/g, previewProspect.phone || "")
      .replace(/\{\{website_url\}\}/g, previewProspect.website_url || "no website")
      .replace(/\{\{website_grade\}\}/g, grade)
      .replace(/\{\{rating\}\}/g, previewProspect.rating?.toString() || "N/A");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.size === 0) {
      setError("Select at least one recipient");
      return;
    }

    setLoading(true);

    try {
      // 1. Create campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          subject_template: type === "email" ? subject : null,
          body_template: body,
        }),
      });

      const campaignData = await campaignRes.json();

      if (!campaignRes.ok) {
        setError(campaignData.error || "Failed to create campaign");
        return;
      }

      const campaignId = campaignData.campaign.id;

      // 2. Create campaign messages for selected recipients
      const selectedProspects = prospects.filter((p) => selectedIds.has(p.id));
      const messages = selectedProspects
        .map((p) => {
          const address =
            type === "email" ? p.email : p.phone;
          if (!address) return null;
          return {
            campaign_id: campaignId,
            prospect_id: p.id,
            channel: type,
            to_address: address,
            subject: type === "email" ? subject : null,
            body: body,
            status: "pending",
          };
        })
        .filter(Boolean);

      if (messages.length === 0) {
        setError("None of the selected prospects have contact info for this channel");
        return;
      }

      const msgRes = await fetch("/api/campaigns/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!msgRes.ok) {
        const msgData = await msgRes.json();
        setError(msgData.error || "Failed to add recipients");
        return;
      }

      router.push(`/campaigns/${campaignId}`);
    } catch {
      setError("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
          <p className="text-muted-foreground">
            Create an outreach campaign for your prospects
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Campaign details + Template */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Austin Plumbers - Website Upgrade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "email" | "sms")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <span className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </span>
                      </SelectItem>
                      <SelectItem value="sms">
                        <span className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" /> SMS
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === "email" && (
                  <>
                    <div className="space-y-2">
                      <Label>Quick-load Template</Label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={(val) => {
                          setSelectedTemplate(val);
                          setSubject(emailTemplates[val].subject);
                          setBody(emailTemplates[val].body);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(emailTemplates).map(([key, t]) => (
                            <SelectItem key={key} value={key}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message Template</CardTitle>
                    <CardDescription>
                      Click variables to insert them
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {templateVars.map((v) => (
                    <Badge
                      key={v.key}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertVar(v.key)}
                    >
                      {`{{${v.key}}}`}
                    </Badge>
                  ))}
                </div>
                {showPreview ? (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    {type === "email" && (
                      <p className="mb-2 text-sm font-medium">
                        Subject: {previewProspect ? renderPreview(subject) : subject}
                      </p>
                    )}
                    <Separator className="my-2" />
                    <pre className="whitespace-pre-wrap text-sm">
                      {previewProspect ? renderPreview(body) : body}
                    </pre>
                    {!previewProspect && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Select a recipient to see a live preview
                      </p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={type === "sms" ? 4 : 10}
                    className="font-mono text-sm"
                    required
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Recipient picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients ({selectedIds.size})
              </CardTitle>
              <CardDescription>
                Select which prospects to send to
              </CardDescription>
              <div className="flex gap-2 pt-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={contactFilter} onValueChange={setContactFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="has_contact">
                      Has {type === "email" ? "Email" : "Phone"}
                    </SelectItem>
                    <SelectItem value="all">Show All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProspects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProspects.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No prospects found. Search for businesses in the Prospector first.
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <Checkbox
                      checked={
                        selectedIds.size === filteredProspects.length &&
                        filteredProspects.length > 0
                      }
                      onCheckedChange={selectAll}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Select all ({filteredProspects.length})
                    </span>
                  </div>
                  <div className="max-h-[500px] space-y-1 overflow-y-auto">
                    {filteredProspects.map((p) => {
                      const contact = type === "email" ? p.email : p.phone;
                      const grade = p.website_analyses?.[0]?.overall_grade;
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleProspect(p.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {p.business_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact || (
                                <span className="text-red-500">
                                  No {type === "email" ? "email" : "phone"}
                                </span>
                              )}
                            </p>
                          </div>
                          {grade && (
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {grade}
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/campaigns">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || selectedIds.size === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign ({selectedIds.size} recipients)
          </Button>
        </div>
      </form>
    </div>
  );
}
