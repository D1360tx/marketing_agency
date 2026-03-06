"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function QuickAddPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    phone: "",
    source: "Door Knock",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check auth by hitting a protected endpoint
    fetch("/api/prospects?limit=1")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
        } else {
          setAuthed(true);
        }
      })
      .catch(() => setAuthed(true));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business_name.trim(),
          phone: form.phone.trim() || null,
          source: form.source,
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add lead");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAddAnother() {
    setForm({ business_name: "", phone: "", source: "Cold Call", notes: "" });
    setSuccess(false);
    setError(null);
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Booked Out</h1>
        <p className="text-sm text-gray-500 mt-1">Quick Lead Add</p>
      </div>

      <div className="w-full max-w-sm">
        {success ? (
          <div className="rounded-2xl bg-white shadow-sm border p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold text-gray-800">Lead Added!</p>
            <Button
              onClick={handleAddAnother}
              className="w-full h-12 text-base rounded-xl"
              size="lg"
            >
              Add Another?
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm border p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-base font-medium">Business Name *</Label>
              <Input
                placeholder="Mike's Plumbing"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
                className="h-12 text-base rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-medium">Phone</Label>
              <Input
                type="tel"
                placeholder="(512) 555-0100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-12 text-base rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-medium">Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="h-12 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Door Knock">Door Knock</SelectItem>
                  <SelectItem value="Facebook Group">Facebook Group</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Cold Email">Cold Email</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-medium">Notes</Label>
              <Textarea
                placeholder="What you know about them..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="text-base rounded-xl resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !form.business_name.trim()}
              className="w-full h-14 text-lg rounded-xl font-semibold"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding...</>
              ) : (
                "Add Lead"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
