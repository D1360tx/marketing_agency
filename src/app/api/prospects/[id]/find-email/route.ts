import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractEmails } from "@/lib/email-extractor";
import { logActivity } from "@/lib/activity-log";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: prospect } = await supabase
    .from("prospects")
    .select("website_url, email")
    .eq("id", id)
    .single();

  if (!prospect?.website_url) {
    return NextResponse.json({ error: "No website URL to search" }, { status: 400 });
  }

  if (prospect.email) {
    return NextResponse.json({ email: prospect.email, already_had: true });
  }

  try {
    const emails = await extractEmails(prospect.website_url);
    if (!emails.length) return NextResponse.json({ found: false });

    const email = emails[0];
    await supabase.from("prospects").update({ email }).eq("id", id);
    await logActivity(supabase, {
      prospect_id: id,
      user_id: user.id,
      activity_type: "email_found",
      description: `Email found: ${email}`,
      metadata: { email },
    });
    return NextResponse.json({ found: true, email });
  } catch {
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
