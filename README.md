# AgencyFlow — Booked Out Dashboard

Marketing automation platform for local service business agencies. Prospecting, lead management, outreach campaigns, AI website generation, review requests.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres + Auth) · Resend · Twilio · Google Gemini

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/D1360tx/marketing_agency
cd marketing_agency
npm install

# 2. Copy env file and fill in your keys
cp .env.local.example .env.local

# 3. Run dev server (port 3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values below.

### Required

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role key (**server-side only, never expose to browser**) |

### Optional (can also be set per-user in the app's Settings page)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | AI website generation (Google Gemini) |
| `ANTHROPIC_API_KEY` | AI copy generation (Claude) |
| `RESEND_API_KEY` | Email delivery |
| `TWILIO_ACCOUNT_SID` | SMS messaging |
| `TWILIO_AUTH_TOKEN` | SMS messaging |
| `TWILIO_PHONE_NUMBER` | SMS sender number |
| `OUTSCRAPER_API_KEY` | Google Maps prospect scraping |
| `BRAVE_API_KEY` | Competitor search |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Set `true` in dev to skip external APIs |

---

## Authentication (Supabase Auth)

Authentication is handled by **Supabase Auth** (email + password).

- `/login` — sign-in page
- `/signup` — account creation (for invited users)
- All `/dashboard` routes and API routes are protected; unauthenticated requests redirect to `/login`
- The public landing page (`/landing`) is always accessible without login

### Adding a new user (e.g. Maria)

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Invite user**
3. Enter Maria's email address and click **Send Invite**
4. Maria gets an email with a link — clicking it lands her on the app, sets her password, and logs her in
5. Her data is scoped to her account via RLS policies

### Disabling public sign-ups (recommended for closed teams)

To prevent strangers from creating accounts:

1. Supabase Dashboard → **Authentication → Providers → Email**
2. Toggle off **"Allow new users to sign up"**
3. Users can only join via the **Invite user** flow above

---

## Deploying to Vercel

1. Connect the GitHub repo to a new Vercel project
2. Go to **Vercel → Project → Settings → Environment Variables**
3. Add every variable from the **Required** section above (plus any optional ones you use)
4. Redeploy

**Important:** `SUPABASE_SERVICE_ROLE_KEY` must be set as a **server-side-only** env var in Vercel (do not prefix with `NEXT_PUBLIC_`).

---

## Database Setup

Migrations live in `supabase/migrations/`. Run them in order against your Supabase project:

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Supabase Dashboard → SQL Editor
# Paste and run ALL_MIGRATIONS.sql
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── (auth)/login|signup/          # Auth pages (public)
│   ├── auth/callback/route.ts        # OAuth/magic-link callback
│   ├── (dashboard)/                  # Protected routes
│   │   ├── layout.tsx                # Auth gate + sidebar shell
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── prospector/               # Google Maps search
│   │   ├── leads/                    # Lead pipeline (Kanban + table)
│   │   ├── campaigns/                # Email/SMS campaigns
│   │   ├── sequences/                # Drip sequences
│   │   ├── generator/                # AI website builder
│   │   ├── analytics/                # Metrics overview
│   │   ├── reviews/                  # Review request automation
│   │   └── settings/                 # API keys + preferences
│   └── api/                          # API routes (all auth-protected)
├── components/
│   ├── dashboard-shell.tsx           # Sidebar navigation + sign-out
│   └── ui/                           # shadcn components
└── lib/
    ├── supabase/client.ts            # Browser Supabase client
    ├── supabase/server.ts            # Server Supabase client (SSR)
    └── supabase/middleware.ts        # Session refresh + route protection
```

---

## Commands

```bash
npm run dev     # Dev server (port 3001)
npm run build   # Production build
npm run start   # Run production build
npm run lint    # ESLint
```
