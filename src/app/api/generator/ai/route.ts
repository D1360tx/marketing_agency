import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/gemini";
import { generateWebsiteWithClaude } from "@/lib/claude";
import { findUnsupportedClaims } from "@/lib/generator-security";

const MAX_REQUEST_BYTES = 100 * 1024;
const MAX_GENERATED_HTML_BYTES = 1024 * 1024;

const templateDataSchema = z
  .object({
    businessName: z.string().trim().min(1).max(120),
    tagline: z.string().trim().max(180),
    phone: z.string().trim().max(40),
    email: z.string().trim().max(254),
    address: z.string().trim().max(300),
    services: z.array(z.string().trim().min(1).max(100)).max(12),
    primaryColor: z.string().trim().regex(/^#[0-9a-f]{6}$/i),
    description: z.string().trim().max(2_000),
  })
  .strict();

const requestSchema = z
  .object({
    templateId: z.enum([
      "restaurant",
      "contractor",
      "professional",
      "salon",
      "retail",
    ]),
    data: templateDataSchema,
    scrapedContent: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

function validateGeneratedHtml(html: string, sourceText: string): string {
  const trimmed = html.trim();
  if (
    Buffer.byteLength(trimmed) > MAX_GENERATED_HTML_BYTES ||
    (!trimmed.startsWith("<!DOCTYPE") && !trimmed.startsWith("<html"))
  ) {
    throw new Error("Provider returned invalid HTML");
  }

  const unsupportedClaims = findUnsupportedClaims(trimmed, sourceText);
  if (unsupportedClaims.length > 0) {
    throw new Error(
      `Provider introduced unsupported claims: ${unsupportedClaims.join(", ")}`
    );
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody) > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid generator input" },
        { status: 400 }
      );
    }
    const { templateId, data, scrapedContent } = parsed.data;

    let geminiKey = process.env.GEMINI_API_KEY || "";
    let anthropicKey = process.env.ANTHROPIC_API_KEY || "";
    const { data: settings } = await supabase
      .from("user_settings")
      .select("gemini_api_key, anthropic_api_key")
      .eq("user_id", user.id)
      .maybeSingle();
    geminiKey = settings?.gemini_api_key || geminiKey;
    anthropicKey = settings?.anthropic_api_key || anthropicKey;

    if (!geminiKey && !anthropicKey) {
      return NextResponse.json(
        { error: "Configure Gemini or Claude in Settings first" },
        { status: 503 }
      );
    }

    const sourceText = JSON.stringify({ data, scrapedContent });
    let geminiHtml: string | null = null;
    let claudeHtml: string | null = null;

    // Use one paid provider. Claude is a fallback only when Gemini is unavailable
    // or rejects the request/output validation.
    if (geminiKey) {
      try {
        geminiHtml = validateGeneratedHtml(
          await generateWebsite(geminiKey, templateId, data, scrapedContent),
          sourceText
        );
      } catch (error) {
        console.error("Gemini generation failed:", error);
      }
    }

    if (!geminiHtml && anthropicKey) {
      try {
        claudeHtml = validateGeneratedHtml(
          await generateWebsiteWithClaude(
            anthropicKey,
            templateId,
            data,
            scrapedContent
          ),
          sourceText
        );
      } catch (error) {
        console.error("Claude generation failed:", error);
      }
    }

    const html = geminiHtml || claudeHtml;
    if (!html) {
      return NextResponse.json(
        {
          error:
            "Website generation failed validation. Review the business details and try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      html,
      geminiHtml,
      claudeHtml,
      provider: geminiHtml ? "gemini" : "claude",
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate website" },
      { status: 500 }
    );
  }
}
