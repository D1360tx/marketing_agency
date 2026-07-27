import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  hasValidImageSignature,
  isPendingOnboardingLinkActive,
  isValidOnboardingToken,
  ONBOARDING_ASSET_BUCKET,
  ONBOARDING_MAX_FILE_BYTES,
  ONBOARDING_MAX_PHOTOS,
  validateOnboardingImage,
} from "@/lib/onboarding-security";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidOnboardingToken(token)) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > ONBOARDING_MAX_FILE_BYTES + 512 * 1024) {
    return NextResponse.json({ error: "Upload is too large" }, { status: 413 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Onboarding is not configured" }, { status: 503 });
  }

  const { data: onboarding, error: lookupError } = await supabase
    .from("client_onboarding")
    .select("id, submitted_at, expires_at, revoked_at")
    .eq("token", token)
    .single();

  if (lookupError || !onboarding) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }
  if (onboarding.submitted_at) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }
  if (!isPendingOnboardingLinkActive(onboarding)) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 410 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || (kind !== "logo" && kind !== "photo")) {
    return NextResponse.json({ error: "A valid image and upload type are required" }, { status: 400 });
  }

  const validation = validateOnboardingImage(file);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const folder = kind === "logo" ? "logo" : "photos";
  const { data: existingFiles, error: listError } = await supabase.storage
    .from(ONBOARDING_ASSET_BUCKET)
    .list(`${onboarding.id}/${folder}`, { limit: ONBOARDING_MAX_PHOTOS + 1 });

  if (listError) {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
  if (kind === "photo" && (existingFiles?.length || 0) >= ONBOARDING_MAX_PHOTOS) {
    return NextResponse.json({ error: "A maximum of 10 photos is allowed" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: "Image content does not match its file type" }, { status: 400 });
  }

  if (kind === "logo" && existingFiles?.length) {
    const oldPaths = existingFiles.map((item) => `${onboarding.id}/logo/${item.name}`);
    const { error: removeError } = await supabase.storage
      .from(ONBOARDING_ASSET_BUCKET)
      .remove(oldPaths);
    if (removeError) {
      return NextResponse.json({ error: "Existing logo could not be replaced" }, { status: 500 });
    }
  }

  const path = `${onboarding.id}/${folder}/${randomUUID()}.${validation.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(ONBOARDING_ASSET_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[onboarding/upload] Storage error:", uploadError);
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(ONBOARDING_ASSET_BUCKET)
    .createSignedUrl(path, 15 * 60);

  if (signedError || !signed?.signedUrl) {
    await supabase.storage.from(ONBOARDING_ASSET_BUCKET).remove([path]);
    return NextResponse.json({ error: "Image preview could not be created" }, { status: 500 });
  }

  const response = NextResponse.json({ path, previewUrl: signed.signedUrl });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
