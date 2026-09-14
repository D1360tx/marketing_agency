# Website-first V2 verification

Local review route: `/website-first`. No push, deployment or real submissions.

## Final verification

- `npm run build`: exit 0. Next.js 16.3.0 production compilation and TypeScript passed; 76 static pages generated, including `/website-first`. Existing Edge Runtime deprecation/static-generation warnings remain.
- `npm run lint`: exit 0. Zero errors; 10 pre-existing warnings outside the changed route and QA files.
- `npm run test:security`: exit 0. 119 tests passed; zero failures, cancellations or skips.
- `git diff --check`: exit 0.
- Production server: isolated worktree, `next start --hostname 127.0.0.1 --port 3185`. Process cwd and HTTP response verified before QA.
- `PLAYWRIGHT_PATH=/home/d1360/.npm/_npx/e41f203b7505f1fb/node_modules/playwright QA_BASE_URL=http://127.0.0.1:3185 node scripts/qa-website-first.cjs`: exit 0. Five viewport passes, five form-path passes, ten screenshots, no browser page errors, zero real submissions.
- Existing `/`, `/hvac-variants`, `/hvac-variants/system`, `/hvac-variants/snapshot`, `/privacy` and `/terms`: HTTP 200 locally. Other route sources, middleware, authoritative offer and package files remain unchanged.

## Assertions at 390 / 768 / 1280 / 1440 / 1920

- Exact H1: “See the website we’d build for your business. Before you hire us.”
- Exact form CTA: “Request My Homepage Concept”; header/hero CTA goes to the existing `#website-plan` anchor.
- Old generic hero and foundation phrases absent.
- One H1, unique DOM/SVG IDs, no horizontal overflow, no broken fragment anchors, no visible control below 44px high.
- DOM Range checks: no one-word lines in any H1/H2/H3.
- No body em dashes; noindex/nofollow metadata and `X-Robots-Tag` preserved.
- All FAQ disclosures open/close and expose their answer.
- Reduced-motion emulation removes the device animation. Screenshots finish animations deterministically, and hero captures include the full presentation board rather than stopping at viewport height.
- Empty form, whitespace-only business, invalid email and invalid URL do not produce a request.
- Intercepted error preserves all fields; retry succeeds against an intercepted response, resets fields and disables resubmission.
- Every captured payload validates against the real inbound schema, with `source=website-first/v1`, `smsConsent=false` and an empty honeypot.
- Mutation interception is installed before navigation; non-loopback requests and unrelated mutations are blocked. The live backend, CRM, email, payment and SMS paths were not invoked.

## Visual iterations

The first responsive pass exposed heading orphans at 390, 768 and 1280. Revised heading copy, short keep-phrases and tablet FAQ layout; reran all five widths until clear. Tightened the mobile hero deck, clarified that the request asks for a business rather than a personal name, added a relevant brief note to the concept section, and namespaced SVG resources for the two device layers. Restoring normal motion after reduced-motion QA briefly restarted the device entrance; deterministic screenshot animation completion fixes that capture artifact.

Reviewed the final five-width hero contact sheet, full-page composition and readable full-resolution crops across mobile, tablet and desktop. The sample board is explicitly illustrative; the mobile device and call path are visible. Payment milestones, scope, optional support and form maintain distinct visual hierarchy. No clipping, overlapping controls or heading orphans were found at the requested widths. Next.js’s generated `CLAUDE.md` edit from the temporary dev server was reverted; it is not part of this artifact.

## Evidence (untracked)

All evidence is under `artifacts/website-first/`:

- `qa-results.json`
- `website-first-{390,768,1280,1440,1920}-hero.png`
- `website-first-{390,768,1280,1440,1920}-full.png`
- `contact-sheet.jpg`
- `full-page-review-{390,768,1280,1440,1920}.jpg`

See `WEBSITE-FIRST-V2-RATIONALE.md` for the strategy and clearly labeled role-based copy panel assessment.

## Approval and live-operation boundaries

This remains a proposed offer. Fixed pricing, agreement, hosting/handover terms, payments and downstream sales/onboarding alignment need owner approval before publication. The existing inbound backend can enroll the older default email sequence; preserving or changing the source tag does not change that behavior. Live Turnstile verification, real inbox delivery, CRM enrollment and provider operations were deliberately not tested. Noindex is not access control. Editorial panel scores are not external expert endorsements or measured conversion results.
