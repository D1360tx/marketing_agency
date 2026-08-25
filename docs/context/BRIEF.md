# Booked Out (AgencyFlow) Project Brief

**Status:** Active, founding-client launch in progress
**Repo:** github.com/D1360tx/marketing_agency
**Production:** https://trybookedout.com

## Product

Booked Out is a managed revenue-capture and growth partnership for established local service businesses. AgencyFlow is the internal CRM, audit, outreach, website-generation, onboarding, and reporting application used to deliver it.

## Approved Active Offer

### Local Call System: 90-Day Booking Foundation

- $499 per month for the first three qualified clients
- $0 setup
- Month-to-month billing
- Managed mobile-first website and hosting, up to seven core pages
- Google Business Profile foundation work
- Neutral review requests by email, up to 100 eligible requests per month
- One lead form/inbox with routing tests and supported email follow-up
- Up to 50 supported inbound leads per month
- Two consolidated implementation revision rounds
- Monthly maintenance, one prioritized conversion improvement, evidence report, and Growth Desk review

**Founding terms:** First three accepted clients pay $499 per month with no setup fee. Website content and core page files may be exported after three paid months.

### 30-Day Foundation Promise

After required access, accurate information, assets, and approvals are received, Booked Out completes the agreed core foundation within 30 days. If a Booked Out delay prevents delivery, the next service month is not charged until the agreed foundation is complete. Client, platform, policy, domain, third-party, and scope-change delays are excluded.

This is a delivery promise, not an outcome guarantee.

### Deferred Pricing

Do not publicly sell another tier until the first three clients produce real fulfillment data. Research supports testing $899 per month plus $1,250 implementation afterward, with a defensible mature range of $899 to $1,199 per location.

## Claims and Sales Rules

- Do not guarantee calls, leads, reviews, rankings, jobs, sales, or revenue.
- Do not promise a launch date until onboarding access and scope are confirmed.
- Do not claim territory exclusivity without a written addendum.
- Do not use review gating, sentiment filtering, fake reviews, or positive-review incentives.
- Keep automated SMS and missed-call text-back disabled until consent, A2P, STOP handling, and provider operations are verified.
- Lead with a sourced Revenue Leak Snapshot and observable baseline.
- Separate work completed, leading indicators, and attribution-supported or client-reported outcomes.

## Initial Market

- HVAC first
- Austin, Round Rock, Cedar Park, Leander, Georgetown, and Pflugerville
- Owner-operated, established, non-franchise companies
- Existing or verifiable Google Business Profile
- Weak conversion, inconsistent review velocity, or unreliable follow-up
- Enough job volume and operational capacity to benefit from improvement

## Technology

- Next.js 16, React 19, Tailwind CSS 4
- Supabase PostgreSQL, Auth, RLS, private Storage
- Resend for application email
- Twilio or GHL-compatible messaging only after consent and registration are verified
- Vercel hosting
- Brave Search and PageSpeed-based sourced audits

## Revenue Funnel

Qualified outreach → permission to send Revenue Leak Snapshot → audit review → proposal → agreement → recurring payment → secure onboarding → 30-day foundation → day-90 scorecard → conversion stewardship.

Booking, agreement, and payment destinations use server-side environment variables behind stable `/go/book`, `/go/agreement`, and `/go/start` routes.

## 30/90-Day Fulfillment

### Days 1–5

Agreement/payment, access checklist, kickoff, baseline screenshots and tests, customer-path mapping, written implementation brief, and fit checkpoint.

### Weeks 2–4

Build the core site and messaging, prepare neutral review and follow-up email copy, configure forms and routing, implement approved GBP foundation changes, complete consolidated revisions and QA, deploy, launch eligible review requests, and deliver the launch evidence report.

### Days 31–90

Observe real form and inbox behavior, correct routing and copy, continue approved review outreach, make one evidence-led conversion improvement monthly, repeat end-to-end testing, and deliver a day-90 scorecard and next-quarter plan.

## Launch Gates

- [x] Production migrations through 031 applied
- [x] Security and lean-workflow remediation deployed
- [x] Tracking and unsubscribe secrets configured
- [x] Production dependency audit previously verified clean
- [x] Public rate-limit RPC verified
- [ ] Turnstile partial-configuration fallback deployed, or matching site key configured
- [ ] $499 Stripe recurring Payment Link connected and verified
- [ ] Booking destination connected and verified
- [ ] Service agreement approved and loaded into an e-sign tool
- [ ] Controlled lead → audit → email → tracking → booking → agreement → payment → onboarding test passes
- [ ] First outreach batch reviewed manually before sending

SMS/A2P is not a blocker for the email-first founding launch and remains disabled.

## Historical Pipeline Data

Older documents recorded 1,772 prospects and 761 email addresses in March 2026. Treat those as historical counts until the production database is queried successfully. Do not present them as current inventory.
