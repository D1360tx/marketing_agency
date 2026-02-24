# CLAUDE.md — AgencyFlow

## Project Overview

AgencyFlow is a B2B SaaS marketing automation platform that helps agencies find small businesses with poor web presence and sell them website improvement/creation services. It automates prospecting, lead management, outreach, and website generation.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + Radix UI + shadcn/ui
- **Database**: PostgreSQL via Supabase (with RLS policies)
- **Auth**: Supabase Auth (email/password)
- **AI**: Google Gemini 3.1 Pro (`@google/genai`)
- **Email**: Resend
- **SMS**: Twilio
- **Icons**: lucide-react
- **Drag-drop**: @dnd-kit
- **Validation**: Zod

## Commands

```bash
npm run dev       # Start dev server (port 3001)
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Geist fonts, metadata)
│   ├── globals.css                   # Global Tailwind styles
│   ├── auth/
│   │   ├── callback/route.ts         # OAuth callback
│   │   └── (auth)/login|signup/      # Auth pages
│   ├── (dashboard)/                  # Protected routes (requires auth)
│   │   ├── layout.tsx                # Auth check + DashboardShell wrapper
│   │   ├── page.tsx                  # Dashboard home (stats overview)
│   │   ├── prospector/page.tsx       # Google Maps search & website analysis
│   │   ├── leads/page.tsx            # Kanban/table lead pipeline
│   │   ├── leads/[id]/page.tsx       # Lead detail
│   │   ├── campaigns/page.tsx        # Campaign list
│   │   ├── campaigns/new/page.tsx    # Create campaign
│   │   ├── campaigns/[id]/page.tsx   # Campaign detail & editor
│   │   ├── generator/page.tsx        # AI website builder
│   │   └── settings/page.tsx         # API keys & preferences
│   └── api/
│       ├── prospects/route.ts        # GET/PATCH/DELETE prospects
│       ├── prospects/search/route.ts # POST search Google Maps
│       ├── prospects/analyze/route.ts# POST analyze website quality
│       ├── campaigns/route.ts        # GET/POST campaigns
│       ├── campaigns/[id]/route.ts   # GET/PUT/DELETE campaign
│       ├── campaigns/send/route.ts   # POST send messages
│       ├── campaigns/messages/route.ts# GET campaign messages
│       ├── generator/ai/route.ts     # POST generate site with Gemini
│       ├── generator/scrape/route.ts # POST scrape existing website
│       └── settings/route.ts         # GET/POST user settings
├── components/
│   ├── dashboard-shell.tsx           # Main layout (sidebar + content)
│   ├── stats-cards.tsx               # Dashboard metrics
│   ├── website-preview.tsx           # Template preview renderer
│   ├── website-score-badge.tsx       # A-F grade badge
│   └── ui/                           # 18 shadcn components
├── lib/
│   ├── supabase/client.ts            # Browser Supabase client
│   ├── supabase/server.ts            # Server Supabase client
│   ├── supabase/middleware.ts        # Session management
│   ├── gemini.ts                     # Gemini API — 5 industry style configs + prompt builder
│   ├── outreach.ts                   # Email/SMS template functions
│   ├── outscraper.ts                 # Google Maps scraping
│   ├── email-extractor.ts            # Extract emails from websites
│   ├── website-analyzer.ts           # Website quality scoring
│   ├── templates.ts                  # 5 static website templates
│   ├── mock-data.ts                  # Fake prospect data for dev
│   └── utils.ts                      # cn() utility
└── types/index.ts                    # All TypeScript types & interfaces
```

## Database Schema (Supabase PostgreSQL)

**Tables**: `prospects`, `website_analyses`, `campaigns`, `campaign_messages`, `user_settings`

- `prospects` — Business data from Google Maps (name, address, phone, email, website, rating, status)
- `website_analyses` — Lighthouse-style scores (performance, SEO, accessibility, overall grade A-F)
- `campaigns` — Email/SMS outreach campaigns (type, status, templates, metrics)
- `campaign_messages` — Individual messages per campaign (status tracking, timestamps)
- `user_settings` — Per-user API keys (outscraper, pagespeed, hunter, resend, twilio, gemini)

All tables have RLS policies scoped to `auth.uid()`. Migrations live in `supabase/migrations/001-006`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase publishable key
NEXT_PUBLIC_USE_MOCK_DATA=true    # Use fake data in dev (skip external APIs)
GEMINI_API_KEY                    # Google Gemini API key (optional — can be set per-user in settings)
```

## Key Patterns & Conventions

### API Routes
- All API routes authenticate via `supabase.auth.getUser()` and return 401 if no user
- API keys resolve: `user_settings` DB row first → env var fallback → error
- Return `NextResponse.json()` with appropriate status codes

### Supabase Client
- **Server**: `import { createClient } from "@/lib/supabase/server"` — async, uses cookies
- **Browser**: `import { createClient } from "@/lib/supabase/client"` — singleton

### Components
- All pages under `(dashboard)/` are client components (`"use client"`)
- UI components follow shadcn patterns (Radix primitives + Tailwind + cva)
- Path alias: `@/*` maps to `./src/*`

### Website Generator
- 5 template types: `contractor`, `restaurant`, `professional`, `salon`, `retail`
- `lib/gemini.ts` has per-industry `StyleConfig` objects with design direction
- AI generates standalone HTML files (all CSS inline, no external deps except Google Fonts + GSAP CDN)
- Preview uses scaled iframe (1440px width, scale 0.45) + fullscreen modal
- Scraper fetches up to 12 pages per site and extracts: about text, services, testimonials, images, team, hours, social links

### Static Sites
- Hand-built example sites live in `public/sites/` (e.g., `adept-plumbing.html`, `adept-plumbing-v2.html`, `adept-plumbing-v3.html`)
- Accessible at `/sites/<filename>` when dev server is running

## External Integrations

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Supabase | DB + Auth | `.env.local` |
| Outscraper | Google Maps search | User settings |
| Google PageSpeed | Website analysis | User settings |
| Hunter.io | Email finding | User settings |
| Google Gemini | AI website generation | User settings or `.env.local` |
| Resend | Email delivery | User settings |
| Twilio | SMS messaging | User settings |

## Development Notes

- Mock data mode (`NEXT_PUBLIC_USE_MOCK_DATA=true`) returns fake prospects without calling external APIs
- The dev server runs on port 3001 by default
- No CMS or ORM — direct Supabase JS client queries
- Middleware refreshes auth session on every request, redirects unauthenticated users to `/login`
