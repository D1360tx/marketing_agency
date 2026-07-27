import { z } from "zod";

export const ONBOARDING_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
export const ONBOARDING_ASSET_BUCKET = "onboarding-assets";
export const ONBOARDING_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ONBOARDING_MAX_PHOTOS = 10;

export const ONBOARDING_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");

const optionalUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(2048)
      .url()
      .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
        message: "Only HTTP and HTTPS URLs are allowed",
      }),
  ])
  .optional()
  .default("");

const optionalEmail = z
  .union([z.literal(""), z.string().trim().max(254).email()])
  .optional()
  .default("");

const UUID_SEGMENT = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const LEGACY_OBJECT_SEGMENT = `${UUID_SEGMENT}\\.(?:jpg|png|webp)`;
const ONBOARDING_LOGO_PATH_PATTERN = new RegExp(
  `^${UUID_SEGMENT}/logo/(?:current|${LEGACY_OBJECT_SEGMENT})$`
);
const ONBOARDING_PHOTO_PATH_PATTERN = new RegExp(
  `^${UUID_SEGMENT}/photos/(?:[0-9]|${LEGACY_OBJECT_SEGMENT})$`
);

const optionalLogoPath = z
  .union([z.literal(""), z.string().trim().max(500).regex(ONBOARDING_LOGO_PATH_PATTERN)])
  .optional()
  .default("");

const photoPath = z.string().trim().max(500).regex(ONBOARDING_PHOTO_PATH_PATTERN);

export const onboardingSubmissionSchema = z
  .object({
    business_name: z.string().trim().min(1).max(120),
    owner_name: optionalText(120),
    phone: optionalText(40),
    address: optionalText(200),
    city: optionalText(100),
    state: optionalText(50),
    zip: optionalText(20),
    service_areas: optionalText(500),
    services_offered: z
      .array(z.string().trim().min(1).max(100))
      .max(20)
      .optional()
      .default([]),
    has_google_my_business: z.boolean().optional().default(false),
    google_my_business_url: optionalUrl,
    existing_website: optionalUrl,
    brand_colors: optionalText(500),
    style_notes: optionalText(5000),
    logo_url: optionalLogoPath,
    photo_urls: z
      .array(photoPath)
      .max(ONBOARDING_MAX_PHOTOS)
      .refine((paths) => new Set(paths).size === paths.length, { message: "Photo paths must be unique" })
      .optional()
      .default([]),
    primary_contact_name: optionalText(120),
    primary_contact_email: optionalEmail,
    primary_contact_phone: optionalText(40),
    preferred_contact_method: z
      .enum(["Phone Call", "Email", "Text"])
      .optional()
      .default("Phone Call"),
    review_process_notes: optionalText(5000),
    additional_notes: optionalText(5000),
  })
  .strict();

export type OnboardingSubmission = z.infer<typeof onboardingSubmissionSchema>;

export function isValidOnboardingToken(token: string): boolean {
  return ONBOARDING_TOKEN_PATTERN.test(token);
}

export function isPendingOnboardingLinkActive(
  record: { submitted_at: string | null; expires_at: string; revoked_at: string | null },
  now = new Date()
): boolean {
  if (record.submitted_at || record.revoked_at) return false;
  const expiresAt = new Date(record.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() > now.getTime();
}

export function normalizeOnboardingAssetPath(value: string): string | null {
  let path = value.trim();
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      const markers = [
        `/storage/v1/object/public/${ONBOARDING_ASSET_BUCKET}/`,
        `/storage/v1/object/sign/${ONBOARDING_ASSET_BUCKET}/`,
      ];
      const marker = markers.find((candidate) => url.pathname.includes(candidate));
      if (!marker) return null;
      path = decodeURIComponent(url.pathname.split(marker)[1] || "");
    } catch {
      return null;
    }
  }

  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }

  return path;
}

export function isAssetPathForOnboarding(value: string, onboardingId: string): boolean {
  const path = normalizeOnboardingAssetPath(value);
  if (!path) return false;

  const escapedId = onboardingId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const objectId = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  return new RegExp(
    `^${escapedId}/(?:logo/(?:current|${objectId}\\.(?:jpg|png|webp))|photos/(?:[0-9]|${objectId}\\.(?:jpg|png|webp)))$`
  ).test(path);
}

export function validateOnboardingImage(file: Pick<File, "size" | "type">): { extension: string } | { error: string } {
  if (file.size <= 0 || file.size > ONBOARDING_MAX_FILE_BYTES) {
    return { error: "Images must be no larger than 5 MB" };
  }

  const extension = ONBOARDING_IMAGE_TYPES[file.type];
  if (!extension) {
    return { error: "Only JPG, PNG, and WebP images are allowed" };
  }

  return { extension };
}

export function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }
  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}
