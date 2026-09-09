# Booked Out Simplified Outbound Engine

## Objective

Create a repeatable local-business prospecting loop that prioritizes businesses with observable revenue leakage and enough demand to buy. It adapts Troy Aitken's recurring outbound model without adding paid data vendors to the first release.

## Version 1 flow

1. **Harvest**
   - Run the Playwright Google Maps scraper by niche and city.
   - Use `--enrich` to visit the business website and collect public email and social links.
   - Start with two 100-business cohorts in one state before expanding.

2. **Normalize and dedupe**
   - Normalize email, phone, URL, business name, and location fields.
   - Dedupe across Maps URL, phone, email, website host plus business name, and business name plus address.

3. **Score**
   - Revenue leakage: 45 points.
   - Ability to pay: 35 points.
   - Contact confidence: 20 points.
   - Assign `emerging_operator` or `established_under_optimized`.

4. **Pre-send QA**
   - Hold missing, malformed, unsafe, or low-scoring contacts.
   - Export only approved rows to the ready file.
   - Keep rejected rows and reason codes in a separate hold file for repair.

5. **Human approval and outreach**
   - Review the ready CSV before any CRM import or send.
   - Preserve source, score components, cohort, and Maps URL for each record.
   - This release never sends outreach automatically.

6. **Refresh**
   - Re-run market batches every 90 days.
   - Dedupe against previously reviewed contacts before CRM import.
   - Track ready rate, cost per sendable lead, positive replies, audits accepted, meetings, and closed clients by cohort.

## Commands

```bash
cd tools/gmaps-scraper
python cli.py --batch sample_batch.csv --limit 100 --enrich

cd ../..
npm run outbound:build -- \
  --input tools/gmaps-scraper/output/_combined_<timestamp>.csv \
  --output artifacts/outbound/ready.csv
```

Outputs:

- `ready.csv`: valid, scored, sendable contacts for review.
- `ready.hold.csv`: rejected contacts plus deterministic QA reasons.

## Phase 2: compounding copy learning (local only)

Phase 2 adds a deterministic, review-only learning pass over manually exported campaign evidence. It does **not** query or mutate Supabase, ingest replies, send email, auto-publish copy, or automatically promote a candidate.

The six planned variants use three stable keys per cohort and controlled values for cohort/segment, framework, pain angle, offer, proof, CTA, subject style, and length. Pain angles are observational (`inquiry_followup_gap`, `mobile_web_presence_gap`, `review_request_process_gap`); copy must not claim measured leakage or missed-call volume unless source evidence supports it.

The offer taxonomy follows the checked-in source of truth:

- `$499/month` Local Call System, month to month.
- Free audit/baseline review.
- Managed mobile-first website and hosting, neutral review requests, missed-call/form follow-up, and GBP foundation.
- No guaranteed calls, reviews, rankings, jobs, or revenue.

Reply outcomes are `positive`, `objection`, `timing`, `unsubscribe`, `irrelevant`, or `unknown`. **Replies and all downstream outcomes are manual imports until inbound reply ingestion exists.** Open rate is intentionally excluded.

```bash
npm run outbound:learn -- \
  --input artifacts/outbound/evidence.json \
  --output artifacts/outbound/learning-decisions.json
```

CSV input is also accepted. Each row is one cumulative snapshot for a unique `campaign_id` + `variant_key` and contains: `delivered`, the six `reply_*` counts, `audits_accepted`, `meetings`, `clients`, and `complaints`. Duplicate campaign/variant snapshots are rejected to prevent double counting.

Decision safeguards:

- Promotion is only `recommend_promotion`, requiring at least 75 deliveries across at least two campaigns, four positive replies, two accepted audits, one meeting, a qualifying evidence score, and zero complaints. The library record remains `candidate_pending_human_review`.
- Retirement requires at least 150 deliveries across at least two campaigns and zero positive replies, accepted audits, meetings, or clients.
- Any complaint, an unsubscribe rate at or above 2% after 50 deliveries, excessive unknown reply classification, impossible counts, or unknown variant key routes to `manual_review`; broken tagging can never retire a variant.
- Library identity is stable by `segment::framework_key::pain_angle`; no open-rate optimization is performed.

`supabase/migrations/032_outbound_copy_learning.sql` is an additive, rerunnable schema design for catalog metadata, outcome attribution, campaign snapshots, library candidates, and owner-scoped RLS. It is not applied by this workflow.

## Pilot

- Vertical: HVAC.
- Geography: one state, one metro at a time.
- Cohort A: emerging operators, generally 5 to 49 reviews.
- Cohort B: established but under-optimized, generally 50 or more reviews plus visible website leakage.
- Target: 100 raw businesses per cohort.

## Later phases

Add these only after the file-based pilot proves conversion:

1. Domain and owner enrichment waterfall with cached provider results.
2. Apollo or another paid provider only when public website enrichment fails.
3. Email verification before campaign enrollment.
4. Supabase checkpoints for market, batch, and enrichment state.
5. CRM import with consent, suppression, and duplicate checks.
6. Scheduled 90-day refresh with cost ceilings and failure alerts.

Paid enrichment and automated sending remain intentionally out of scope for Version 1.

## Cached local-SERP evidence review

The first Signal Outbound evidence slice processes already-captured Maps and
organic result sets. It makes no network, provider, CRM, or outreach calls.

```bash
npm run outbound:serp -- \
  --input tests/fixtures/cached-serp.synthetic.json \
  --output artifacts/outbound/serp-review-001 \
  --now 2026-09-05T12:00:00.000Z
```

The command creates a new immutable review directory containing:

- `ready.json`: records whose evidence and supplied draft both pass.
- `hold.json`: every rejected record with deterministic reason codes.
- `evidence.jsonl`: re-derived evidence blocks for review.
- `manifest.json`: reconciled counts and hard safety flags.

The evaluator preserves `verified`, `unavailable`, `blocked`, `not_due`, and
`stale` source states. Missing or unavailable data never becomes a zero or a
ranking absence. Supported classifications are `MAPS_NEAR_WIN`,
`RANKING_GAP`, `DIRECTORY_DEPENDENT`, `TOP_3_WINNER`, and `QUERY_MISMATCH`.

Draft validation uses a closed, evidence-locked format. It blocks changed
competitors, cities, queries, positions, URLs, offers, CTAs, unsupported
numbers, guarantees, traffic or revenue claims, AI-visibility claims, em
dashes, and drafts of 80 words or more. Three failed attempts produce a hold.

This slice is review-only. The manifest always records `send_allowed: false`,
`import_allowed: false`, and `provider_calls: 0`. It does not generate copy,
import prospects into Instantly, activate campaigns, or send outreach.

Run its deterministic suite with:

```bash
npm run test:outbound-serp
```
