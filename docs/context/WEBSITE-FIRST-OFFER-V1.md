# Website-First Offer V1

**Status: Proposed / review draft. Not the authoritative active offer.**

This proposal supports the isolated `/website-first` preview. It does not replace `OFFER-SOURCE-OF-TRUTH.md`, change the existing homepage or amend any current agreement. Exact fixed project pricing has not been approved. Do not publish, issue payment links or activate this offer until the owner approves the commercial terms and active surfaces are synchronized.

## Positioning and buyer

A professional, conversion-focused website is the first concrete purchase. Start with a useful, visible deliverable rather than a recurring all-in-one marketing commitment. Establish contact and tracking foundations, launch, then consider additional services based on observed needs.

Prioritize established, owner-operated local service businesses, initially Austin-area HVAC. The buyer can provide accurate information, authorized assets, domain access, consolidated feedback and a team that responds to inquiries. Disqualify guaranteed-lead expectations, unresolved service or licensing issues, fabricated proof requests, unlimited-scope expectations and custom-software needs.

## Default commercial model

**Fixed project quote, 50% deposit, 50% before launch.**

- Confirm scope, exact fixed project price, schedule, hosting costs and third-party costs in writing before work or payment.
- The approved quote and 50% deposit reserve and start the build, subject to the agreed access/content prerequisites.
- Client reviews the finished project and launch checklist. Remaining 50% is due before launch.
- Requesting a homepage concept does not book a meeting, authorize payment or start a subscription.
- No required marketing retainer. Hosting is necessary, but its provider, cost and responsibility must be explicit in the quote. Ongoing care is optional.
- No numeric price is proposed by this document. Do not reuse the old recurring price as a project price.
- Cancellation, refund, pause, late-payment, acceptance and change-order terms require approval in the new project agreement. Do not imply a nonrefundable deposit without approved terms.

## Recommended bounded starting scope

For one legal business/brand, one location and one domain:

1. Up to seven agreed core pages. Typical outline: Home, Services, two priority service pages, About, Service Area and Contact. Final page count and list are in the quote.
2. Mobile-first design and website copy organized from client-supplied, client-approved factual information.
3. Clear phone/contact links and one primary inquiry form to one designated inbox; delivery tests with client permission and a named response owner.
4. Analytics setup, agreed form-success and contact-click events, and a documented starting baseline. Respect consent/privacy requirements. Clicks are not completed calls or booked jobs.
5. Basic page titles, descriptions, semantic headings, crawlability checks for the eventual customer site and agreed domain configuration. This is not a full SEO campaign. The Booked Out offer preview remains noindex/nofollow.
6. Two consolidated implementation revision rounds.
7. Responsive and functional QA, approved launch, access inventory and launch walkthrough.
8. Written platform, code/file handover, license, hosting, third-party renewal and support responsibilities before deposit. Recommend client-controlled domain and analytics accounts. Final ownership/export terms need explicit approval; the old three-month export provision is not silently carried into this project model.

## Process and tangible plan

1. **Concept:** Confirm business and project fit by email. Accepted businesses receive a tailored homepage visual direction, a recommended page map and a fixed scope/price before any build deposit. No charge to request, no obligation to commission the full build. This is a design proposal, not a finished free website; not every requester is accepted.
2. **Build:** After agreement, deposit and necessary access, prepare design/copy, connect the contact/tracking foundations and complete agreed revisions. Confirm delivery schedule only when prerequisites are known.
3. **Launch:** Obtain documented client approval, finish permission-based routing and analytics checks, collect the final balance before launch, launch and hand over. Present optional next steps only after the website's value is visible.

No inherited 30-day delivery promise or recurring service credit applies to this proposed project model. Any new delivery commitment requires its own approved conditions and remedy.

## Boundaries

Not included by default: unlimited pages/revisions, custom applications, complex migrations, photography, logo redesign, ecommerce, multilingual content, multiple locations, CRM replacement, review campaigns, ongoing SEO/content, advertising or media spend, call answering, automated SMS, recurring maintenance or territory exclusivity. Additional work requires an explicit written scope and quote.

## Optional post-launch expansion

These are future conversations, not public recurring tiers or included work:

- **Website care:** maintenance, edits and prioritized improvements within an agreed allowance.
- **CRM, follow-up and reviews:** organize inquiries, clarify reply ownership, support email workflows and neutral requests to eligible customers. No review gating or positive-review incentives. Automated SMS stays disabled unless separately scoped and all consent, registration, opt-out and provider controls are verified.
- **SEO:** scoped local visibility/content work when business capacity and site readiness support it. No ranking guarantee.
- **Paid ads:** separately scoped campaigns after contact handling and measurement are ready. Media spend is separate and requires budget approval.

Choose the next service from observed needs, not a forced progression. The client can stop with the website.

## Claims and page rules

- One primary CTA: **Request My Homepage Concept**.
- No guaranteed leads, rankings, calls, bookings or revenue; no fake urgency, client counts, reviews or testimonials.
- Label every sample as illustrative. The preview's fictional home-service layout is a design example, not a delivered client site or performance proof.
- Report delivered inputs, observable indicators and attribution-supported/client-reported outcomes separately.
- Use no em dashes in body copy.
- Keep real Booked Out branding and legal identity: ICDC Ventures LLC, doing business as Booked Out.

## Intake and launch gates

The preview reuses `/api/leads/inbound`, the existing public schema and Turnstile component. Payload source is `website-first/v1`, with `smsConsent: false`. Two required fields: business and email; website is optional. The backend can create prospects, enroll the existing default email sequence, run an audit and notify the owner. Source tagging alone does not select a new sequence.

**Before any publication or real traffic:** approve and align the downstream email sequence, owner notifications, sales scripts, booking, project agreement, deposit/balance collection, onboarding and privacy/terms with this website-first motion. Verify the exact production form path and server anti-abuse configuration separately. Local QA must intercept all form requests, never send synthetic leads. Noindex is not access control.

## Remaining decisions

- Exact fixed project price and any valid pricing variables.
- Approved project agreement, refund/cancellation/acceptance terms and payment tooling for the two milestones.
- Platform, hosting arrangement and pass-through costs; handover/export/IP/license terms.
- Delivery schedule and defect-support window after launch.
- Final scope and optional service pricing, approved only after owner review.
- Whether to retain the current HVAC-first market focus beyond the initial launch.
- Formal effective date and migration plan for the authoritative active offer, only after approval.

## Local verification

Run `npm run build`, start the isolated production build on a free loopback port, then run `QA_BASE_URL=http://127.0.0.1:3184 node scripts/qa-website-first.cjs`. Set `PLAYWRIGHT_PATH` to an existing Playwright installation if not locally available, and optionally `PW_EXECUTABLE_PATH` for Chromium. QA refuses non-loopback base URLs, intercepts every inbound POST, blocks other mutating requests and writes screenshots/results to `artifacts/website-first/`. No production browser submissions or deploy commands are part of this workflow.
