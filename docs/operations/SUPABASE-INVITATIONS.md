# Supabase dashboard invitations (invitation-only access)

## Required production configuration (operator action; not applied by this patch)

1. Deploy the callback and `/auth/accept-invite` implementation first.
2. Supabase Authentication → URL Configuration: set Site URL to `https://trybookedout.com`. Allow the exact redirect URL `https://trybookedout.com/auth/callback` for auth callers. Do not use production wildcard redirects.
3. Authentication → Email Templates → Invite user: replace the invitation anchor destination with:

   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=invite">Accept invitation</a>
   ```

   Do not use `{{ .ConfirmationURL }}` for this SSR invite flow. Dashboard invitations are not initiated by the recipient's browser and therefore have no PKCE verifier cookie. Their default verification redirect can carry session tokens in a URL fragment, which the server callback cannot read. Linking to `/signup` is also incorrect: it intentionally redirects to login. A bare `/auth/accept-invite` link cannot authenticate anyone; it requires the session established by the callback.
4. Keep **Allow new users to sign up** disabled. Never enable public signup to repair invitations. Keep email/password sign-in enabled; use the admin invitation mechanism for agency users.
5. If the original link was already consumed, expired, or generated with the old template, changing the template does not rewrite that email. An authorized administrator must provide a fresh invitation (or appropriate account recovery if the account is already confirmed), only after explicit approval. Do not forward bearer links to logs or tickets. Email scanners/prefetch can consume one-time links; if this occurs, use an explicit confirmation/interstitial flow rather than raising token lifetimes.

## Local behavior and remaining verification

- Invite token hashes are verified by Supabase with the fixed `invite` type and server cookie storage; success always goes to `/auth/accept-invite` (ignoring untrusted `next`).
- Existing PKCE code callbacks retain the same-origin redirect sanitizer.
- Password setup verifies the current user server-side, validates confirmation/length, and uses `updateUser`, never `signUp` or admin credentials. Unauthenticated visitors cannot set passwords.
- Auth responses suppress caching/referrers/indexing. Never put third-party analytics on credential-bearing callback URLs.
- Existing `/signup` redirects and provider signup restrictions remain intact.
- Tests use auth stubs; no emails or provider mutations are made. Production settings, the exact original email destination, and real cookie/session delivery remain unverified until an authorized end-to-end test. Test a fresh invitation in a separate/private browser with no PKCE cookie, set a password, sign out, then sign in at `/login`. Reusing the invitation must fail. Verify actual response privacy headers after deployment.
