# Client Onboarding Intake Form — Build Report
Date: 2026-03-18

## Summary
Built the full client onboarding intake system for Booked Out — public token-based form, API, admin view, and DB migration.

---

## Files Created / Modified

### New Files
| File | Purpose |
|---|---|
| `supabase/migrations/023_client_onboarding.sql` | DB migration: client_onboarding table, RLS policies |
| `src/app/onboarding/[token]/page.tsx` | Public intake form (token-based, no login, 6 sections) |
| `src/app/api/onboarding/[token]/route.ts` | GET (validate token) + POST (submit + Telegram notification) |
| `src/app/app/onboarding/page.tsx` | Admin view: submissions table, Generate Link, status dropdown |

### Modified Files
| File | Change |
|---|---|
| `src/lib/supabase/middleware.ts` | Added `/onboarding` and `/api/onboarding` to public routes |
| `src/components/dashboard-shell.tsx` | Added "Onboarding" nav item (ClipboardList icon, `/app/onboarding`) |

---

## Build Status
**PASS** — Zero TypeScript errors.

Note: `@react-pdf/renderer` was listed in package.json but missing from node_modules — installed it as part of this build to fix the pre-existing broken build.

---

## Deploy Status
**LIVE** — Deployed to Vercel production.

- Deploy URL: https://trybookedout.com
- Vercel preview: https://marketingagency-pcajx7c8s-d1360txs-projects.vercel.app
- Verified: `https://trybookedout.com/onboarding/test-token` shows "Link not found or expired" ✅

---

## How It Works

### Public Form Flow
1. Diego generates a link from `/app/onboarding` → "Generate Link" button
2. This creates a `client_onboarding` row with a random 32-char hex token
3. Copies full URL to clipboard: `https://trybookedout.com/onboarding/[token]`
4. Diego sends link to client
5. Client fills out 6-section form (no login required)
6. On submit: form data saved, `submitted_at` set, Telegram notification fired
7. Client sees "Thanks, we've got your info!" confirmation

### Admin View
- URL: `/app/onboarding` (auth required)
- Table shows all submissions with Business Name, Owner, Phone, Services, Submitted At, Status
- Click any row to expand full details (address, brand notes, photos, contact info, etc.)
- Status dropdown: pending → reviewed → complete
- "Copy Link" button per row to re-share

---

## Manual Steps Diego Needs to Do

### 1. Run the SQL Migration
The migration is at `supabase/migrations/023_client_onboarding.sql`.
Run it in the Supabase dashboard SQL editor or via the Supabase CLI:
```bash
supabase db push
```
Or paste the contents into Supabase Dashboard → SQL Editor → Run.

### 2. Create the Storage Bucket
File uploads (logo + photos) use Supabase Storage.
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named: **`onboarding-assets`**
3. Set it to **Public** (so uploaded images are accessible via URL)
4. Upload paths will be:
   - Logo: `[token]/logo.[ext]`
   - Photos: `[token]/photos/[filename]`

If the bucket doesn't exist, file uploads on the form will silently fail (the rest of the form still submits fine — logo_url and photo_urls will just be empty).

### 3. Verify Telegram Env Vars
The POST handler sends a Telegram notification using:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

These need to be set in Vercel environment variables if not already present.

---

## Routing Notes
- Public form: `/onboarding/[token]` — outside `/app`, no auth
- Admin view: `/app/onboarding` — inside `/app`, requires auth
- No routing conflict — separate directory trees
