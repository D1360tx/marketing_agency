import {
  calculateBookedOutScore,
  type BookedOutCohort,
  type BookedOutScoreBreakdown,
} from "./lead-scoring.ts";

export type MapsInputRow = Record<string, string | number | null | undefined>;

export interface NormalizedOutboundLead {
  business_name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website_url: string;
  rating: number | null;
  review_count: number;
  maps_url: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  source: string;
}

export interface OutboundLead extends NormalizedOutboundLead {
  score: number;
  score_breakdown: BookedOutScoreBreakdown;
  cohort: BookedOutCohort;
  qa_status: "ready" | "hold";
  qa_reasons: string[];
}

export interface OutboundEngineResult {
  input_count: number;
  deduped_count: number;
  duplicate_count: number;
  ready: OutboundLead[];
  hold: OutboundLead[];
  all: OutboundLead[];
}

const value = (row: MapsInputRow, ...keys: string[]): string => {
  for (const key of keys) {
    const candidate = row[key];
    if (candidate !== null && candidate !== undefined && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  return "";
};

const normalizeText = (input: string): string => input.replace(/\s+/g, " ").trim();

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return digits.length >= 7 ? `+${digits}` : "";
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase().replace(/^mailto:/, "").split("?")[0];
}

export function normalizeWebsite(input: string): string {
  if (!input.trim()) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

const parseNumber = (input: string): number | null => {
  if (!input.trim()) return null;
  const parsed = Number(input.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export function normalizeMapsRow(row: MapsInputRow): NormalizedOutboundLead {
  const rating = parseNumber(value(row, "rating", "Rating"));
  const reviews = parseNumber(
    value(row, "review_count", "reviews", "reviews_count", "Review Count")
  );
  return {
    business_name: normalizeText(value(row, "name", "business_name", "title", "Company Name")),
    category: normalizeText(value(row, "category", "business_type", "type", "trade")),
    address: normalizeText(value(row, "address", "full_address", "street")),
    city: normalizeText(value(row, "city", "City")),
    state: normalizeText(value(row, "state", "State")).toUpperCase(),
    phone: normalizePhone(value(row, "phone", "phone_number", "Phone")),
    email: normalizeEmail(value(row, "email", "Email")),
    website_url: normalizeWebsite(value(row, "website", "website_url", "site", "Website")),
    rating: rating !== null && rating >= 0 && rating <= 5 ? rating : null,
    review_count: reviews !== null && reviews > 0 ? Math.floor(reviews) : 0,
    maps_url: value(row, "maps_url", "google_maps_url", "place_url"),
    facebook: value(row, "facebook"),
    instagram: value(row, "instagram"),
    linkedin: value(row, "linkedin"),
    source: value(row, "source") || "gmaps-scraper",
  };
}

const fingerprints = (lead: NormalizedOutboundLead): string[] => {
  const name = lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const keys: string[] = [];
  if (lead.maps_url) keys.push(`maps:${lead.maps_url}`);
  if (lead.phone) keys.push(`phone:${lead.phone}`);
  if (lead.email) keys.push(`email:${lead.email}`);
  if (lead.website_url) keys.push(`site:${name}:${new URL(lead.website_url).hostname}`);
  if (name && lead.address) {
    keys.push(`place:${name}:${lead.address.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
  }
  return keys;
};

const mergeLead = (
  current: NormalizedOutboundLead,
  incoming: NormalizedOutboundLead
): NormalizedOutboundLead => {
  const chooseText = (left: string, right: string): string =>
    [left, right].filter(Boolean).sort((a, b) => a.localeCompare(b))[0] ?? "";
  const chooseBusinessName = (left: string, right: string): string =>
    [left, right]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length || a.localeCompare(b))[0] ?? "";
  const chooseRating = (left: number | null, right: number | null): number | null => {
    if (left === null) return right;
    if (right === null) return left;
    return Math.max(left, right);
  };

  return {
    business_name: chooseBusinessName(current.business_name, incoming.business_name),
    category: chooseText(current.category, incoming.category),
    address: chooseText(current.address, incoming.address),
    city: chooseText(current.city, incoming.city),
    state: chooseText(current.state, incoming.state),
    phone: chooseText(current.phone, incoming.phone),
    email: chooseText(current.email, incoming.email),
    website_url: chooseText(current.website_url, incoming.website_url),
    rating: chooseRating(current.rating, incoming.rating),
    review_count: Math.max(current.review_count, incoming.review_count),
    maps_url: chooseText(current.maps_url, incoming.maps_url),
    facebook: chooseText(current.facebook, incoming.facebook),
    instagram: chooseText(current.instagram, incoming.instagram),
    linkedin: chooseText(current.linkedin, incoming.linkedin),
    source: chooseText(current.source, incoming.source),
  };
};

export function dedupeOutboundLeads(
  leads: NormalizedOutboundLead[]
): NormalizedOutboundLead[] {
  let deduped: NormalizedOutboundLead[] = [];
  for (const lead of leads) {
    let merged = lead;
    let foundMatch = true;
    while (foundMatch) {
      foundMatch = false;
      const mergedKeys = new Set(fingerprints(merged));
      deduped = deduped.filter((existing) => {
        if (!fingerprints(existing).some((key) => mergedKeys.has(key))) return true;
        merged = mergeLead(existing, merged);
        foundMatch = true;
        return false;
      });
    }
    deduped.push(merged);
  }
  return deduped;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const UNSAFE_EMAIL_LOCAL_PARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "example",
  "test",
]);

export function runPreSendQa(lead: NormalizedOutboundLead, score: number): string[] {
  const reasons: string[] = [];
  if (!lead.business_name) reasons.push("missing_business_name");
  if (!lead.email) reasons.push("missing_email");
  else if (!EMAIL_RE.test(lead.email)) reasons.push("invalid_email");
  else if (UNSAFE_EMAIL_LOCAL_PARTS.has(lead.email.split("@")[0].split("+")[0])) {
    reasons.push("unsafe_email");
  }
  if (score < 45) reasons.push("score_below_45");
  if (!lead.phone && !lead.website_url && !lead.maps_url) {
    reasons.push("insufficient_identity");
  }
  return reasons;
}

export function buildOutboundCohort(rows: MapsInputRow[]): OutboundEngineResult {
  const normalized = rows.map(normalizeMapsRow);
  const deduped = dedupeOutboundLeads(normalized);
  const all = deduped
    .map((lead): OutboundLead => {
      const { score, breakdown, cohort } = calculateBookedOutScore(lead);
      const qaReasons = runPreSendQa(lead, score);
      return {
        ...lead,
        score,
        score_breakdown: breakdown,
        cohort,
        qa_status: qaReasons.length === 0 ? "ready" : "hold",
        qa_reasons: qaReasons,
      };
    })
    .sort((a, b) => b.score - a.score || a.business_name.localeCompare(b.business_name));

  return {
    input_count: rows.length,
    deduped_count: deduped.length,
    duplicate_count: rows.length - deduped.length,
    ready: all.filter((lead) => lead.qa_status === "ready"),
    hold: all.filter((lead) => lead.qa_status === "hold"),
    all,
  };
}

export function parseCsv(csv: string): MapsInputRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"' && quoted && csv[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((cell) => cell.length > 0)) records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  record.push(field);
  if (record.some((cell) => cell.length > 0)) records.push(record);
  const [headers = [], ...data] = records;
  return data.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index] ?? ""]))
  );
}

const escapeCsv = (input: unknown): string => {
  const raw = String(input ?? "");
  const text = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function outboundLeadsToCsv(leads: OutboundLead[]): string {
  const headers = [
    "email",
    "business_name",
    "phone",
    "website_url",
    "city",
    "state",
    "category",
    "cohort",
    "score",
    "revenue_leakage",
    "ability_to_pay",
    "contact_confidence",
    "qa_status",
    "qa_reasons",
    "maps_url",
    "source",
  ];
  const rows = leads.map((lead) => [
    lead.email,
    lead.business_name,
    lead.phone,
    lead.website_url,
    lead.city,
    lead.state,
    lead.category,
    lead.cohort,
    lead.score,
    lead.score_breakdown.revenue_leakage,
    lead.score_breakdown.ability_to_pay,
    lead.score_breakdown.contact_confidence,
    lead.qa_status,
    lead.qa_reasons.join("|"),
    lead.maps_url,
    lead.source,
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n";
}
