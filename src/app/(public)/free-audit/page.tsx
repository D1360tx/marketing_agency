"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  Mail,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Star,
  MapPin,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessData {
  placeId: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  reviewCount: number;
  rating: number;
  photoCount: number;
  hoursListed: boolean;
  descriptionPresent: boolean;
  lastPostDate: string | null;
}

interface CompetitorData {
  name: string;
  reviewCount: number;
  rating: number;
  photoCount: number;
}

interface ScoreBreakdown {
  reviews: number;
  rating: number;
  photos: number;
  hours: number;
  website: number;
  description: number;
  posts: number;
  vsCompetitors: number;
}

interface AuditResult {
  business: BusinessData;
  competitors: CompetitorData[];
  score: number;
  breakdown: ScoreBreakdown;
  issues: string[];
  recommendations: string[];
}

type Step = "input" | "loading" | "teaser" | "email" | "full";

/* ------------------------------------------------------------------ */
/*  Score gauge                                                        */
/* ------------------------------------------------------------------ */

function ScoreGauge({
  score,
  blurred = false,
}: {
  score: number;
  blurred?: boolean;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 100;
  const offset = circumference * (1 - pct);

  const color =
    score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className={`relative inline-flex items-center justify-center ${blurred ? "blur-sm" : ""}`}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Breakdown row                                                      */
/* ------------------------------------------------------------------ */

const breakdownLabels: Record<string, { label: string; max: number }> = {
  reviews: { label: "Review Count", max: 20 },
  rating: { label: "Star Rating", max: 15 },
  photos: { label: "Photo Count", max: 15 },
  hours: { label: "Hours Listed", max: 10 },
  website: { label: "Website Linked", max: 10 },
  description: { label: "Business Description", max: 10 },
  posts: { label: "Google Posts Activity", max: 10 },
  vsCompetitors: { label: "vs Competitors (Reviews)", max: 10 },
};

function BreakdownRow({
  label,
  earned,
  max,
  blurred = false,
}: {
  label: string;
  earned: number;
  max: number;
  blurred?: boolean;
}) {
  const full = earned === max;
  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-slate-700/50 ${blurred ? "blur-sm select-none" : ""}`}
    >
      <div className="flex items-center gap-3">
        {full ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        ) : earned > 0 ? (
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <span className="text-slate-200">{label}</span>
      </div>
      <span
        className={`font-semibold ${full ? "text-green-400" : earned > 0 ? "text-yellow-400" : "text-red-400"}`}
      >
        {earned}/{max}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function FreeAuditPage() {
  const [step, setStep] = useState<Step>("input");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleLookup = useCallback(async () => {
    if (!businessName.trim() || !city.trim()) {
      setError("Please enter both your business name and city.");
      return;
    }
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/audit/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), city: city.trim() }),
      });

      if (!res.ok) throw new Error("Lookup failed");

      const data: AuditResult = await res.json();
      setAudit(data);
      setStep("teaser");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("input");
    }
  }, [businessName, city]);

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await fetch("/api/audit/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          business: audit?.business,
          score: audit?.score,
          reportData: audit,
        }),
      });

      setStep("full");
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [email, audit]);

  const handleDownloadPdf = useCallback(async () => {
    if (!audit) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/audit/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audit),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gbp-audit-${audit.business.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }, [audit]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-teal-400">
            Booked Out
          </a>
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-300">Free Audit Tool</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            How Does Your Google Business
            <br />
            <span className="text-teal-400">Profile Stack Up?</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Get a free audit of your Google Business Profile in 30 seconds.
            See your score, find issues, and learn how to beat your competitors.
          </p>
        </div>

        {/* Step: Input */}
        {step === "input" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Austin HVAC Pro"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                onClick={handleLookup}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5" />
                Audit My Business
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">
              No credit card required. Takes 30 seconds.
            </p>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
            <p className="text-slate-300 text-lg">
              Analyzing your Google Business Profile...
            </p>
            <p className="text-slate-500 text-sm">
              Checking reviews, photos, posts, and competitors
            </p>
          </div>
        )}

        {/* Step: Teaser */}
        {step === "teaser" && audit && (
          <div className="space-y-8">
            {/* Score card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="text-slate-400 text-sm">
                  {audit.business.category} in {audit.business.city}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-6">{audit.business.name}</h2>

              <ScoreGauge score={audit.score} />

              <div className="mt-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 font-medium">
                  {audit.issues.length} issues found
                </span>
              </div>
            </div>

            {/* Teaser findings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4">Quick Findings</h3>
              <div className="space-y-3">
                {audit.issues.slice(0, 2).map((issue, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{issue}</span>
                  </div>
                ))}
                {audit.issues.length > 2 && (
                  <div className="flex items-start gap-3 blur-sm select-none">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{audit.issues[2]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Blurred full report preview */}
            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 blur-sm select-none pointer-events-none">
                <h3 className="text-lg font-semibold mb-4">
                  Full Score Breakdown
                </h3>
                {Object.entries(audit.breakdown).map(([key, val]) => {
                  const meta = breakdownLabels[key];
                  if (!meta) return null;
                  return (
                    <BreakdownRow
                      key={key}
                      label={meta.label}
                      earned={val as number}
                      max={meta.max}
                    />
                  );
                })}
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-4 px-8 rounded-xl shadow-2xl shadow-teal-500/25 transition-all cursor-pointer text-lg"
                >
                  <Mail className="w-5 h-5" />
                  Unlock Full Report
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Email capture */}
        {step === "email" && audit && (
          <div className="space-y-8">
            {/* Keep score visible */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
              <ScoreGauge score={audit.score} />
              <p className="text-slate-400 mt-4">
                {audit.issues.length} issues found for{" "}
                <span className="text-white font-medium">
                  {audit.business.name}
                </span>
              </p>
            </div>

            {/* Email form */}
            <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6 md:p-8 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">
                  Get Your Full Report
                </h3>
                <p className="text-slate-400">
                  Enter your email to see the complete breakdown, competitor
                  comparison, and actionable recommendations.
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {submitting ? "Unlocking..." : "Unlock Full Report"}
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                <span>No spam, ever</span>
                <span>·</span>
                <span>Unsubscribe anytime</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Full report */}
        {step === "full" && audit && (
          <div className="space-y-8">
            {/* Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="text-slate-400 text-sm">
                  {audit.business.category} in {audit.business.city}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-6">{audit.business.name}</h2>
              <ScoreGauge score={audit.score} />
            </div>

            {/* Full breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                Score Breakdown
              </h3>
              {Object.entries(audit.breakdown).map(([key, val]) => {
                const meta = breakdownLabels[key];
                if (!meta) return null;
                return (
                  <BreakdownRow
                    key={key}
                    label={meta.label}
                    earned={val as number}
                    max={meta.max}
                  />
                );
              })}
            </div>

            {/* Issues */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Issues Found ({audit.issues.length})
              </h3>
              <div className="space-y-3">
                {audit.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Recommendations
              </h3>
              <div className="space-y-4">
                {audit.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="bg-teal-500/20 text-teal-300 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-300">{rec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor comparison */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Competitor Comparison
              </h3>

              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                  <p className="font-semibold text-teal-300 mb-2">
                    {audit.business.name} (You)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-slate-400">Reviews</p>
                      <p className="font-bold text-white">{audit.business.reviewCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Rating</p>
                      <p className="font-bold text-white">{audit.business.rating}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Photos</p>
                      <p className="font-bold text-white">{audit.business.photoCount}</p>
                    </div>
                  </div>
                </div>
                {audit.competitors.map((c, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="font-semibold text-slate-200 mb-2">{c.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-slate-400">Reviews</p>
                        <p className="font-bold text-white">{c.reviewCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Rating</p>
                        <p className="font-bold text-white">{c.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Photos</p>
                        <p className="font-bold text-white">{c.photoCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 pr-4 text-sm font-medium text-slate-400">
                        Business
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-slate-400">
                        Reviews
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-slate-400">
                        Rating
                      </th>
                      <th className="py-3 pl-4 text-sm font-medium text-slate-400">
                        Photos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/50 bg-teal-500/5">
                      <td className="py-3 pr-4 font-semibold text-teal-300">
                        {audit.business.name} (You)
                      </td>
                      <td className="py-3 px-4">{audit.business.reviewCount}</td>
                      <td className="py-3 px-4">{audit.business.rating}</td>
                      <td className="py-3 pl-4">{audit.business.photoCount}</td>
                    </tr>
                    {audit.competitors.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-700/50"
                      >
                        <td className="py-3 pr-4 text-slate-300">{c.name}</td>
                        <td className="py-3 px-4">{c.reviewCount}</td>
                        <td className="py-3 px-4">{c.rating}</td>
                        <td className="py-3 pl-4">{c.photoCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
              >
                {pdfLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {pdfLoading ? "Generating..." : "Download PDF Report"}
              </button>
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Book a Free Strategy Call
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}

        {/* Trust badges */}
        {(step === "input" || step === "teaser") && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: Shield,
                title: "100% Free",
                desc: "No credit card, no hidden fees. Ever.",
              },
              {
                icon: TrendingUp,
                title: "Data-Driven",
                desc: "Real data from your Google Business Profile.",
              },
              {
                icon: Star,
                title: "Actionable",
                desc: "Clear recommendations you can implement today.",
              },
            ].map((badge) => (
              <div
                key={badge.title}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
              >
                <badge.icon className="w-8 h-8 text-teal-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-1">{badge.title}</h4>
                <p className="text-sm text-slate-400">{badge.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Booked Out. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
