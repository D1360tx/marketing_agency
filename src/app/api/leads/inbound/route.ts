import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_name, website, email, phone } = body;

    if (!business_name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Save to Supabase using service role (no auth needed for inbound leads)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the owner's user_id (first user = Diego)
    const { data: users } = await supabase.auth.admin.listUsers();
    const ownerId = users?.users?.[0]?.id;

    if (ownerId) {
      await supabase.from("prospects").insert({
        user_id: ownerId,
        business_name,
        email,
        phone: phone || null,
        website_url: website || null,
        status: "new",
        search_query: "Inbound — landing page",
        notes: `Source: Landing page form\nWebsite: ${website || "none"}`,
      });
    }

    // Send notification email to Diego
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `Booked Out <diego@trybookedout.com>`,
      to: "smoliker@gmail.com",
      subject: `🔥 New inbound lead: ${business_name}`,
      html: `
        <h2>New lead from trybookedout.com</h2>
        <table>
          <tr><td><strong>Business:</strong></td><td>${business_name}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${phone || "—"}</td></tr>
          <tr><td><strong>Website:</strong></td><td>${website || "—"}</td></tr>
        </table>
        <p><a href="https://trybookedout.com/leads">View in Booked Out →</a></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Inbound lead error:", err);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
