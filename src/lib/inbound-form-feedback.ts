export type InboundFormFailure = { kind: "validation" | "service"; message: string };

const fieldLabels: Record<string, string> = {
  name: "name", business: "business name", business_name: "business name",
  phone: "phone number", email: "email address", website: "website URL",
  businessType: "business type", serviceArea: "service area", googleProfile: "Google profile URL",
};

export function inboundFormFailure(status: number, body: unknown): InboundFormFailure {
  const fields = body && typeof body === "object" && "fields" in body ? body.fields : null;
  const labels = Array.isArray(fields)
    ? [...new Set(fields.filter((field): field is string => typeof field === "string").map((field) => fieldLabels[field]).filter(Boolean))]
    : [];
  if (status === 400 && labels.length) {
    return { kind: "validation", message: `Please check your ${labels.join(", ")} and submit again.` };
  }
  if (status === 403) {
    return { kind: "service", message: "The security check could not be verified. Complete the refreshed check and try again, or call us." };
  }
  if (status === 429) {
    return { kind: "service", message: "There have been too many attempts. Please wait an hour before retrying, or call us now." };
  }
  return { kind: "service", message: "We couldn't confirm your request because of a connection or service problem. Your details are still here. Please try again, or call us." };
}
