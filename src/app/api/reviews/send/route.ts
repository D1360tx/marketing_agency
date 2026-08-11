import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { escapeEmailHtml, isGoogleReviewUrl } from "@/lib/review-security";

const MAX_REQUEST_BYTES = 16 * 1024;
const reviewRequestSchema = z.object({
  customer_name: z.string().trim().min(1).max(100),
  customer_email: z.string().trim().email().max(254),
  business_name: z.string().trim().min(1).max(160),
  google_review_url: z
    .string()
    .trim()
    .max(2048)
    .refine(isGoogleReviewUrl, "Use a valid HTTPS Google review link"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }

    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const parsed = reviewRequestSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review request" },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const { data: settings } = await supabase
      .from("user_settings")
      .select("resend_api_key, sender_email, sender_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const apiKey = settings?.resend_api_key || process.env.RESEND_API_KEY;
    const fromEmail =
      settings?.sender_email || process.env.RESEND_FROM_EMAIL || "info@trybookedout.com";
    const fromName =
      settings?.sender_name || process.env.RESEND_FROM_NAME || "Booked Out";
    if (!apiKey) {
      return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
    }

    const customerName = escapeEmailHtml(body.customer_name);
    const businessName = escapeEmailHtml(body.business_name);
    const reviewUrl = escapeEmailHtml(body.google_review_url);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
  <div style="background:white;border-radius:8px;padding:40px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">Hi ${customerName},</h2>
    <p style="color:#444;font-size:16px;line-height:1.6">Thank you for choosing <strong>${businessName}</strong>. We hope everything went smoothly.</p>
    <p style="color:#444;font-size:16px;line-height:1.6">If you had a great experience, we would appreciate a quick Google review.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${reviewUrl}" style="background:#4F46E5;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">Leave a Review</a>
    </div>
    <p style="color:#888;font-size:14px">Thank you again.<br>— The ${businessName} Team</p>
  </div>
</body></html>`;

    const { error: sendError } = await new Resend(apiKey).emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: body.customer_email,
      subject: `How did we do, ${body.customer_name}?`,
      html,
    });
    if (sendError) {
      console.error("Review request send failed:", sendError.message);
      return NextResponse.json({ error: "Review request could not be sent" }, { status: 502 });
    }

    const { error: logError } = await supabase.from("review_requests").insert({
      user_id: user.id,
      ...body,
    });
    if (logError) {
      console.error("Review request logging failed after delivery:", logError.message);
    }

    return NextResponse.json({ success: true, logged: !logError });
  } catch (error) {
    console.error("Review request failed:", error);
    return NextResponse.json({ error: "Review request could not be sent" }, { status: 500 });
  }
}
