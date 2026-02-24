"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WebsitePreview } from "@/components/website-preview";
import {
  templates,
  defaultData,
  type TemplateData,
} from "@/lib/templates";
import {
  UtensilsCrossed,
  Wrench,
  Briefcase,
  Sparkles,
  Store,
  Plus,
  X,
  Loader2,
  Globe,
  Download,
  Eye,
  Wand2,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";
import type { ProspectWithAnalysis } from "@/types";

const iconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Store: <Store className="h-5 w-5" />,
};

export default function GeneratorPage() {
  const searchParams = useSearchParams();
  const prospectId = searchParams.get("prospect");

  const [selectedTemplate, setSelectedTemplate] = useState<string>("contractor");
  const [data, setData] = useState<TemplateData>(defaultData.contractor);
  const [newService, setNewService] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scrapedContent, setScrapedContent] = useState<Record<string, any> | null>(null);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [aiHTML, setAiHTML] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"template" | "ai">("template");
  const [fullscreen, setFullscreen] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Auto-fill from prospect
  useEffect(() => {
    if (!prospectId) return;

    async function loadProspect() {
      try {
        const res = await fetch("/api/prospects");
        const result = await res.json();
        const prospect = (result.prospects || []).find(
          (p: ProspectWithAnalysis) => p.id === prospectId
        );
        if (prospect) {
          setData((prev) => ({
            ...prev,
            businessName: prospect.business_name || prev.businessName,
            phone: prospect.phone || prev.phone,
            email: prospect.email || prev.email,
            address: [prospect.address, prospect.city, prospect.state, prospect.zip]
              .filter(Boolean)
              .join(", ") || prev.address,
          }));
          if (prospect.website_url) {
            setScrapeUrl(prospect.website_url);
          }
          // Auto-select template based on business type
          const type = prospect.business_type?.toLowerCase() || "";
          if (type.includes("restaurant") || type.includes("food") || type.includes("cafe")) {
            setSelectedTemplate("restaurant");
          } else if (type.includes("salon") || type.includes("spa") || type.includes("beauty") || type.includes("nail") || type.includes("barber")) {
            setSelectedTemplate("salon");
          } else if (type.includes("law") || type.includes("account") || type.includes("consult") || type.includes("doctor") || type.includes("dentist") || type.includes("chiro")) {
            setSelectedTemplate("professional");
          } else if (type.includes("shop") || type.includes("store") || type.includes("retail") || type.includes("boutique")) {
            setSelectedTemplate("retail");
          } else {
            setSelectedTemplate("contractor");
          }
        }
      } catch {
        console.error("Failed to load prospect");
      }
    }
    loadProspect();
  }, [prospectId]);

  // Update default data when template changes
  useEffect(() => {
    setData((prev) => ({
      ...defaultData[selectedTemplate],
      // Keep user-entered business info
      businessName: prev.businessName !== defaultData[Object.keys(defaultData).find(k => k !== selectedTemplate && defaultData[k].businessName === prev.businessName) || ""]?.businessName
        ? prev.businessName
        : defaultData[selectedTemplate].businessName,
      phone: prev.phone,
      email: prev.email,
      address: prev.address,
      primaryColor: defaultData[selectedTemplate].primaryColor,
    }));
  }, [selectedTemplate]);

  function updateField(field: keyof TemplateData, value: string | string[]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function addService() {
    if (newService.trim()) {
      setData((prev) => ({
        ...prev,
        services: [...prev.services, newService.trim()],
      }));
      setNewService("");
    }
  }

  function removeService(index: number) {
    setData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  }

  async function handleScrape() {
    if (!scrapeUrl) return;
    setScraping(true);

    try {
      const res = await fetch("/api/generator/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const result = await res.json();

      if (result.data) {
        setData((prev) => ({
          ...prev,
          businessName: result.data.businessName || prev.businessName,
          tagline: result.data.tagline || prev.tagline,
          phone: result.data.phone || prev.phone,
          email: result.data.email || prev.email,
          address: result.data.address || prev.address,
          description: result.data.description || prev.description,
          services: result.data.services?.length > 0 ? result.data.services : prev.services,
        }));
        // Store full scraped content for AI generation
        setScrapedContent(result.data);
      }
    } catch {
      console.error("Scrape failed");
    } finally {
      setScraping(false);
    }
  }

  function handleExportHTML() {
    const html = aiHTML || generateStandaloneHTML(selectedTemplate, data);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.businessName.replace(/\s+/g, "-").toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateAI() {
    setGenerating(true);
    setAiError(null);

    try {
      const res = await fetch("/api/generator/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data,
          scrapedContent: scrapedContent || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setAiError(result.error || "Generation failed");
        return;
      }

      setAiHTML(result.html);
      setPreviewMode("ai");
    } catch {
      setAiError("Failed to connect to AI service");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    const html = aiHTML || generateStandaloneHTML(selectedTemplate, data);
    setSaving(true);
    setShareUrl(null);

    try {
      const res = await fetch("/api/generator/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          business_name: data.businessName,
          html_content: html,
          prospect_id: prospectId || undefined,
        }),
      });

      const result = await res.json();

      if (res.ok && result.site?.share_token) {
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/preview/${result.site.share_token}`);
      }
    } catch {
      console.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Generator</h1>
        <p className="text-muted-foreground">
          Create a modern website for your prospect in minutes
        </p>
      </div>

      {/* Template picker */}
      <div>
        <h2 className="mb-3 text-sm font-medium">Choose a Style</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                selectedTemplate === t.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="mb-2">{iconMap[t.icon]}</div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.category}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Form */}
        <div className="space-y-4 lg:col-span-2">
          {/* Scrape existing website */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Import from Website</CardTitle>
              <CardDescription>
                Scrape the business&apos;s existing website to auto-fill details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleScrape}
                  disabled={scraping || !scrapeUrl}
                >
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Business Name</Label>
                <Input
                  value={data.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tagline</Label>
                <Input
                  value={data.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={data.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={data.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Address</Label>
                <Input
                  value={data.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Brand Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    value={data.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Services</Label>
                <div className="flex flex-wrap gap-1.5">
                  {data.services.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => removeService(i)}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a service..."
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                  />
                  <Button variant="outline" size="icon" onClick={addService}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleGenerateAI}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generating with AI..." : "Generate with AI"}
            </Button>
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleExportHTML}
              >
                <Download className="mr-2 h-4 w-4" />
                {aiHTML ? "Download AI Website" : "Export HTML"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save & Share
              </Button>
            </div>
            {shareUrl && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Share Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" /> Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                  {aiHTML && (
                    <div className="flex rounded-md border">
                      <button
                        className={`px-3 py-1 text-xs font-medium transition-colors ${
                          previewMode === "template"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setPreviewMode("template")}
                      >
                        Template
                      </button>
                      <button
                        className={`px-3 py-1 text-xs font-medium transition-colors ${
                          previewMode === "ai"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setPreviewMode("ai")}
                      >
                        AI Generated
                      </button>
                    </div>
                  )}
                  {previewMode === "ai" && aiHTML && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullscreen(true)}
                    >
                      <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                      Full Size
                    </Button>
                  )}
                  <Badge variant="outline">
                    {templates.find((t) => t.id === selectedTemplate)?.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border shadow-inner">
                {generating ? (
                  <div className="flex h-[500px] flex-col items-center justify-center gap-3 bg-muted/30">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Generating website with AI...</p>
                      <p className="text-xs text-muted-foreground">This may take 15-30 seconds</p>
                    </div>
                  </div>
                ) : previewMode === "ai" && aiHTML ? (
                  <div className="relative bg-muted/20" style={{ height: "600px", overflow: "hidden" }}>
                    <iframe
                      srcDoc={aiHTML}
                      title="AI Generated Website Preview"
                      className="border-0"
                      sandbox="allow-same-origin allow-scripts"
                      style={{
                        width: "1440px",
                        height: "900px",
                        transform: "scale(0.45)",
                        transformOrigin: "top left",
                      }}
                    />
                  </div>
                ) : (
                  <WebsitePreview templateId={selectedTemplate} data={data} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen preview modal */}
      {fullscreen && aiHTML && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-2" style={{ background: "#18181b", borderBottom: "1px solid #3f3f46" }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {data.businessName} — Full Preview
                </span>
                <Badge variant="secondary" className="text-xs">
                  {templates.find((t) => t.id === selectedTemplate)?.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportHTML}
                  style={{ background: "#27272a", color: "#fff", border: "1px solid #3f3f46", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setFullscreen(false)}
                  style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                srcDoc={aiHTML}
                title="AI Generated Website Full Preview"
                className="h-full w-full border-0"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateStandaloneHTML(templateId: string, data: TemplateData): string {
  const servicesHTML = data.services
    .map(
      (s) =>
        `<div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><strong>${s}</strong></div>`
    )
    .join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
    .hero { padding: 60px 24px; text-align: center; color: white; background: linear-gradient(135deg, ${data.primaryColor}, ${data.primaryColor}dd); }
    .hero h1 { font-size: 2.5rem; font-weight: 700; }
    .hero p { margin-top: 8px; opacity: 0.85; max-width: 500px; margin-left: auto; margin-right: auto; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 20px; }
    .btn-primary { background: white; color: ${data.primaryColor}; }
    .btn-outline { border: 2px solid rgba(255,255,255,0.5); color: white; margin-left: 8px; }
    .services { padding: 48px 24px; max-width: 800px; margin: auto; }
    .services h2 { text-align: center; margin-bottom: 24px; font-size: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    footer { background: #f9fafb; padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center; }
    footer .info { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .hero h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #e5e7eb">
    <strong style="font-size:1.1rem">${data.businessName}</strong>
    <a href="tel:${data.phone}" class="btn" style="margin:0;padding:8px 16px;background:${data.primaryColor};color:white;font-size:0.9rem;border-radius:6px">Call Now</a>
  </nav>

  <div class="hero">
    <h1>${data.businessName}</h1>
    <p><em>${data.tagline}</em></p>
    <p style="margin-top:16px;opacity:0.8">${data.description}</p>
    <a href="tel:${data.phone}" class="btn btn-primary">Contact Us</a>
  </div>

  <div class="services">
    <h2>Our Services</h2>
    <div class="grid">
      ${servicesHTML}
    </div>
  </div>

  <footer>
    <div class="info">
      <span>${data.phone}</span>
      <span>${data.email}</span>
      <span>${data.address}</span>
    </div>
    <p style="color:#9ca3af">&copy; ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
  </footer>
</body>
</html>`;
}
