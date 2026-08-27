import { parseCsv } from "./outbound-engine.ts";

export const OUTBOUND_COHORTS = [
  "emerging_operator",
  "established_under_optimized",
] as const;
export const OUTBOUND_SEGMENTS = [
  "hvac_emerging_operator",
  "hvac_established_under_optimized",
] as const;
export const PAIN_ANGLES = [
  "inquiry_followup_gap",
  "mobile_web_presence_gap",
  "review_request_process_gap",
] as const;
export const OFFERS = ["local_call_system_499_monthly", "free_baseline_audit"] as const;
export const PROOF_STYLES = [
  "observable_baseline",
  "specific_gap_evidence",
  "month_to_month_delivery",
] as const;
export const CTA_STYLES = ["review_audit", "reply_for_baseline", "book_15_minute_review"] as const;
export const SUBJECT_STYLES = ["business_name_question", "local_gap", "plain_audit"] as const;
export const LENGTH_BANDS = ["short_60_90", "medium_91_140"] as const;
export const FRAMEWORKS = ["gap_audit_direct", "baseline_then_fix"] as const;
export const REPLY_OUTCOMES = [
  "positive",
  "objection",
  "timing",
  "unsubscribe",
  "irrelevant",
  "unknown",
] as const;

export type OutboundCohort = (typeof OUTBOUND_COHORTS)[number];
export type OutboundSegment = (typeof OUTBOUND_SEGMENTS)[number];
export type PainAngle = (typeof PAIN_ANGLES)[number];
export type Offer = (typeof OFFERS)[number];
export type ProofStyle = (typeof PROOF_STYLES)[number];
export type CtaStyle = (typeof CTA_STYLES)[number];
export type SubjectStyle = (typeof SUBJECT_STYLES)[number];
export type LengthBand = (typeof LENGTH_BANDS)[number];
export type FrameworkKey = (typeof FRAMEWORKS)[number];
export type ReplyOutcome = (typeof REPLY_OUTCOMES)[number];

export interface OutboundVariantMetadata {
  variant_key: string;
  cohort: OutboundCohort;
  segment: OutboundSegment;
  framework_key: FrameworkKey;
  pain_angle: PainAngle;
  offer: Offer;
  proof_style: ProofStyle;
  cta_style: CtaStyle;
  subject_style: SubjectStyle;
  length_band: LengthBand;
}

export const PLANNED_OUTBOUND_VARIANTS: readonly OutboundVariantMetadata[] = [
  {
    variant_key: "bo2-emerging-inquiry-followup-v1",
    cohort: "emerging_operator",
    segment: "hvac_emerging_operator",
    framework_key: "gap_audit_direct",
    pain_angle: "inquiry_followup_gap",
    offer: "free_baseline_audit",
    proof_style: "specific_gap_evidence",
    cta_style: "review_audit",
    subject_style: "business_name_question",
    length_band: "short_60_90",
  },
  {
    variant_key: "bo2-emerging-web-gap-v1",
    cohort: "emerging_operator",
    segment: "hvac_emerging_operator",
    framework_key: "baseline_then_fix",
    pain_angle: "mobile_web_presence_gap",
    offer: "local_call_system_499_monthly",
    proof_style: "observable_baseline",
    cta_style: "reply_for_baseline",
    subject_style: "local_gap",
    length_band: "medium_91_140",
  },
  {
    variant_key: "bo2-emerging-review-gap-v1",
    cohort: "emerging_operator",
    segment: "hvac_emerging_operator",
    framework_key: "gap_audit_direct",
    pain_angle: "review_request_process_gap",
    offer: "local_call_system_499_monthly",
    proof_style: "month_to_month_delivery",
    cta_style: "book_15_minute_review",
    subject_style: "plain_audit",
    length_band: "short_60_90",
  },
  {
    variant_key: "bo2-established-inquiry-followup-v1",
    cohort: "established_under_optimized",
    segment: "hvac_established_under_optimized",
    framework_key: "baseline_then_fix",
    pain_angle: "inquiry_followup_gap",
    offer: "local_call_system_499_monthly",
    proof_style: "observable_baseline",
    cta_style: "review_audit",
    subject_style: "business_name_question",
    length_band: "medium_91_140",
  },
  {
    variant_key: "bo2-established-web-gap-v1",
    cohort: "established_under_optimized",
    segment: "hvac_established_under_optimized",
    framework_key: "gap_audit_direct",
    pain_angle: "mobile_web_presence_gap",
    offer: "free_baseline_audit",
    proof_style: "specific_gap_evidence",
    cta_style: "book_15_minute_review",
    subject_style: "local_gap",
    length_band: "short_60_90",
  },
  {
    variant_key: "bo2-established-review-gap-v1",
    cohort: "established_under_optimized",
    segment: "hvac_established_under_optimized",
    framework_key: "baseline_then_fix",
    pain_angle: "review_request_process_gap",
    offer: "local_call_system_499_monthly",
    proof_style: "month_to_month_delivery",
    cta_style: "reply_for_baseline",
    subject_style: "plain_audit",
    length_band: "medium_91_140",
  },
] as const;

export interface OutboundEvidenceRow {
  campaign_id: string;
  variant_key: string;
  delivered: number;
  reply_positive: number;
  reply_objection: number;
  reply_timing: number;
  reply_unsubscribe: number;
  reply_irrelevant: number;
  reply_unknown: number;
  audits_accepted: number;
  meetings: number;
  clients: number;
  complaints: number;
}

export type LearningDecision = "recommend_promotion" | "keep_testing" | "retire" | "manual_review";

export interface AggregateEvidence extends Omit<OutboundEvidenceRow, "campaign_id"> {
  campaign_count: number;
  evidence_score: number;
}

export interface VariantDecision {
  variant_key: string;
  decision: LearningDecision;
  reasons: string[];
  evidence: AggregateEvidence;
  metadata: OutboundVariantMetadata | null;
}

export interface CopyLibraryEntry {
  library_key: string;
  segment: OutboundSegment;
  framework_key: FrameworkKey;
  pain_angle: PainAngle;
  winning_variant_key: string;
  evidence_score: number;
  campaign_count: number;
  delivered: number;
  status: "candidate_pending_human_review";
}

export interface LearningLoopResult {
  policy: {
    scale: "booked_out_pilot";
    minimum_campaigns: 2;
    minimum_delivered: 75;
    retirement_minimum_delivered: 150;
    unknown_reply_share_limit: 0.2;
    optimizes_open_rate: false;
  };
  variants: readonly OutboundVariantMetadata[];
  decisions: VariantDecision[];
  copy_library: CopyLibraryEntry[];
}

const METRIC_FIELDS = [
  "delivered",
  "reply_positive",
  "reply_objection",
  "reply_timing",
  "reply_unsubscribe",
  "reply_irrelevant",
  "reply_unknown",
  "audits_accepted",
  "meetings",
  "clients",
  "complaints",
] as const satisfies readonly (keyof OutboundEvidenceRow)[];

const toCount = (value: unknown, field: string): number => {
  const count = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(count) || count < 0) throw new Error(`${field} must be a non-negative integer`);
  return count;
};

export function parseEvidenceFixture(content: string, format: "json" | "csv"): OutboundEvidenceRow[] {
  const raw: unknown = format === "json" ? JSON.parse(content) : parseCsv(content);
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { observations?: unknown }).observations)
      ? (raw as { observations: unknown[] }).observations
      : null;
  if (!rows) throw new Error("Fixture must be an array or an object with an observations array");

  return rows.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Row ${index + 1} must be an object`);
    const row = item as Record<string, unknown>;
    const campaign_id = String(row.campaign_id ?? "").trim();
    const variant_key = String(row.variant_key ?? "").trim();
    if (!campaign_id || !variant_key) throw new Error(`Row ${index + 1} needs campaign_id and variant_key`);
    return {
      campaign_id,
      variant_key,
      delivered: toCount(row.delivered, "delivered"),
      reply_positive: toCount(row.reply_positive, "reply_positive"),
      reply_objection: toCount(row.reply_objection, "reply_objection"),
      reply_timing: toCount(row.reply_timing, "reply_timing"),
      reply_unsubscribe: toCount(row.reply_unsubscribe, "reply_unsubscribe"),
      reply_irrelevant: toCount(row.reply_irrelevant, "reply_irrelevant"),
      reply_unknown: toCount(row.reply_unknown, "reply_unknown"),
      audits_accepted: toCount(row.audits_accepted, "audits_accepted"),
      meetings: toCount(row.meetings, "meetings"),
      clients: toCount(row.clients, "clients"),
      complaints: toCount(row.complaints, "complaints"),
    };
  });
}

export function calculateEvidenceScore(evidence: Omit<AggregateEvidence, "evidence_score">): number {
  if (evidence.delivered === 0) return 0;
  const weighted =
    evidence.reply_positive * 4 +
    evidence.audits_accepted * 6 +
    evidence.meetings * 10 +
    evidence.clients * 25 -
    evidence.reply_unsubscribe * 6 -
    evidence.complaints * 20;
  return Math.round((weighted / evidence.delivered) * 1000) / 10;
}

const taggingProblems = (evidence: Omit<AggregateEvidence, "evidence_score">): string[] => {
  const categorizedReplies =
    evidence.reply_positive + evidence.reply_objection + evidence.reply_timing +
    evidence.reply_unsubscribe + evidence.reply_irrelevant + evidence.reply_unknown;
  const knownReplies = categorizedReplies - evidence.reply_unknown;
  const problems: string[] = [];
  if (categorizedReplies > evidence.delivered) problems.push("reply_counts_exceed_delivered");
  if (evidence.audits_accepted > evidence.delivered) problems.push("audits_exceed_delivered");
  if (evidence.meetings > evidence.audits_accepted) problems.push("meetings_exceed_audits");
  if (evidence.clients > evidence.meetings) problems.push("clients_exceed_meetings");
  if (evidence.complaints > evidence.delivered) problems.push("complaints_exceed_delivered");
  if (evidence.reply_unknown > 0 && evidence.reply_unknown / categorizedReplies > 0.2) {
    problems.push("unknown_reply_share_above_20_percent");
  }
  if (categorizedReplies >= 5 && knownReplies === 0) problems.push("all_replies_unclassified");
  if (evidence.delivered === 0 && (categorizedReplies + evidence.audits_accepted + evidence.meetings + evidence.clients > 0)) {
    problems.push("outcomes_without_delivery");
  }
  if (evidence.complaints > 0) problems.push("spam_complaint_requires_human_review");
  if (evidence.delivered >= 50 && evidence.reply_unsubscribe / evidence.delivered >= 0.02) {
    problems.push("unsubscribe_rate_at_or_above_2_percent");
  }
  return problems;
};

export function runOutboundLearningLoop(rows: OutboundEvidenceRow[]): LearningLoopResult {
  const variants = new Map(PLANNED_OUTBOUND_VARIANTS.map((variant) => [variant.variant_key, variant]));
  const byVariant = new Map<string, OutboundEvidenceRow[]>();
  const snapshots = new Set<string>();
  for (const row of rows) {
    const snapshotKey = `${row.campaign_id}::${row.variant_key}`;
    if (snapshots.has(snapshotKey)) {
      throw new Error(`Duplicate campaign/variant snapshot: ${snapshotKey}`);
    }
    snapshots.add(snapshotKey);
    byVariant.set(row.variant_key, [...(byVariant.get(row.variant_key) ?? []), row]);
  }

  const keys = [...new Set([...variants.keys(), ...byVariant.keys()])].sort();
  const decisions = keys.map((variant_key): VariantDecision => {
    const evidenceRows = byVariant.get(variant_key) ?? [];
    const metadata = variants.get(variant_key) ?? null;
    const totals = Object.fromEntries(METRIC_FIELDS.map((field) => [field, 0])) as unknown as Pick<OutboundEvidenceRow, (typeof METRIC_FIELDS)[number]>;
    for (const row of evidenceRows) for (const field of METRIC_FIELDS) totals[field] += row[field];
    const aggregateWithoutScore = {
      variant_key,
      campaign_count: new Set(evidenceRows.map((row) => row.campaign_id)).size,
      ...totals,
    };
    const evidence: AggregateEvidence = {
      ...aggregateWithoutScore,
      evidence_score: calculateEvidenceScore(aggregateWithoutScore),
    };
    const problems = taggingProblems(aggregateWithoutScore);

    if (!metadata) {
      return { variant_key, decision: "manual_review", reasons: ["unknown_variant_key"], evidence, metadata };
    }
    if (problems.length > 0) {
      return { variant_key, decision: "manual_review", reasons: problems, evidence, metadata };
    }
    const enoughEvidence = evidence.campaign_count >= 2 && evidence.delivered >= 75;
    if (!enoughEvidence) {
      return {
        variant_key,
        decision: "keep_testing",
        reasons: [
          evidence.campaign_count < 2 ? "needs_evidence_from_2_campaigns" : "needs_75_deliveries",
        ],
        evidence,
        metadata,
      };
    }
    if (
      evidence.evidence_score >= 12 &&
      evidence.reply_positive >= 4 &&
      evidence.audits_accepted >= 2 &&
      evidence.meetings >= 1 &&
      evidence.complaints === 0
    ) {
      return { variant_key, decision: "recommend_promotion", reasons: ["booked_out_threshold_met_human_review_required"], evidence, metadata };
    }
    if (
      evidence.delivered >= 150 &&
      evidence.reply_positive === 0 &&
      evidence.audits_accepted === 0 &&
      evidence.meetings === 0 &&
      evidence.clients === 0
    ) {
      return { variant_key, decision: "retire", reasons: ["sufficient_clean_negative_evidence"], evidence, metadata };
    }
    return { variant_key, decision: "keep_testing", reasons: ["mixed_or_inconclusive_evidence"], evidence, metadata };
  });

  const promoted = decisions.filter((decision) => decision.decision === "recommend_promotion" && decision.metadata);
  const libraryByKey = new Map<string, CopyLibraryEntry>();
  for (const decision of promoted) {
    const metadata = decision.metadata!;
    const library_key = `${metadata.segment}::${metadata.framework_key}::${metadata.pain_angle}`;
    const candidate: CopyLibraryEntry = {
      library_key,
      segment: metadata.segment,
      framework_key: metadata.framework_key,
      pain_angle: metadata.pain_angle,
      winning_variant_key: metadata.variant_key,
      evidence_score: decision.evidence.evidence_score,
      campaign_count: decision.evidence.campaign_count,
      delivered: decision.evidence.delivered,
      status: "candidate_pending_human_review",
    };
    const current = libraryByKey.get(library_key);
    if (!current || candidate.evidence_score > current.evidence_score ||
      (candidate.evidence_score === current.evidence_score && candidate.winning_variant_key < current.winning_variant_key)) {
      libraryByKey.set(library_key, candidate);
    }
  }

  return {
    policy: {
      scale: "booked_out_pilot",
      minimum_campaigns: 2,
      minimum_delivered: 75,
      retirement_minimum_delivered: 150,
      unknown_reply_share_limit: 0.2,
      optimizes_open_rate: false,
    },
    variants: PLANNED_OUTBOUND_VARIANTS,
    decisions,
    copy_library: [...libraryByKey.values()].sort((a, b) => a.library_key.localeCompare(b.library_key)),
  };
}
