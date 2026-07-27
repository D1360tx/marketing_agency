import assert from "node:assert/strict";
import test from "node:test";

import {
  hasValidImageSignature,
  isAssetPathForOnboarding,
  isPendingOnboardingLinkActive,
  isValidOnboardingToken,
  normalizeOnboardingAssetPath,
  onboardingSubmissionSchema,
  validateOnboardingImage,
} from "../src/lib/onboarding-security.ts";

const recordId = "550e8400-e29b-41d4-a716-446655440000";
const validToken = "0123456789abcdef0123456789abcdef";

function validSubmission(overrides = {}) {
  return {
    business_name: "Austin HVAC Pros",
    owner_name: "Jane Owner",
    phone: "512-555-0100",
    address: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    service_areas: "Austin",
    services_offered: ["HVAC"],
    has_google_my_business: true,
    google_my_business_url: "https://example.com/profile",
    existing_website: "https://example.com",
    brand_colors: "Blue and white",
    style_notes: "Clean and professional",
    logo_url: `${recordId}/logo/550e8400-e29b-41d4-a716-446655440001.png`,
    photo_urls: [`${recordId}/photos/550e8400-e29b-41d4-a716-446655440002.jpg`],
    primary_contact_name: "Jane Owner",
    primary_contact_email: "jane@example.com",
    primary_contact_phone: "512-555-0100",
    preferred_contact_method: "Email",
    review_process_notes: "Call after launch",
    additional_notes: "None",
    ...overrides,
  };
}

test("onboarding tokens require exactly 128 bits of lowercase hex", () => {
  assert.equal(isValidOnboardingToken(validToken), true);
  assert.equal(isValidOnboardingToken(validToken.toUpperCase()), false);
  assert.equal(isValidOnboardingToken("short"), false);
  assert.equal(isValidOnboardingToken(`${validToken}00`), false);
});

test("pending links reject submitted, revoked, expired, and invalid expiry records", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");
  assert.equal(
    isPendingOnboardingLinkActive(
      { submitted_at: null, revoked_at: null, expires_at: "2026-07-26T12:00:00.000Z" },
      now
    ),
    true
  );
  assert.equal(
    isPendingOnboardingLinkActive(
      { submitted_at: "2026-07-25T11:00:00.000Z", revoked_at: null, expires_at: "2026-07-26T12:00:00.000Z" },
      now
    ),
    false
  );
  assert.equal(
    isPendingOnboardingLinkActive(
      { submitted_at: null, revoked_at: "2026-07-25T11:00:00.000Z", expires_at: "2026-07-26T12:00:00.000Z" },
      now
    ),
    false
  );
  assert.equal(
    isPendingOnboardingLinkActive(
      { submitted_at: null, revoked_at: null, expires_at: "2026-07-25T12:00:00.000Z" },
      now
    ),
    false
  );
  assert.equal(
    isPendingOnboardingLinkActive(
      { submitted_at: null, revoked_at: null, expires_at: "not-a-date" },
      now
    ),
    false
  );
});

test("submission schema accepts bounded valid data and rejects unknown fields", () => {
  assert.equal(onboardingSubmissionSchema.safeParse(validSubmission()).success, true);
  assert.equal(
    onboardingSubmissionSchema.safeParse(validSubmission({ injected_admin: true })).success,
    false
  );
});

test("submission schema rejects invalid email, URL, and oversized notes", () => {
  assert.equal(
    onboardingSubmissionSchema.safeParse(validSubmission({ primary_contact_email: "not-email" })).success,
    false
  );
  assert.equal(
    onboardingSubmissionSchema.safeParse(validSubmission({ existing_website: "javascript:alert(1)" })).success,
    false
  );
  assert.equal(
    onboardingSubmissionSchema.safeParse(validSubmission({ additional_notes: "x".repeat(5001) })).success,
    false
  );
});

test("asset paths must stay inside the matching onboarding record", () => {
  const validPath = `${recordId}/photos/550e8400-e29b-41d4-a716-446655440002.webp`;
  assert.equal(isAssetPathForOnboarding(validPath, recordId), true);
  assert.equal(
    isAssetPathForOnboarding(
      `650e8400-e29b-41d4-a716-446655440000/photos/550e8400-e29b-41d4-a716-446655440002.webp`,
      recordId
    ),
    false
  );
  assert.equal(isAssetPathForOnboarding(`${recordId}/../secret.png`, recordId), false);
  assert.equal(isAssetPathForOnboarding(`${recordId}/documents/file.pdf`, recordId), false);
});

test("legacy public asset URLs normalize to private storage paths", () => {
  const path = `${validToken}/photos/old-file.jpg`;
  const url = `https://project.supabase.co/storage/v1/object/public/onboarding-assets/${path}`;
  assert.equal(normalizeOnboardingAssetPath(url), path);
  assert.equal(normalizeOnboardingAssetPath("https://example.com/not-storage/file.jpg"), null);
  assert.equal(normalizeOnboardingAssetPath("../secret"), null);
});

test("image validation enforces type and 5 MB size limit", () => {
  assert.deepEqual(validateOnboardingImage({ size: 1024, type: "image/png" }), { extension: "png" });
  assert.deepEqual(validateOnboardingImage({ size: 1024, type: "image/svg+xml" }), {
    error: "Only JPG, PNG, and WebP images are allowed",
  });
  assert.deepEqual(validateOnboardingImage({ size: 5 * 1024 * 1024 + 1, type: "image/jpeg" }), {
    error: "Images must be no larger than 5 MB",
  });
});

test("image signatures must match the declared MIME type", () => {
  assert.equal(
    hasValidImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"),
    true
  );
  assert.equal(
    hasValidImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    true
  );
  assert.equal(
    hasValidImageSignature(Uint8Array.from(Buffer.from("RIFF1234WEBP")), "image/webp"),
    true
  );
  assert.equal(
    hasValidImageSignature(Uint8Array.from(Buffer.from("<script>alert(1)</script>")), "image/png"),
    false
  );
});
