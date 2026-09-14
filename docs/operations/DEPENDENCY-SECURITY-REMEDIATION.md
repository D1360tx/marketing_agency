# Dependency security remediation — PR #25

## Scope and advisory evidence

The fresh audit at baseline `d589883dd1bc2908684d4a20274ae3d13d81e419` reported **10 vulnerable packages** (1 critical, 4 high, 4 moderate, 1 low), superseding the earlier six-package report.

- Pin Next.js and eslint-config-next from 16.3.0 to **16.3.5**, retaining Next 16 and React 19.
- GitHub advisories [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) and [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) identify 16.3.3 as the first patched Next 16 release. [16.3.5 release notes](https://github.com/vercel/next.js/releases/tag/v16.3.5) describe additional image-cache, CSP nonce, standalone output and prerender fixes.
- Refresh affected transitive dependencies within their existing compatible ranges: sharp 0.35.4 (and native/libvips packages), @humanfs/node 0.16.8, baseline-browser-mapping 2.11.23, browserslist 4.28.9, fast-uri 3.1.7, hono 4.13.7, js-yaml 4.3.2, postcss-selector-parser 7.1.6, qs 6.16.0. Related dependency/browser-data updates are recorded in package-lock.json.
- No audit suppression, new override, force upgrade, application-code change, or test weakening.

## Executed verification

- Clean `npm ci`: successful; 0 vulnerabilities.
- `npm audit` and `npm audit --omit=dev`: **0 vulnerabilities**.
- `npm run test:security`: **122 passed, 0 failed** (full suite).
- `npm run test:outbound`: **8 passed, 0 failed** (focused).
- `npm run lint`: **0 errors, 10 warnings**; no source edits in this remediation.
- `npm run build`: successful Next.js 16.3.5 production build, TypeScript successful, 72 static pages generated. Edge-runtime deprecation warning remains.
- `git diff --check`: successful.
- Production server on isolated loopback port 3190; process cwd confirmed as this worktree.
- Browser QA: root at 360/390/768/1440px without horizontal overflow; branded 404 at all four sizes. Empty-input validation, intercepted 400/503/network failure with preserved values and retry/contact affordances, and intercepted success all passed. Four lead requests intercepted; **zero real lead submissions**.
- Browser smoke: `/`, `/es`, `/privacy`, `/terms` return 200, with no page errors or failed Next.js asset responses.

## Boundaries

Local `/login` verification is blocked because this isolated worktree lacks the Supabase public URL/key; server logs explicitly report that configuration error. Authenticated dashboard behavior was not verified. No production data, messages, or credentials were changed.

Vercel owner authentication/domain remediation and production verification remain separate release gates. This change does not authorize merge or production deployment. Git-connected preview checks may run automatically on the authorized branch push.

Local raw evidence: `/tmp/bookedout-audit-{before,after}.json`, `/tmp/bookedout-{tests,lint,build}.log`, `/tmp/bookedout-dependency-browser.json`, `/tmp/bookedout-dependency-{360,390,768,1440}.png`.
