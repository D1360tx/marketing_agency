import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  isValidOnboardingToken,
  normalizeOnboardingAssetPath,
  ONBOARDING_ASSET_BUCKET,
} from "@/lib/onboarding-security";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path") || "";
  if (rawPath.length > 2048) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const path = normalizeOnboardingAssetPath(rawPath);
  const recordKey = path?.split("/")[0] || "";
  // New objects are UUID-prefixed. Token-prefixed lookup remains temporarily
  // for private access to assets created by the original public-bucket flow.
  // Both branches still require an authenticated owner match below.
  const keyColumn = UUID_PATTERN.test(recordKey)
    ? "id"
    : isValidOnboardingToken(recordKey)
      ? "token"
      : null;
  if (!path || !keyColumn) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: onboarding } = await supabase
    .from("client_onboarding")
    .select("id")
    .eq(keyColumn, recordKey)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!onboarding) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ error: "Asset service is not configured" }, { status: 503 });
  }

  const service = createServiceClient(serviceUrl, serviceKey);
  const { data, error } = await service.storage
    .from(ONBOARDING_ASSET_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const response = NextResponse.redirect(data.signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
