# Booked Out (AgencyFlow) Project Brief

**Status:** Active, revenue-readiness launch in progress
**Repo:** github.com/D1360tx/marketing_agency
**Production:** https://trybookedout.com

## Product

Booked Out is a managed growth system for local service businesses. AgencyFlow is the internal CRM, audit, outreach, website-generation, onboarding, and reporting application used to deliver it.

## Approved Offer

### Local Call System: $499/month

- Managed mobile-first website and hosting
- Neutral review requests by email and consented SMS
- Missed-call and form-lead follow-up
- Google Business Profile foundation work
- Monthly edits and evidence-based reporting
- Month-to-month

**Founding terms:** First three accepted clients pay $499/month with no setup fee. Website content and core page files may be exported after three paid months.

### Growth Partner: $997/month

Expanded GBP, content, citations, conversion optimization, and strategy. Do not actively sell until its recurring fulfillment capacity and statement of work are approved.

## Claims and Sales Rules

- Do not guarantee calls, leads, reviews, rankings, jobs, sales, or revenue.
- Do not promise a fixed launch timeline before onboarding and access review.
- Do not claim exclusivity unless a written territory addendum exists.
- Do not use review gating or sentiment filtering.
- Do not send automated SMS without a recorded affirmative consent event.
- Lead with a sourced audit and observable baseline.

## Initial Market

- HVAC first
- One Texas metro cluster at a time
- Owner-operated, established, non-franchise companies
- Existing GBP, weak conversion, inconsistent review velocity, and enough job volume to benefit from follow-up

## Technology

- Next.js 16, React 19, Tailwind CSS 4
- Supabase PostgreSQL, Auth, RLS, private Storage
- Resend for application email
- Twilio or GHL-compatible messaging workflows after consent and registration are verified
- Vercel hosting
- Brave Search and PageSpeed-based sourced audits

## Revenue Funnel

Traffic or outreach → audit request → CRM prospect → sourced audit → nurture → booked conversation → agreement → recurring payment → secure onboarding → fulfillment → monthly evidence report.

Booking and payment URLs are configured through environment variables so credentials and provider-specific links are not hardcoded.

## Launch Gates

- [ ] Production migrations 023-026 applied in order
- [ ] Draft security/privacy PRs merged and deployed from `main`
- [ ] Required Vercel environment variables verified
- [ ] Production dependency audit shows no known vulnerabilities
- [ ] Public form rate limit and optional Turnstile verified
- [ ] Stripe $499 recurring Payment Link verified
- [ ] Booking link verified
- [ ] Service agreement reviewed and loaded into an e-sign tool
- [ ] Phone/SMS provider, A2P registration, STOP handling, and consent flow verified
- [ ] ABC Plumbing test client passes the complete fulfillment dry run
- [ ] First outreach batch reviewed manually before sending

## Historical Pipeline Data

Older documents recorded 1,772 prospects and 761 email addresses in March 2026. Treat those as historical counts until the production database is queried successfully. Do not present them as current inventory.
