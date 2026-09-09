import {
  growthSchemas, isRecord, validTimestamp, validateContract, validateShape,
  type Channel, type Classification, type EvidenceBlock, type Geography,
  type Observation, type ProspectIdentity, type Schema, type SerpResult,
} from "./growth-contracts.ts";

export interface SerpContext {
  identity: ProspectIdentity;
  service: string;
  query: string;
  geography: Geography;
}
const text: Schema = { type: "string", minLength: 1, maxLength: 300 };
const id: Schema = { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$" };
const contextSchema: Schema = {
  type: "object", additionalProperties: false,
  required: ["identity", "service", "query", "geography"],
  properties: {
    identity: growthSchemas["observation.schema.json"].properties!.identity,
    service: text, query: text,
    geography: growthSchemas["observation.schema.json"].properties!.geography,
  },
};
const same = (a: unknown, b: unknown): boolean => {
  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a).sort();
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, i) => same(value, b[i]));
  return a === b;
};
const host = (url: string) => new URL(url).hostname.toLowerCase().replace(/^www\./, "");
const unique = (values: string[]) => [...new Set(values)].sort();
const location = (geo: Geography) => `${geo.city}, ${geo.region}, ${geo.country}`;
const isProspect = (row: SerpResult, channel: Channel, identity: ProspectIdentity) =>
  channel === "maps" ? row.url === identity.maps_url : host(row.url) === host(identity.website_url);

export interface EvidenceEvaluation { evidence: EvidenceBlock | null; reasons: string[] }

/** Reads only supplied cached data. Caller supplies time and independently trusted context. */
export function buildSerpEvidence(contextInput: unknown, evidenceId: unknown, input: unknown, now: string): EvidenceEvaluation {
  if (!validTimestamp(now)) throw new Error("INVALID_EVALUATION_TIME");
  const shapeErrors = [...validateShape(contextSchema, contextInput), ...validateShape(id, evidenceId)];
  if (!Array.isArray(input) || input.length !== 2) shapeErrors.push("OBSERVATION_PAIR_REQUIRED");
  else input.forEach((item, index) => shapeErrors.push(...validateContract("observation", item).map((error) => `observation[${index}]${error}`)));
  if (shapeErrors.length) return { evidence: null, reasons: ["INVALID_CONTRACT", ...shapeErrors] };
  const context = contextInput as SerpContext;
  // Clone rather than mutate cached source status (including verified-but-expired sources).
  const observations = structuredClone(input as Observation[]).sort((a, b) => a.channel.localeCompare(b.channel));
  const reasons: string[] = [];
  const queryMismatch = context.query !== `${context.service} ${context.geography.city}`
    || observations.some((item) => item.query !== context.query || !same(item.geography, context.geography));
  if (queryMismatch) reasons.push("QUERY_MISMATCH");
  if (new Set(observations.map((item) => item.channel)).size !== 2) reasons.push("OBSERVATION_PAIR_REQUIRED");
  if (new Set(observations.map((item) => item.observation_id)).size !== 2) reasons.push("DUPLICATE_OBSERVATION_ID");
  if (observations[0].device !== observations[1].device || observations[0].language !== observations[1].language) reasons.push("SEARCH_CONTEXT_MISMATCH");
  for (const observation of observations) {
    if (!same(observation.identity, context.identity) || observation.tenant_id !== context.identity.tenant_id || observation.subject_id !== context.identity.subject_id) reasons.push("IDENTITY_MISMATCH");
    const observed = Date.parse(observation.observed_at);
    const expiry = Date.parse(observation.expires_at);
    if (observed > Date.parse(now) || expiry <= observed) reasons.push("INVALID_SOURCE_TIME");
    if (expiry <= Date.parse(now)) reasons.push("EVIDENCE_EXPIRED");
    if (observation.source_status !== "verified") reasons.push(`SOURCE_${observation.source_status.toUpperCase()}`);
    if (observation.source_status === "verified" && !observation.value) reasons.push("VERIFIED_VALUE_REQUIRED");
    // Unavailable means unknown, never an empty captured result set. Stale may retain old data.
    if (["unavailable", "blocked", "not_due"].includes(observation.source_status) && observation.value !== null) reasons.push("NONVERIFIED_VALUE_PRESENT");
    if (!observation.value) continue;
    const { results, depth } = observation.value;
    if (results.length !== depth || results.some((row, index) => row.position !== index + 1)) reasons.push("INCOMPLETE_RANKING_EVIDENCE");
    if (new Set(results.map((row) => row.url)).size !== results.length) reasons.push("DUPLICATE_RANKING_URL");
    const matches = results.filter((row) => isProspect(row, observation.channel, context.identity));
    if (observation.channel === "maps" && matches.length > 1) reasons.push("AMBIGUOUS_PROSPECT");
    for (const row of results) {
      const match = isProspect(row, observation.channel, context.identity);
      if ((match && (row.name !== context.identity.business_name || row.kind !== "business"))
        || (!match && row.name === context.identity.business_name)) reasons.push("RANKING_IDENTITY_MISMATCH");
      if (observation.channel === "maps" && row.kind !== "business") reasons.push("INVALID_MAPS_RESULT");
    }
  }
  let classification: Classification | null = queryMismatch ? "QUERY_MISMATCH" : null;
  let mapsPosition: number | null = null;
  let organicPosition: number | null = null;
  let competitors: EvidenceBlock["competitors"] = [];
  if (reasons.length === 0) {
    const maps = observations.find((item) => item.channel === "maps")!;
    const organic = observations.find((item) => item.channel === "organic")!;
    mapsPosition = maps.value!.results.find((row) => isProspect(row, "maps", context.identity))?.position ?? null;
    organicPosition = organic.value!.results.find((row) => isProspect(row, "organic", context.identity))?.position ?? null;
    competitors = observations.flatMap((item) => item.value!.results
      .filter((row) => !isProspect(row, item.channel, context.identity) && row.position < ((item.channel === "maps" ? mapsPosition : organicPosition) ?? Infinity))
      .map((row) => ({ ...row, channel: item.channel })));
    if (mapsPosition !== null && mapsPosition <= 3) classification = "TOP_3_WINNER";
    else if (mapsPosition !== null && mapsPosition <= 10) classification = "MAPS_NEAR_WIN";
    else if (organicPosition === null && organic.value!.results.some((row) => row.kind === "directory")) classification = "DIRECTORY_DEPENDENT";
    else if (mapsPosition === null || organicPosition === null) classification = "RANKING_GAP";
    else reasons.push("NO_SUPPORTED_GAP");
    if (classification === "TOP_3_WINNER") reasons.push("TOP_3_WINNER_HOLD");
  }
  const evidence: EvidenceBlock = {
    schema_version: "1.0.0", evidence_id: evidenceId as string,
    identity: structuredClone(context.identity), query: context.query, geography: structuredClone(context.geography),
    evaluated_at: now, expires_at: observations.map((item) => item.expires_at).sort()[0],
    classification, eligible: reasons.length === 0, reasons: unique(reasons), observations,
    maps_position: mapsPosition, organic_position: organicPosition, competitors,
    calculation_method: "bounded-serp-v1; no impact estimate", allowed_wording: "",
    prohibited_inference: ["No traffic, revenue, missed-call or customer estimates.", "Bounded cached results are not universal absence or current live rankings.", "No guaranteed outcomes or AI-answer visibility claims."],
  };
  if (evidence.eligible) evidence.allowed_wording = evidenceSentence(evidence);
  return { evidence, reasons: evidence.reasons };
}

function evidenceSentence(evidence: EvidenceBlock): string {
  const { identity, classification, query, geography } = evidence;
  const channel: Channel = classification === "DIRECTORY_DEPENDENT" ? "organic"
    : classification === "MAPS_NEAR_WIN" || evidence.maps_position === null ? "maps" : "organic";
  const observation = evidence.observations.find((item) => item.channel === channel)!;
  const position = channel === "maps" ? evidence.maps_position : evidence.organic_position;
  const prefix = `For "${query}" in ${location(geography)}, the cached ${channel === "maps" ? "Maps" : "organic"} results`;
  const competitor = evidence.competitors.find((item) => item.channel === channel && (classification !== "DIRECTORY_DEPENDENT" || item.kind === "directory"));
  const target = position === null
    ? `did not include ${identity.business_name} within positions 1-${observation.value!.depth}`
    : `showed ${identity.business_name} at position ${position}`;
  return `${prefix} ${target}${competitor ? `; ${competitor.name} appeared at position ${competitor.position} (${competitor.url})` : ""}.`;
}

// A deliberately closed grammar, not a heuristic promise to understand arbitrary prose.
export const APPROVED_OFFER = "I can offer a free audit.";
export const APPROVED_CTA = "Would you like me to send it over?";
export const DRAFT_SUBJECT = "Local search baseline";
export const approvedDraftBody = (evidence: EvidenceBlock) => `${evidence.allowed_wording} ${APPROVED_OFFER} ${APPROVED_CTA}`;
export interface SuppliedDraft {
  evidence_id: string;
  tenant_id: string;
  subject_id: string;
  subject: string;
  body: string;
  offer: string;
  cta: string;
}
export interface DraftAttempt { attempt: number; draft: unknown; violations: string[] }
export interface DraftEvaluation {
  status: "ready" | "retry" | "hold";
  attempts: DraftAttempt[];
  attempts_remaining: number;
  reasons: string[];
}
const draftSchema: Schema = {
  type: "object", additionalProperties: false,
  required: ["evidence_id", "tenant_id", "subject_id", "subject", "body", "offer", "cta"],
  properties: { evidence_id: id, tenant_id: id, subject_id: id, subject: text,
    body: { type: "string", minLength: 1, maxLength: 10000 }, offer: text, cta: text },
};

function draftViolations(evidence: EvidenceBlock, input: unknown): string[] {
  const errors = validateShape(draftSchema, input);
  if (errors.length) return ["INVALID_DRAFT_CONTRACT", ...errors];
  const draft = input as SuppliedDraft;
  const reasons: string[] = [];
  if (draft.evidence_id !== evidence.evidence_id || draft.tenant_id !== evidence.identity.tenant_id || draft.subject_id !== evidence.identity.subject_id) reasons.push("DRAFT_IDENTITY_MISMATCH");
  if (draft.subject !== DRAFT_SUBJECT) reasons.push("SUBJECT_NOT_APPROVED");
  if (draft.offer !== APPROVED_OFFER || !draft.body.endsWith(`${APPROVED_OFFER} ${APPROVED_CTA}`)) reasons.push("OFFER_NOT_APPROVED");
  if (draft.cta !== APPROVED_CTA || !draft.body.endsWith(APPROVED_CTA)) reasons.push("CTA_NOT_APPROVED");
  if (draft.body.trim().split(/\s+/u).length >= 80) reasons.push("DRAFT_TOO_LONG");
  const copy = `${draft.subject} ${draft.body}`;
  if (copy.includes("—")) reasons.push("EM_DASH");
  if (/\b(guarantee\w*|promise\w*|risk[- ]free|double|triple|chatgpt|invisible|missed calls|lost (?:revenue|customers)|will (?:rank|increase|boost|deliver))\b|\d\s*%/iu.test(copy)) reasons.push("PROHIBITED_CLAIM");
  // Only the exact evidence sentence may contain numbers. No impact model is supported.
  const remainder = copy.replace(evidence.allowed_wording, "");
  if (/\p{N}|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|percent)\b/iu.test(remainder)) reasons.push("UNSUPPORTED_NUMBER");
  if (draft.body !== approvedDraftBody(evidence)) reasons.push("EVIDENCE_WORDING_MISMATCH");
  return unique(reasons);
}

/** Re-derives the block before checking drafts; never trusts claimed positions or allowed wording. */
export function validateSerpDrafts(context: SerpContext, input: unknown, drafts: unknown, now: string): DraftEvaluation {
  if (validateContract("evidence-block", input).length) return { status: "hold", attempts: [], attempts_remaining: 0, reasons: ["INVALID_EVIDENCE_CONTRACT"] };
  const evidence = input as EvidenceBlock;
  const rebuilt = buildSerpEvidence(context, evidence.evidence_id, evidence.observations, now);
  const evidenceReasons = [...rebuilt.reasons];
  if (!rebuilt.evidence || !same({ ...evidence, evaluated_at: now }, rebuilt.evidence)) evidenceReasons.push("EVIDENCE_MISMATCH");
  const attempts: DraftAttempt[] = [];
  if (!Array.isArray(drafts)) return { status: "hold", attempts, attempts_remaining: 0, reasons: ["INVALID_ATTEMPT_HISTORY"] };
  for (const [index, draft] of drafts.slice(0, 3).entries()) {
    attempts.push({ attempt: index + 1, draft: structuredClone(draft), violations: unique([...evidenceReasons, ...draftViolations(evidence, draft)]) });
  }
  const reasons: string[] = [...evidenceReasons];
  if (drafts.length > 3) reasons.push("ATTEMPT_LIMIT_EXCEEDED");
  if (attempts.slice(0, -1).some((attempt) => attempt.violations.length === 0)) reasons.push("ATTEMPTS_AFTER_SUCCESS");
  const last = attempts.at(-1);
  if (reasons.length) return { status: "hold", attempts, attempts_remaining: 0, reasons: unique(reasons) };
  if (last && last.violations.length === 0) return { status: "ready", attempts, attempts_remaining: 0, reasons: [] };
  if (attempts.length === 3) return { status: "hold", attempts, attempts_remaining: 0, reasons: unique(["THIRD_FAILURE_HOLD", ...last!.violations]) };
  return { status: "retry", attempts, attempts_remaining: 3 - attempts.length, reasons: last?.violations ?? ["DRAFT_MISSING"] };
}

export interface ReviewRecord {
  input_index: number;
  evidence: EvidenceBlock | null;
  draft_validation: DraftEvaluation;
  reasons: string[];
  input: unknown;
}
export function buildCachedSerpBatch(input: unknown, now: string) {
  if (!validTimestamp(now)) throw new Error("INVALID_EVALUATION_TIME");
  if (!isRecord(input) || input.schema_version !== "1.0.0" || validateShape(id, input.batch_id).length
    || validateShape(id, input.tenant_id).length || !Array.isArray(input.records) || input.records.length > 1000
    || Object.keys(input).some((key) => !["schema_version", "batch_id", "tenant_id", "records"].includes(key))) throw new Error("INVALID_BATCH_CONTRACT");
  // Retain every input row; ambiguous duplicate identities/IDs are all held, never silently merged.
  const identityKeys = input.records.map((row) => isRecord(row) && isRecord(row.context) && isRecord(row.context.identity) ? JSON.stringify([row.context.identity.tenant_id, row.context.identity.subject_id]) : null);
  const evidenceKeys = input.records.map((row) => isRecord(row) && typeof row.evidence_id === "string" ? row.evidence_id : null);
  const duplicated = (keys: (string | null)[]) => new Set(keys.filter((key, index) => key !== null && keys.indexOf(key) !== index));
  const duplicateIdentities = duplicated(identityKeys);
  const duplicateEvidence = duplicated(evidenceKeys);
  const all: ReviewRecord[] = input.records.map((raw, index) => {
    const row = isRecord(raw) ? raw : {};
    const evaluation = buildSerpEvidence(row.context, row.evidence_id, row.observations, now);
    const reasons = [...evaluation.reasons];
    if (Object.keys(row).some((key) => !["context", "evidence_id", "observations", "drafts"].includes(key))) reasons.push("UNKNOWN_RECORD_FIELD");
    if (evaluation.evidence && evaluation.evidence.identity.tenant_id !== input.tenant_id) reasons.push("BATCH_TENANT_MISMATCH");
    if (duplicateIdentities.has(identityKeys[index]) || duplicateEvidence.has(evidenceKeys[index])) reasons.push("DUPLICATE_IDENTITY_OR_EVIDENCE");
    const validation: DraftEvaluation = evaluation.evidence
      ? validateSerpDrafts(row.context as SerpContext, evaluation.evidence, row.drafts, now)
      : { status: "hold", attempts: [], attempts_remaining: 0, reasons: ["INVALID_EVIDENCE"] };
    reasons.push(...validation.reasons);
    if (reasons.length && validation.status === "ready") validation.status = "hold";
    return { input_index: index, evidence: evaluation.evidence, draft_validation: validation, reasons: unique(reasons), input: structuredClone(raw) };
  });
  const ready = all.filter((row) => row.reasons.length === 0 && row.draft_validation.status === "ready");
  const hold = all.filter((row) => !ready.includes(row));
  const counts = { input: all.length, ready: ready.length, hold: hold.length, duplicate_rows: all.filter((row) => row.reasons.includes("DUPLICATE_IDENTITY_OR_EVIDENCE")).length };
  if (counts.input !== counts.ready + counts.hold || new Set([...ready, ...hold].map((row) => row.input_index)).size !== counts.input) throw new Error("COUNT_RECONCILIATION_FAILED");
  return { schema_version: "1.0.0", batch_id: input.batch_id, tenant_id: input.tenant_id, evaluated_at: now,
    safety: { review_only: true, send_allowed: false, import_allowed: false, provider_calls: 0 }, counts, ready, hold };
}
