import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/gemini";
import { generateWebsiteWithClaude } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, data, scrapedContent } = await request.json();

    if (!templateId || !data) {
      return NextResponse.json(
        { error: "templateId and data are required" },
        { status: 400 }
      );
    }

    // Resolve API keys: user settings → env var
    let geminiKey = process.env.GEMINI_API_KEY || "";
    let anthropicKey = process.env.ANTHROPIC_API_KEY || "";

    try {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("gemini_api_key, anthropic_api_key")
        .eq("user_id", user.id)
        .single();

      if (settings?.gemini_api_key) {
        geminiKey = settings.gemini_api_key;
      }
      if (settings?.anthropic_api_key) {
        anthropicKey = settings.anthropic_api_key;
      }
    } catch {
      // No settings row — fall through to env vars
    }

    if (!geminiKey && !anthropicKey) {
      return NextResponse.json(
        {
          error:
            "No AI API keys configured. Add a Gemini or Anthropic key in Settings.",
        },
        { status: 400 }
      );
    }

    // Run both generators in parallel
    const [geminiResult, claudeResult] = await Promise.allSettled([
      geminiKey
        ? generateWebsite(geminiKey, templateId, data, scrapedContent)
        : Promise.reject(new Error("No Gemini API key")),
      anthropicKey
        ? generateWebsiteWithClaude(anthropicKey, templateId, data, scrapedContent)
        : Promise.reject(new Error("No Anthropic API key")),
    ]);

    const geminiHtml =
      geminiResult.status === "fulfilled" ? geminiResult.value : null;
    const claudeHtml =
      claudeResult.status === "fulfilled" ? claudeResult.value : null;

    if (!geminiHtml && !claudeHtml) {
      const errors = [
        geminiResult.status === "rejected" ? `Gemini: ${geminiResult.reason}` : null,
        claudeResult.status === "rejected" ? `Claude: ${claudeResult.reason}` : null,
      ]
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { error: `All generators failed. ${errors}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      html: geminiHtml || claudeHtml,
      claudeHtml: claudeHtml || null,
      geminiHtml: geminiHtml || null,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate website" },
      { status: 500 }
    );
  }
}
