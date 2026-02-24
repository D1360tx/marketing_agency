import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockAnalysis } from "@/lib/mock-data";
import { analyzeWebsite } from "@/lib/website-analyzer";
import { extractEmails } from "@/lib/email-extractor";
import { findEmailByDomain } from "@/lib/hunter";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prospect_id, website_url } = await request.json();

    if (!prospect_id) {
      return NextResponse.json(
        { error: "prospect_id is required" },
        { status: 400 }
      );
    }

    if (!website_url) {
      return NextResponse.json({
        analysis: null,
        message: "No website to analyze",
      });
    }

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    let analysis;
    let extractedEmails: string[] = [];
    let emailSource: "scraped" | "hunter" | null = null;

    if (useMock) {
      analysis = getMockAnalysis(prospect_id, website_url);
    } else {
      // Get user's settings for API keys
      const { data: settings } = await supabase
        .from("user_settings")
        .select("google_pagespeed_key, hunter_api_key")
        .eq("user_id", user.id)
        .single();

      const apiKey =
        settings?.google_pagespeed_key ||
        process.env.GOOGLE_PAGESPEED_API_KEY;

      try {
        // Run website analysis and email extraction in parallel
        const [analysisResult, emails] = await Promise.all([
          analyzeWebsite(website_url, apiKey || undefined),
          extractEmails(website_url).catch(() => [] as string[]),
        ]);

        analysis = {
          prospect_id,
          ...analysisResult,
        };
        extractedEmails = emails;

        if (emails.length > 0) {
          emailSource = "scraped";
        }
      } catch (err) {
        console.error("Analysis error:", err);
        return NextResponse.json(
          {
            error: `Website analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
          { status: 502 }
        );
      }

      // --- Hunter.io fallback if no emails found from scraping ---
      if (extractedEmails.length === 0 && settings?.hunter_api_key) {
        try {
          const hunterResult = await findEmailByDomain(
            settings.hunter_api_key,
            website_url
          );
          if (hunterResult) {
            extractedEmails = [hunterResult.email];
            emailSource = "hunter";
          }
        } catch (err) {
          console.error("Hunter.io fallback error:", err);
          // Non-fatal — continue without email
        }
      }
    }

    if (!analysis) {
      return NextResponse.json({
        analysis: null,
        message: "No website to analyze",
      });
    }

    // Store analysis in database
    const { data, error } = await supabase
      .from("website_analyses")
      .insert({
        prospect_id: analysis.prospect_id,
        performance_score: analysis.performance_score,
        accessibility_score: analysis.accessibility_score,
        best_practices_score: analysis.best_practices_score,
        seo_score: analysis.seo_score,
        has_ssl: analysis.has_ssl,
        is_mobile_friendly: analysis.is_mobile_friendly,
        load_time_ms: analysis.load_time_ms,
        has_viewport_meta: analysis.has_viewport_meta,
        technology_stack: analysis.technology_stack,
        overall_grade: analysis.overall_grade,
        raw_data: analysis.raw_data,
      })
      .select()
      .single();

    if (error) {
      console.error("Analysis insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If we found emails, update the prospect record
    if (extractedEmails.length > 0) {
      await supabase
        .from("prospects")
        .update({ email: extractedEmails[0] })
        .eq("id", prospect_id)
        .is("email", null); // only update if no email exists

      // Log email discovery
      await logActivity(supabase, {
        prospect_id,
        user_id: user.id,
        activity_type: "email_found",
        description: `Email found via ${emailSource}: ${extractedEmails[0]}`,
        metadata: { email: extractedEmails[0], source: emailSource },
      });
    }

    // --- Recalculate lead score after analysis ---
    const { data: prospect } = await supabase
      .from("prospects")
      .select("website_url, email, phone, rating, review_count")
      .eq("id", prospect_id)
      .single();

    if (prospect) {
      const { score, breakdown } = calculateLeadScore(prospect, data);
      await supabase
        .from("prospects")
        .update({
          lead_score: score,
          lead_score_breakdown: breakdown,
        })
        .eq("id", prospect_id);
    }

    // Log analysis activity
    await logActivity(supabase, {
      prospect_id,
      user_id: user.id,
      activity_type: "analyzed",
      description: `Website analyzed — Grade: ${data?.overall_grade || "N/A"}`,
      metadata: { grade: data?.overall_grade },
    });

    return NextResponse.json({
      analysis: data,
      extracted_emails: extractedEmails,
      email_source: emailSource,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
