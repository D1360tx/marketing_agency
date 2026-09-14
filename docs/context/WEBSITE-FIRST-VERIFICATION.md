# Website-first preview verification

Local-only preview: `/website-first`.

## Verified

- `npm install --no-audit --no-fund`: exit 0, installed 851 packages because the worktree initially had no dependencies. Package manifest and lockfile unchanged. npm reported deprecation notices and four blocked dependency install scripts; these did not block lint, build or tests.
- `npm run build`: exit 0. Next.js 16.3.0 production compilation and TypeScript passed, 76 static pages generated, `/website-first` prerendered. Existing Edge Runtime deprecation/static-generation warnings remain.
- `npm run lint`: exit 0, zero errors and 10 warnings in pre-existing files outside this change.
- `npm run test:security`: exit 0, 119 tests passed, zero failures/skips.
- `git diff --check`: exit 0.
- `PLAYWRIGHT_PATH=/home/d1360/.npm/_npx/e41f203b7505f1fb/node_modules/playwright node scripts/qa-website-first.cjs`: exit 0 against an isolated `next start --hostname 127.0.0.1 --port 3184` production server.
- Five viewport runs at 390, 768, 1280, 1440 and 1920 pixels. Ten screenshots: hero and full page at each width.
- Each viewport: HTTP 200, no horizontal overflow, one H1, no broken in-page anchors, no body em dash, no one-word heading lines, minimum 44px visible control height, noindex/nofollow metadata and X-Robots-Tag, working FAQ disclosures and primary CTA anchor.
- Each viewport: blank, whitespace-only business, invalid email and invalid URL blocked; intercepted error preserves every field; intercepted success resets fields and disables submission; captured payload validates against the real inbound schema with `source=website-first/v1` and `smsConsent=false`.
- Browser mutation interception installed before navigation. Zero real submissions. No database writes, messages, payments, pushes or deployments.
- Existing homepage, HVAC variant routes, Privacy and Terms returned HTTP 200 locally. Git comparison confirms existing HVAC source, landing_opus, authoritative offer and brief were not changed.
- Visual review of responsive heroes, full desktop composition and mobile form/footer found no clipping or overlap. The design uses ivory/charcoal, a restrained amber accent and a clearly labeled illustrative website concept, with no fabricated proof.

## Evidence

Generated evidence remains uncommitted under `artifacts/website-first/`:

- `qa-results.json`
- `website-first-{390,768,1280,1440,1920}-hero.png`
- `website-first-{390,768,1280,1440,1920}-full.png`
- `contact-sheet.jpg`
- `full-page-review-1440.jpg`

An initial local HTTP 500 exposed the missing middleware public-route exception. Fixed with an exact `/website-first` match before Supabase initialization, then rebuilt and re-ran the complete browser suite successfully. This change does not broaden existing public route prefixes or change auth behavior for other paths.

## Not verified or approved

This is a review draft, not an activated offer. Exact price, hosting/handover terms, agreement, deposit and balance payment links, and downstream email/sales alignment remain approval gates. The existing inbound backend can enroll an older default email sequence, so source tagging is not sufficient to publish. The widget is deterministically substituted only in the browser QA harness; live Turnstile verification, real delivery, CRM enrollment and provider operations were intentionally not exercised. Noindex is not authentication.
