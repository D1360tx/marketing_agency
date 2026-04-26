# Booked Out (AgencyFlow) — Project Brief

**Status:** 🟢 Active — lead gen pipeline running, warming up email domains
**Started:** 2026-03-01
**Client:** Diego (we are the client — this is our business)
**Repo:** github.com/D1360tx/marketing_agency
**Production URL:** https://trybookedout.com

---

## What It Is

A two-sided business:
1. **The product** — trybookedout.com sells website + Google review automation to local service businesses ($399/mo)
2. **The engine** — AgencyFlow dashboard (internal) manages lead scraping, cold outreach, drip sequences, and client onboarding

## Business Model
- **Offer:** Website + review automation for local service businesses
- **Price:** $399/month, no contracts, cancel anytime
- **Guarantee:** Measurable results in 30 days or first month free
- **USP:** 1 business per trade per city — exclusive territory
- **Target market:** HVAC, plumbing, roofing, electrical, landscaping in Texas (Austin area expanding outward)

## Tech Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL + RLS)
- **Email:** Resend (transactional) + Instantly.ai (cold outreach)
- **Hosting:** Vercel
- **Auth:** Supabase Auth
- **Lead sourcing:** Brave Search API + Scrapling
- **Cold outreach domains:** bookedouthq.com, gobookedout.com, bookedoutpro.com

## Email Infrastructure
- **Platform:** Instantly.ai ($90/mo — 3 domains, 9 inboxes)
- **Sender persona:** Maria Egil
- **Inboxes:** maria@, mariaegil@, mgil@ across all 3 domains
- **Warmup started:** ~2026-03-04 | **Target launch:** ~2026-03-18
- **Send volume:** 450 emails/day at full warmup (50/inbox)
- **Main domain (trybookedout.com):** NEVER used for cold outreach

## Lead Database (Supabase)
- **Total leads:** 1,772 (as of 2026-03-04)
- **With email:** 761 verified
- **Coverage:** 12 Austin-area cities × 5 trades
- **Cities:** Dripping Springs, Wimberley, Kyle, Buda, Cedar Park, Leander, Georgetown, Pflugerville, San Marcos, New Braunfels, Bastrop, Lockhart
- **User ID (Diego):** 8337f5a8-dd50-43c5-8f35-b32e2180492d

## Email Sequences
All loaded in Supabase drip_sequences table:
| ID | Name | Purpose | Score |
|----|------|---------|-------|
| 58e2a4a5... | Inbound Lead Nurture | Form submit → audit → call booking | 91-93/100 |
| 615481e9... | Post-Audit No Close | Objection handling after audit | 90-92/100 |
| 53b74699... | New Client Onboarding | Welcome → site live → 14-day check-in | 90-92/100 |

Cold outreach sequences saved at: `workspace/research/instantly-sequences.md`

## Key Features Built
- Lead scraper (Brave Search API, 12 cities × 5 trades)
- Email extractor (improved: mobile UA, 7 pages, entity decoding, schema.org)
- Scrapling microservice (port 9871, systemd service)
- Audit system (PageSpeed Insights + Brave competitor research → A-F grade)
- Drip sequence engine (enrollment, scheduling, send via Resend)
- Export to Instantly.ai (CSV with sequence A/B filtering)
- Landing pages: English (/landing) + Spanish (/es)
- Approval queue, email tracking, analytics dashboard

## Team
| Role | Agent |
|------|-------|
| Orchestration | Bob |
| Copy | Tim |
| Development | John |

## Open Items
- [ ] March 18: Check Instantly warmup health → launch cold outreach campaign
- [ ] Export leads → upload to Instantly (Sequence A + B)
- [ ] Bi-weekly cron: token audit + memory maintenance
- [ ] Consider adding more cities/states as Austin fills up
- [ ] GHL ($97/mo) when revenue justifies it
- [ ] Google Workspace ($6/mo) for professional email
