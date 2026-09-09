# Invitation follow-up diagnosis

## Verified facts

- Production `trybookedout.com` is Vercel project `prj_RqZNEm2qAJvmkcFy2QKbMQoetGMd`, deployment `dpl_939fPgFZPrifUkrmGgFDhmzvmUXi`, READY, source SHA `4843b62fdc1bec6993c8ea3a7ae9b2425215518c` (PR #20).
- An isolated Chromium production probe with synthetic, non-secret `access_token=test-access`, `refresh_token=test-refresh`, `token_type=bearer`, `type=invite` fragment stayed at `/`, retained its fragment and rendered the public marketing heading. This proves the legacy implicit-invite landing path is not handled. It does NOT prove Diego's delivered email used this path.
- `/auth/callback?token_hash=invalid&type=invite` returned 307 to `/login?error=auth`.
- Anonymous `/auth/accept-invite` renders an explanatory alert and zero password inputs. A 200 here is not proof of a usable invitation.
- Scoped Supabase admin readback of test user `e2bd2694-59fa-494c-a20b-6e7086834e50` shows `invited_at=2026-09-09T03:46:22.85902Z`, `email_confirmed_at=null`, `last_sign_in_at=null`. Therefore the reported click has not successfully verified that invitation.

## Change boundary

The added root-only client handler accepts only unambiguous complete invitation credentials, clears the fragment before loading Supabase, establishes the session through Supabase, and performs a full fixed-path navigation to the existing server-validated password page. Failure goes to the generic auth-error login path. It ignores other routes, non-invite flows and ordinary navigation hashes. It never logs or converts bearer credentials into query parameters. The preferred server token-hash template and public signup restrictions remain unchanged.

## Verification of this follow-up

- New fragment unit tests: 4/4 pass. Full Node suite: 112/112 pass.
- Full ESLint: zero errors, 10 existing warnings outside the changed files.
- Production build: passed, 72 generated pages. Build used the production public Supabase URL/key retrieved through Vercel's individually decrypted environment endpoint; no service-role key was bundled.
- Local production Chromium checks at 390px and 1440px: normal `#pricing` remains intact; invalid invitation fragments clear and navigate to `/login?error=auth`, including same-document hash changes.
- Browser test with an explicitly mocked Supabase `/auth/v1/user` response and synthetic JWT: real client `setSession` path navigates to `/auth/accept-invite` with an empty fragment. This is integration coverage, not a real invitation/password/login test.

## Unresolved actual-email/provider gate

The actual delivered anchor, its redirect chain and current provider template could not be inspected. The configured Supabase management credential returns 401. The work Gmail connector returns a credential-decryption error. The real-profile browser tool cannot start because the default browser is unsupported, and native window discovery found no signed-in browser window.

The fresh user remaining unverified makes a plain SiteURL anchor a plausible explanation. This client fallback cannot recover credentials absent from a link. Do not label this PR a complete fix for the reported email without inspecting the delivered anchor/template and completing a controlled real invite test. No user was deleted, no email was sent, and no provider configuration was changed in this follow-up.
