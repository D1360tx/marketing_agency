# Booked Out — Build Plan
*Created: 2026-03-22 | Status: Ready to execute*

## Phase 1 — Revenue Infrastructure (Priority: THIS WEEK)
Unlocks the ability to close and collect money.

### 1a. Stripe Subscriptions
- `/checkout?tier=full` ($399/mo) and `/checkout?tier=dominator` ($697/mo)
- Monthly billing, success redirect → client intake form
- **Needs:** Diego's Stripe secret key + publishable key
- **Status:** ⏳ Waiting on Stripe keys from Diego

### 1b. Booking Page
- `/book` — embedded Calendly or built-in scheduler
- Link from: cold email replies, landing page CTA, proposal page
- **Status:** ⏳ Not started

---

## Phase 2 — Close & Onboard (Priority: THIS WEEK)

### 2a. Client Intake Form
- `/onboard` — fires after Stripe payment success
- Collects: business name, address, phone, Google account email, services offered, target cities, existing website URL
- Saves to Supabase `clients` table
- **Status:** ⏳ Not started

### 2b. Proposal Page
- `/proposal` — clean one-pager to send after sales call
- Shows: tiers, guarantee, FAQ, "Get Started" → Stripe checkout
- **Status:** ⏳ Not started

---

## Phase 3 — Operations (Next Week)

### 3a. Affiliate Supabase Tracking
- Wire /partners form to Supabase `affiliates` table
- Generate unique referral codes per affiliate
- Track referrals + commissions
- **Status:** /partners page ✅ live — backend not wired yet

### 3b. Weekly Telegram Pipeline Report
- Sunday 6pm cron
- Pulls from Supabase: leads added, emails sent, replies, closes, active clients
- Delivers to Booked Out topic (topic 3)
- **Status:** ⏳ Not started

---

## Phase 4 — Retention (When 3+ clients)

### 4a. Client Portal
- Login → see website status, review count, monthly report
- **Status:** ⏳ Not started (deprioritized until clients exist)

---

## What's Already Built ✅
- Landing page (trybookedout.com) — live
- Spanish landing (/es) — live
- AgencyFlow CRM (internal dashboard) — live
- Lead scraper (1,772 leads, 761 with email) — live
- Email sequences loaded in Supabase — ready
- Instantly.ai cold email infrastructure (9 inboxes warming) — warming
- /partners affiliate page — just built, deploying now
- Client Service Agreement template — `projects/bookedout/CLIENT-SERVICE-AGREEMENT.md`
- Affiliate program structure + copy — `projects/bookedout/AFFILIATE-PROGRAM.md` + `affiliate-copy-draft.md`

---

## Immediate Next Step
Diego to provide Stripe secret key + publishable key in the Booked Out topic.
Then John builds Phase 1 (Stripe + booking page) simultaneously.
