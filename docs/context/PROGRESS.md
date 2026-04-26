# Booked Out — Progress Tracker

## ✅ Done

### Infrastructure
- [x] Next.js app scaffolded + deployed to Vercel
- [x] Supabase DB + auth + RLS configured
- [x] GitHub repo connected (D1360tx/marketing_agency)
- [x] Resend email sending configured
- [x] Instantly.ai account + 3 domains + 9 inboxes + warmup started
- [x] Scrapling microservice (port 9871, systemd, auto-start)

### Landing Pages
- [x] English landing page (Opus version — 91/100 copy score)
- [x] Spanish landing page (/es — Texas market Spanish, 90+/100)
- [x] Language toggle (🇲🇽/🇺🇸) on mobile + desktop
- [x] Phone number: (737) 260-5332
- [x] /es added to public routes (auth middleware)

### Lead Pipeline
- [x] Lead scraper (Brave Search API, pagination, 80 leads/search)
- [x] 1,772 leads scraped (12 cities × 5 trades)
- [x] Email extractor (urllib + improved headers + 7 pages + entity decoding)
- [x] Email re-scan (Scrapling-based, 761 emails verified)
- [x] Export to Instantly CSV (dropdown button in leads dashboard)
- [x] export-instantly.py script (CLI with filters)

### Audit System
- [x] /api/audit/run — PageSpeed Insights + Brave competitor research
- [x] audit-runner.ts — shared library
- [x] /api/leads/inbound — form submit → create prospect → audit → drip enroll

### Email Sequences (all in Supabase)
- [x] Sequence 1: Inbound Lead Nurture (3 emails, 91-93/100)
- [x] Sequence 2: Post-Audit No Close (3 emails, 90-92/100)
- [x] Sequence 3: New Client Onboarding (3 emails, 90-92/100)
- [x] Cold Sequence A: Review Gap (Instantly.ai, 3 emails)
- [x] Cold Sequence B: No Website/Hot (Instantly.ai, 3 emails)

### Dashboard (AgencyFlow)
- [x] Leads management + filtering
- [x] Campaign management
- [x] Drip sequence builder
- [x] Email tracking + analytics
- [x] Approval queue

## 🔄 In Progress
- [ ] Instantly.ai warmup (started ~Mar 4, target ~Mar 18)

## 📋 Backlog

### Immediate (before March 18)
- [ ] Export 761 leads to Instantly CSVs (Sequence A + B split)
- [ ] Upload CSVs to Instantly + configure campaigns
- [ ] Verify warmup health before sending

### Soon
- [x] **Google Maps scraper** ✅ Built at `tools/gmaps-scraper/` — Playwright-based, daemon + Supabase job queue, extracts name/phone/website/email/rating/socials. Replaces Apify.
- [ ] Run scraper on remaining 4 cities (Wimberley, Dripping Springs, Bastrop, Lockhart) + scale to Dallas/Phoenix/etc.
- [ ] Scrapling into main email extractor flow
- [ ] SMS sequences (Twilio integration exists, needs copy)
- [ ] Client portal (onboarding intake form)

### Later
- [ ] GHL integration ($97/mo when revenue justifies)
- [ ] Google Workspace ($6/mo for professional email)
- [ ] Nationwide expansion beyond Texas
- [ ] Affiliate/referral program

## Metrics (as of 2026-03-04)
| Metric | Value |
|--------|-------|
| Total leads | 1,772 |
| Leads with email | 761 (43%) |
| Cities covered | 12 |
| Trades covered | 5 |
| Domains warming | 3 |
| Inboxes warming | 9 |
| Paying clients | 0 (pre-launch) |
