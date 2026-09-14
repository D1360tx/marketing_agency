# Public-site audit remediation

## Implemented

- English canonical landing page: distinguish field validation from network/service, security-check and rate-limit failures; preserve all inputs on failure; show retry and the existing public phone fallback; require `success: true`; prevent duplicate in-flight submissions; bound requests to 30 seconds; refresh the single-use security challenge for retries.
- Responsive proof-card rows: stack labels and values below desktop, use shrinkable tracks and wrapping. No global overflow clipping.
- Shared branded not-found page: homepage and public phone recovery, legal navigation. Unknown public routes reach the framework 404 without constructing a Supabase client; dashboard/login auth gates remain in place.
- Footer: repeat the existing legal identity and mailing address from the published terms/agreement.

## Verified locally

Fresh isolated branch from `origin/main` at `7e48624f31374b1bebc77ce8bd75543ecc1dbcac`. No shared worktree edits.

- Focused feedback tests: 3 passed.
- Full `npm run test:security`: 122 passed, 0 failed.
- `npm run lint`: 0 errors, 10 pre-existing warnings.
- `npm run build`: passed using lockfile-installed dependencies (Next 16.3.0).
- Production server at `127.0.0.1:3297`: homepage HTTP 200; branded missing route HTTP 404 at 360/390/768/1440.
- Browser document widths exactly equal each viewport: 360/390/768/1440. Tablet proof-card screenshot reviewed.
- Browser validation, HTTP 503, transport failure and success cases exercised with request interception. All failure cases preserved inputs; service failures exposed retry/phone. Four intercepted POSTs, zero real lead submissions. This is UI verification, not evidence of production lead storage or notification delivery.

Local evidence: `/home/d1360/bookedout-audit-browser.json`, `/home/d1360/bookedout-audit-{360,390,768,1440}.png`, `/home/d1360/bookedout-audit-proof.png`, `/home/d1360/bookedout-audit-{tests,lint,build}.log`.

## Release blockers / deliberately untouched

- `https://www.trybookedout.com` fails TLS hostname verification (`curl` exit 60); apex returns 200. No DNS/certificate/project mutation attempted: all three existing Vercel CLI credentials returned HTTP 403; the inspected response identifies `invalidToken: true`. Browser Use could not attach because the configured default browser was not recognized as supported Chromium. Renew scoped Vercel authentication and verify the apex project/account, www domain assignment, DNS and certificate before changing them. Existing local linkage is historical, not current ownership proof.
- No verified Booked Out GA4 measurement ID/account ownership was found in source or the existing environment files. No analytics ID or consent implementation invented.
- Public `/api/leads/inbound` persists prospects, enrolls a follow-up sequence, runs an audit and sends owner notifications. Existing synthetic suppression applies to a different onboarding path, not this public lead endpoint. Therefore no production lead POST was made.
- Additional dependency audit discovery: `npm audit --omit=dev` reports 6 existing vulnerabilities (1 critical, 2 high, 3 moderate), including Next 16.3.0. The lockfile was not changed by this narrow public-site patch. Dependency remediation and renewed provider access are release gates; do not merge this patch as though those gates passed.

## QA environment correction

The first attempted local port, 3187, was already owned by another worktree. That process was not modified or stopped. All final evidence was rerun against the isolated build on verified-free port 3297. Initial stale-dependency build failure was resolved by `npm ci --ignore-scripts` from the unchanged lockfile.
