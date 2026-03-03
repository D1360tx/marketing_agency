"use client";

import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";

export function AuditForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ business_name: "", phone: "", email: "", website: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/leads/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      // still show success to user
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-2xl bg-green-50 py-10 text-center ring-1 ring-green-200">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <div>
          <p className="text-lg font-semibold text-slate-900">You&apos;re on the list!</p>
          <p className="mt-1 text-sm text-slate-600">We&apos;ll review your site and reach out within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-xs font-semibold text-slate-700">Business name</div>
          <input
            type="text"
            required
            placeholder="Mike's Plumbing"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-blue-600/20 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
          />
        </label>
        <label className="space-y-1">
          <div className="text-xs font-semibold text-slate-700">Phone</div>
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-blue-600/20 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
          />
        </label>
      </div>
      <label className="space-y-1">
        <div className="text-xs font-semibold text-slate-700">Email</div>
        <input
          type="email"
          required
          placeholder="you@business.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-blue-600/20 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
        />
      </label>
      <label className="space-y-1">
        <div className="text-xs font-semibold text-slate-700">Current website (optional)</div>
        <input
          type="text"
          placeholder="https://yourbusiness.com"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-blue-600/20 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-70"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <>Get My Free Website Audit <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </form>
  );
}
