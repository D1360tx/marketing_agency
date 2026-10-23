/*
 * Browser-side conversion events for the Meta Pixel and Google tag.
 * Every call is a no-op when the tags are not configured or are blocked.
 * The Lead event shares its eventId with the server-side Conversions API
 * event so Meta counts one lead, not two.
 */

type TagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: TagFunction;
    gtag?: TagFunction;
    dataLayer?: unknown[];
  }
}

/** Formats a US phone number as E.164 for Google enhanced conversions. */
export function toE164(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return undefined;
}

function safely(run: () => void) {
  try {
    run();
  } catch {
    // Tracking must never break the page.
  }
}

export function trackLeadConversion({
  eventId,
  email,
  phone,
}: {
  eventId: string;
  email?: string;
  phone?: string;
}) {
  if (typeof window === "undefined") return;

  safely(() => window.fbq?.("track", "Lead", { content_name: "Free audit" }, { eventID: eventId }));

  safely(() => {
    if (!window.gtag) return;
    const userData: Record<string, string> = {};
    if (email) userData.email = email.trim().toLowerCase();
    const e164 = toE164(phone);
    if (e164) userData.phone_number = e164;
    if (Object.keys(userData).length) window.gtag("set", "user_data", userData);

    window.gtag("event", "generate_lead", { event_id: eventId, form_name: "free_audit" });

    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL?.trim();
    if (adsId && label) {
      window.gtag("event", "conversion", { send_to: `${adsId}/${label}`, transaction_id: eventId });
    }
  });
}

export function trackContactClick(method: "phone" | "booking") {
  if (typeof window === "undefined") return;
  safely(() => window.fbq?.("track", "Contact", { content_name: method === "phone" ? "Phone call" : "Book a call" }));
  safely(() => window.gtag?.("event", method === "phone" ? "phone_click" : "book_call_click"));
}
