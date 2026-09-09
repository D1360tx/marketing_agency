import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRelativePath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRelativePath(searchParams.get("next"));

  // Dashboard invitations have no browser PKCE verifier. The invite email
  // template must link here with TokenHash, not a fragment-only ConfirmationURL.
  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && searchParams.get("type") === "invite" && !code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "invite",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/accept-invite`);
    }
  }

  if (code && !tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
