import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/gemini";

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

    // Resolve Gemini API key: user settings → env var
    let apiKey = process.env.GEMINI_API_KEY || "";

    try {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("gemini_api_key")
        .eq("user_id", user.id)
        .single();

      if (settings?.gemini_api_key) {
        apiKey = settings.gemini_api_key;
      }
    } catch {
      // No settings row or column doesn't exist yet — fall through to env var
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key not configured. Add it in Settings or set GEMINI_API_KEY env var.",
        },
        { status: 400 }
      );
    }

    const html = await generateWebsite(apiKey, templateId, data, scrapedContent);

    if (!html) {
      return NextResponse.json(
        { error: "Failed to generate website content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ html });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate website" },
      { status: 500 }
    );
  }
}
