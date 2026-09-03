import type { ProspectWithAnalysis, WebsiteAnalysis } from "@/types";

export function generateLeadPitch(
  prospect: ProspectWithAnalysis,
  analysis?: WebsiteAnalysis
): string {
  const name = prospect.business_name;
  const city = prospect.city || "your area";
  const type = prospect.business_type || "business";

  let hook: string;
  if (!prospect.website_url) {
    hook = `I noticed ${name} doesn't have a website yet`;
  } else if (analysis?.overall_grade === "F" || analysis?.overall_grade === "D") {
    hook = `I noticed ${name}'s website could use some work`;
  } else {
    hook = `I came across ${name} while looking for ${type} businesses in ${city}`;
  }

  const reviewNote = (prospect.review_count ?? 0) < 10
    ? ` and only has ${prospect.review_count ?? 0} Google reviews`
    : "";

  return `Hey ${name}! ${hook}${reviewNote}. I help local ${type} businesses in ${city} present themselves clearly online and follow up with new leads consistently. Would you be open to a quick 5-minute chat? - Diego`;
}

export function buildGoogleCalendarDraft({
  businessName,
  startsAt,
  durationMinutes,
  phone,
  email,
  address,
}: {
  businessName: string;
  startsAt: string;
  durationMinutes: number;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error("A valid call date and time is required.");
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const toGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = [
    `Booked Out fit call with ${businessName}.`,
    phone ? `Phone: ${phone}` : null,
    email ? `Email: ${email}` : null,
    address ? `Business address: ${address}` : null,
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Booked Out Fit Call: ${businessName}`,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function toLocalDateTimeInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
