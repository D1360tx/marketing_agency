import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

function statusRedirect(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/unsubscribe?status=${status}`, request.url));
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const result = token ? verifyUnsubscribeToken(token) : null;
    if (!result) return statusRedirect(request, "invalid");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceKey) {
      console.error("Unsubscribe service role is not configured");
      return statusRedirect(request, "error");
    }

    const service = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await service.from("unsubscribes").upsert(
      {
        user_id: result.userId,
        email: result.email,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,email" }
    );
    if (error) {
      console.error("Unsubscribe write failed:", error.message);
      return statusRedirect(request, "error");
    }

    return statusRedirect(request, "success");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return statusRedirect(request, "error");
  }
}
