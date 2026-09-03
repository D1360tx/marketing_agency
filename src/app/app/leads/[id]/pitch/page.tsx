"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateLeadPitch } from "@/lib/lead-sales";
import type { ProspectWithAnalysis, WebsiteAnalysis } from "@/types";

export default function LeadPitchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prospect, setProspect] = useState<ProspectWithAnalysis | null>(null);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const suggestedPitch = useMemo(() => {
    if (!prospect) return "";
    return generateLeadPitch(
      prospect,
      prospect.website_analyses?.[0] as WebsiteAnalysis | undefined
    );
  }, [prospect]);

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/prospects/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (!response.ok || !result.prospect) {
          throw new Error(result.error || "Lead not found");
        }
        const loaded = result.prospect as ProspectWithAnalysis;
        setProspect(loaded);
        setPitch(generateLeadPitch(
          loaded,
          loaded.website_analyses?.[0] as WebsiteAnalysis | undefined
        ));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load this lead");
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [id]);

  async function copyPitch() {
    try {
      await navigator.clipboard.writeText(pitch);
      toast.success("Pitch copied");
    } catch {
      toast.error("Could not copy. Select the pitch and copy it manually.");
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 sm:h-9 sm:w-9">
          <Link href={`/app/leads/${id}`} aria-label="Back to lead"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Pitch Editor</h1>
          <p className="truncate text-sm text-muted-foreground">
            {prospect?.business_name || "Lead"}
          </p>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-4 text-sm text-red-700 sm:p-6">{error}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Review and personalize</CardTitle>
            <CardDescription>
              Edit this message before copying it into Facebook, email, or your preferred outreach channel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <Textarea
              value={pitch}
              onChange={(event) => setPitch(event.target.value)}
              rows={10}
              className="min-h-64 resize-y text-base leading-7"
              aria-label="Editable lead pitch"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{pitch.length} characters</p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  variant="outline"
                  className="min-h-11 sm:min-h-9"
                  onClick={() => setPitch(suggestedPitch)}
                  disabled={pitch === suggestedPitch}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button className="min-h-11 sm:min-h-9" onClick={copyPitch} disabled={!pitch.trim()}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Pitch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
