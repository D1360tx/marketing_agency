import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/unsubscribe?status=invalid", request.url)
      );
    }

    const result = verifyUnsubscribeToken(token);
    if (!result) {
      return NextResponse.redirect(
        new URL("/unsubscribe?status=invalid", request.url)
      );
    }

    const supabase = await createClient();

    // Insert into unsubscribes (ignore conflicts — already unsubscribed)
    await supabase.from("unsubscribes").upsert(
      {
        user_id: result.userId,
        email: result.email,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,email" }
    );

    return NextResponse.redirect(
      new URL("/unsubscribe?status=success", request.url)
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(
      new URL("/unsubscribe?status=error", request.url)
    );
  }
}
