# Booked Out — Security Operations

## Required production variables

### `CRON_SECRET`

Every `/api/cron/*` route fails closed unless `CRON_SECRET` is configured and the request sends:

```text
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron automatically sends this header when the project has a `CRON_SECRET` environment variable.

Before merging cron-auth changes:

1. Generate a high-entropy value, for example with `openssl rand -base64 48`.
2. Set `CRON_SECRET` in every Vercel project that deploys this repository.
3. Apply it to Production and Preview environments as appropriate.
4. Redeploy after changing the environment.
5. Confirm anonymous and wrong-secret requests return `401`.
6. Confirm the scheduled Vercel invocation succeeds without manually exposing the secret.

Never commit or paste the actual value into source, issues, PR descriptions, or logs.

## Brave credential rotation

The public Git history contains one historical Brave API key literal. Active source uses only `process.env.BRAVE_API_KEY` and contains no key literal.

Required checks:

1. Revoke the historically exposed key in the Brave account.
2. Create or retain a replacement that does not match the historical value.
3. Update the Production and Preview `BRAVE_API_KEY` variables in every active Vercel project.
4. Redeploy.
5. Verify the old key is rejected and the new key succeeds using the Brave account/dashboard or an approved low-cost test request.

Local comparison on July 25, 2026 showed the configured local key does **not** match the historical literal. This does not prove the production Vercel value was updated.

## Audit route authorization

`POST /api/audit/run` requires:

- A valid Supabase user session
- A UUID `prospect_id`
- A prospect owned by that same user

The service-role audit runner is called only after these checks pass.

## Verification commands

```bash
npm run test:security
npm run build
npx eslint src/lib/server-auth.ts \
  src/app/api/audit/run/route.ts \
  src/app/api/cron/daily-summary/route.ts \
  src/app/api/cron/drip/route.ts \
  src/app/api/cron/followup-reminder/route.ts \
  src/app/api/cron/weekly-summary/route.ts \
  tests/security-auth.test.mjs
```
