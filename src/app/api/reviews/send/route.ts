import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customer_name, customer_email, business_name, google_review_url } =
      await request.json();

    if (!customer_name || !customer_email || !business_name || !google_review_url) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "diego@trybookedout.com";
    const fromName = process.env.RESEND_FROM_NAME || "Booked Out";

    if (!apiKey) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
  <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #1a1a1a; margin-bottom: 8px;">Hi ${customer_name}! 👋</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.6;">
      Thank you for choosing <strong>${business_name}</strong>! We hope everything went smoothly.
    </p>
    <p style="color: #444; font-size: 16px; line-height: 1.6;">
      If you had a great experience, we'd really appreciate it if you could leave us a quick review. It only takes 30 seconds and helps us a lot!
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${google_review_url}" 
         style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
        ⭐ Leave a Review
      </a>
    </div>
    <p style="color: #888; font-size: 14px;">
      Thanks again for your business. We truly appreciate it!
    </p>
    <p style="color: #888; font-size: 14px;">— The ${business_name} Team</p>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customer_email,
      subject: `How did we do, ${customer_name}? ⭐`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to Supabase
    await supabase.from("review_requests").insert({
      user_id: user.id,
      customer_name,
      customer_email,
      business_name,
      google_review_url,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
