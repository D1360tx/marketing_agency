# Website + CRM variation

## Review scope

This is a proposed, noindex landing-page variation at `/website-crm`, not the active offer or an authorized production release. Built on freshly fetched `origin/main` (`dc4953a`) in an isolated worktree. No previous landing-page files, original homepage, authoritative offer documents, inbound endpoint, payment routes or integrations were modified. The previous `/website-first` and HVAC variations remain on their original branches and worktrees; they were not imported into this clean branch. No merge, production promotion, domain change or spending is authorized.

## Direction

For established home-service teams: the website earns trust and captures contact; Booked Out CRM helps the team organize the conversation and next action. The hero visually connects a fictional service website to a conceptual CRM. The full CRM narrative uses Pipeline, Conversation and Booking tabs rather than a feature-card wall. Ivory, charcoal, restrained muted olive, native Arial/Helvetica, yellow actions, original SVG house artwork and a Booked Out SVG arrow mark make the proposal cohesive without importing stock photography or borrowed client proof.

HighLevel is disclosed as the underlying white-label platform. Interfaces are original illustrations, not actual HighLevel screenshots, account connections or client records. The founder block identifies Diego Campos and the supplied business phone without invented results, testimonials or availability guarantees.

## Offer boundaries

- Website: fixed project quote, 50% to begin, balance before launch.
- CRM: monthly subscription and setup quoted separately with configuration and training scope.
- Care, ongoing managed work, local search and ads: optional separate scope. Media spend separate.
- Hosting, licenses, handover, access, export and cancellation documented before payment.
- SMS capability is not an included active service. Consent, applicable A2P registration, opt-outs and provider approval required; messaging/phone/other usage itemized separately.
- No numeric proposed website/CRM/care prices, body em dashes, scarcity, guarantees, fake reviews or claimed live data.

## Interaction and safety

The primary CTA opens the local planner section. Two required native selects produce an in-memory starting scope with explicit "not sent, stored or booked" messaging. This is not a fake-success lead form. No fetch, storage, booking, inbound enrollment, email or SMS path exists in the planner. Telephone links give a real-project contact option; QA never dials them. Native FAQs, skip link, visible focus states, mobile menu with Escape and roving-keyboard CRM tabs are implemented.

The exact public route is handled before Supabase creation. Both metadata and HTTP `X-Robots-Tag` carry noindex/nofollow; noindex is not access control. Protected remote preview is a separate review gate.

## Verified locally

Production build: Next.js 16.3.5, compiled successfully, TypeScript passed, static generation completed (73/73).

- `npm run lint`: exit 0, 0 errors, 10 pre-existing warnings outside new route.
- `npm run test:security`: exit 0, 126 passed, 0 failed. Includes 4 new preview-boundary tests.
- `git diff --check`: clean.
- Credential-free production preview: `http://localhost:3359/website-crm`, HTTP 200, noindex headers.
- Widths 390, 768, 1280, 1440, 1920: document scroll width equals viewport width; no single-word h1/h2 lines; all visible controls at least 44px in both dimensions.
- Each width: independent CRM tab instances, arrows/Home/End, keyboard FAQ, primary CTA, native invalid planner path, two valid plans and preserved selections passed. Mobile menu open/Escape/nav-close passed.
- Browser report: 0 page errors, 0 attempted mutations. Non-GET/HEAD requests and non-loopback hosts are blocked before navigation.
- Full-page, hero and planner screenshots for all 5 widths in local `artifacts/website-crm/`. Committed mobile and desktop captures plus machine-readable QA report in `docs/review/website-crm/`.
- Visually inspected desktop hero/full-page, mobile hero/full-page and CRM crop, tablet full-page. Corrected a mobile heading orphan and undersized footer targets before final capture.
- Read-only capture of actual current homepage in `artifacts/current-homepage-*.png`; existing orange/white broad foundation offer is unchanged.

Production process cwd was verified as `/home/d1360/workspaces/bookedout-website-crm-20261009`. Existing unrelated servers were not stopped. Isolated port availability was checked before startup.

## Reproduce browser QA

Install Playwright outside the application lockfile if it is not already available:

```sh
npm install --prefix /tmp/bookedout-qa playwright --no-audit --no-fund
node /tmp/bookedout-qa/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_MODULE=/tmp/bookedout-qa/node_modules/playwright/index.mjs node scripts/qa-website-crm.mjs
```

The QA script defaults to localhost port 3359. `QA_URL` can choose another local production-preview port. It intentionally blocks external hosts and mutations.

## Release gates remaining

Owner approval of page, final commercial terms, subscription/setup scope and hosting/handover terms. A production request flow must be explicitly scoped and integrated, including downstream sequence alignment, privacy and consent review, before this can replace an active marketing page. The existing active offer and terms were deliberately not changed.

Built and verified by the running `gpt-6.1-sol` model on Hermes Agent, not Astra.
