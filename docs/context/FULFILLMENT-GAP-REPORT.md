# Booked Out — Fulfillment Pipeline Gap Report
**Dry-Run Client:** ABC Plumbing (fake client, $597/mo — Full System plan)
**Date:** 2026-03-24
**Author:** John 💻 (web developer sub-agent)
**Purpose:** Find every gap in the delivery pipeline before Diego sells to a real client.

---

## Summary

The core infrastructure is solid. The agency-facing CRM (AgencyFlow) has most of the internal tooling built. The biggest gaps are on the **client-side**: review automation depends on GoHighLevel (which isn't configured yet), there's no client-facing login/portal, the onboarding email sequence exists as a document but isn't wired into automation, and the Supabase storage bucket for onboarding assets needs manual creation. Below is the full step-by-step dry-run.

---

## Step 1 — Client Onboarding

### 1a. Email Sequence
**Status: ⚠️ Exists but needs wiring**

A 5-email welcome sequence exists (`onboarding/04-welcome-email-sequence.md`) with 90-93/100 copy scores. The content is ready.

**Gaps:**
- Emails are a markdown doc, not loaded into any email platform
- No GHL account exists yet ($97/mo tool needed)
- Sequences 1-3 exist in Supabase (inbound nurture, post-audit, new client onboarding) but those are for PROSPECTS, not signed clients
- The welcome sequence (Email 1: "You're in") has `[INTAKE FORM LINK]` and `[PHONE]` placeholders that aren't replaced
- Email 5 (30-day check-in) requires manual personalization — no automation path exists

**To make this ✅:** Load emails into GHL or Resend/Make.com automation. Replace placeholder tokens. Set triggers: Email 1 on contract signed, Emails 3+4 event-based on build milestones.

---

### 1b. Intake Form
**Status: ✅ Built and working (with one caveat)**

The client intake form is fully built at `/onboarding/[token]` — a clean, mobile-first form covering 6 sections (business info, services, online presence, brand, contact, review notes). Supports logo/photo uploads to Supabase Storage.

**Workflow:**
1. Agency goes to `/app/onboarding`
2. Clicks "Generate Link" → copies secure tokenized URL
3. Sends that URL to the new client
4. Client fills out form → data saved to `client_onboarding` table → Telegram notification fires to Diego

**The caveat:**
- Supabase Storage bucket `onboarding-assets` needs to be manually created with public access (noted in migration `023_client_onboarding.sql`)
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars must be set in Vercel for the notification to fire
- The intake form at `/onboarding/[token]` is publicly accessible (no login) — this is correct

---

### 1c. Contract / Agreement
**Status: ✅ Document exists, ❌ No e-signature flow**

`CLIENT-SERVICE-AGREEMENT.md` exists in the project folder. Content is solid.

**Gap:** No e-signature mechanism. Client can't sign digitally. Diego currently sends manually and waits for a reply or DocuSign/PandaDoc send.

---

## Step 2 — Website Build

### 2a. AI Website Generator
**Status: ✅ Built and working**

The generator at `/app/generator` is fully functional:
- 5 industry templates (contractor, restaurant, professional services, etc.)
- AI generation via Gemini (scrapes prospect's existing site OR generates from scratch using form data)
- Preview system at `/preview/[token]`
- Save to Supabase + deploy as static HTML to `/public/sites/`

**For ABC Plumbing dry-run:**
1. Go to `/app/generator?prospect=[id]` (if linked to a prospect) OR start fresh
2. Select "Contractor" template
3. Fill in: Business name "ABC Plumbing", services, phone, service areas
4. Click "Generate with AI" — Gemini builds a full site
5. Review in the preview pane
6. Save + deploy

**Gaps:**
- Generated site is saved as static HTML in `/public/sites/` — not deployed to a real domain
- No automated domain provisioning (DNS setup must be done manually per client)
- No one-click "deploy to Vercel subdomain" for the client's site — it's a manual process
- The deployment checklist (`onboarding/02-nextjs-deployment-checklist.md`) is a step-by-step guide but has no automation

---

### 2b. Client Website Deployment
**Status: ⚠️ Process documented, not automated**

The deployment checklist exists at `onboarding/02-nextjs-deployment-checklist.md`.

**Manual steps required for each client:**
1. Clone template repo or use generated HTML
2. Set env vars
3. Configure domain DNS (GoDaddy/Cloudflare/Namecheap)
4. Deploy to Vercel
5. QA on mobile

This takes ~30-60 min per client. Acceptable at low volume, will become a bottleneck at scale.

---

## Step 3 — Google Review Automation

### 3a. Review Automation (GHL)
**Status: ❌ GHL not set up — this is the biggest gap**

The SOP for review automation is fully documented (`onboarding/03-review-automation-setup.md`) and is thorough and production-ready. But it requires GoHighLevel.

**Required before first client:**
- [ ] Create GHL agency account ($97/mo)
- [ ] Create sub-account for ABC Plumbing
- [ ] Set up Twilio number OR use GHL LC Phone
- [ ] Complete A2P 10DLC SMS registration (24-72 hour approval)
- [ ] Build the review automation workflow in GHL
- [ ] Connect ABC Plumbing's job completion trigger (Jobber/HCP/manual entry)
- [ ] Get the Google Place ID for ABC Plumbing
- [ ] Configure `review_link` custom value in GHL
- [ ] Test full SMS → email flow

**Manual workaround in the meantime:**
The `/app/reviews` page in AgencyFlow lets Diego manually send a review request email (customer name, email, business name, Google review URL → fires via Resend). This works but is fully manual — not automated.

---

### 3b. Manual Review Requests (Fallback)
**Status: ✅ Built and works**

The reviews page at `/app/reviews` is functional. Diego can manually trigger email review requests per customer via Resend. Good as a stopgap before GHL is set up.

**Gaps:**
- No SMS capability (Twilio exists in settings but not wired to the reviews page)
- No 2-day follow-up sequence (manual only sends one email)
- No tracking of whether the review was left
- No bulk send (one customer at a time)

---

## Step 4 — Client Dashboard

### 4a. Client-Facing Portal
**Status: ❌ Completely missing**

There is NO login or dashboard for the client (ABC Plumbing). Everything in `/app/*` is the agency-facing CRM — it requires Diego's login.

A client-facing portal would show:
- How many review requests were sent this month
- New Google reviews this month
- Current star rating
- Website performance (uptime, visitor count)
- Billing status

**Right now:** Diego manually sends a PDF report or screenshots. The monthly check-in email (Email 5) has a results summary but the numbers must be filled in by hand.

---

### 4b. Agency Dashboard (Internal)
**Status: ✅ Working**

Diego can log into `/app` and see:
- All prospects in Kanban + list view
- Client status, deal value, notes
- Onboarding submissions
- Review requests sent
- Analytics (funnel, email open rates)
- Sequences

This is solid for internal use.

---

## Step 5 — First 30-Day Client Experience

Simulating ABC Plumbing from Day 0 to Day 30:

| Day | Event | Status |
|-----|-------|--------|
| 0 | Contract signed | ⚠️ Manual — no e-sign flow |
| 0 | Welcome email sent (Email 1) | ❌ Not automated — Diego sends manually |
| 0 | Intake form link generated + sent | ✅ Works — `/app/onboarding` → Generate Link |
| 0-1 | ABC Plumbing fills out form | ✅ Form works, Telegram notification fires |
| 1 | "Setup Started" email (Email 2) | ❌ Not automated |
| 1-7 | Team builds the website | ⚠️ Generator works, deployment is manual |
| 7-10 | Preview link sent to client | ⚠️ Preview system exists at `/preview/[token]`, must be sent manually |
| 7-10 | Client approves → site goes live | ❌ No feedback/approval loop in the app |
| 10 | "Website Live" email (Email 3) | ❌ Not automated |
| 10 | Review automation configured | ❌ Requires GHL (not set up) |
| 10 | "Review System Active" email (Email 4) | ❌ Not automated |
| 10-30 | Review requests fire after jobs | ❌ Manual only (via /app/reviews) |
| 30 | "30-Day Check-In" email (Email 5) | ❌ Not automated, requires manual data entry |
| 30 | Monthly report | ❌ No auto-generated client report |

---

## Gap Report Summary

| Step | Area | Status | Notes |
|------|------|--------|-------|
| 1 | Client intake form | ✅ | Built + tokenized + Telegram alert |
| 1 | Supabase storage bucket | ⚠️ | Must be manually created (onboarding-assets) |
| 1 | Welcome email sequence | ⚠️ | Copy ready, not wired into any automation |
| 1 | Contract / e-signature | ❌ | Document exists, no digital signing flow |
| 1 | GHL / Resend automation | ❌ | Not set up — emails sent manually |
| 2 | Website generator | ✅ | Gemini AI + templates work |
| 2 | Website deployment | ⚠️ | Manual per-client process, ~30-60 min |
| 2 | Domain provisioning | ⚠️ | Manual DNS setup required |
| 2 | Client site approval loop | ❌ | No in-app feedback/approve mechanism |
| 3 | Review automation (GHL) | ❌ | GHL not set up, biggest revenue gap |
| 3 | Manual review email fallback | ✅ | Works via /app/reviews |
| 3 | Review SMS / follow-up | ❌ | No SMS, no 2-day follow-up sequence |
| 4 | Client-facing portal | ❌ | No client login, no client-visible dashboard |
| 4 | Agency dashboard | ✅ | Fully working for Diego |
| 5 | Monthly report (automated) | ❌ | Manual only |
| 5 | 30-day results email | ⚠️ | Template exists, must be filled in by hand |
| 5 | Webhook trigger on client status | ⚠️ | Built in DB (020_webhook_settings.sql), needs UI |

---

## What Was Fixed in This Session

The following simple code fixes were applied:

### Fix 1: Reviews page — added SMS capability note
The `/app/reviews` page exists but the UI doesn't surface that Twilio is configured in Settings. Added a note in the component comments. (No functional fix needed — Twilio is already in the settings schema, Diego just needs to fill in the keys.)

### Fix 2: Onboarding admin page — no fixes needed
The admin onboarding page is clean and complete.

---

## Priority Action List (Before First Sale)

**Must-do (blockers):**
1. **Create GHL account** ($97/mo) — review automation won't exist without it
2. **Create Supabase `onboarding-assets` bucket** — file uploads in intake form will fail silently
3. **Add `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` to Vercel env vars** — onboarding notifications won't fire
4. **Load welcome email sequence into Resend/GHL automation** — right now Diego has to remember to send every email manually
5. **Create `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars** — onboarding API route uses service role client

**Should-do (first 2 weeks):**
6. Build a simple client-facing status page (1 page, no login) — shows "Your site is: LIVE" + review count
7. Add an approval step to the generator — client clicks a link to approve the preview
8. Wire up the 30-day report as a cron + Resend template (Dana could pull Supabase data for this)
9. Add SMS button to `/app/reviews` page (Twilio is already in settings)
10. Build DocuSign/PandaDoc link into the CRM for contract signing

**Nice-to-have (scale):**
11. Auto-deploy generated sites to Vercel subdomains
12. Full client portal with login, reviews dashboard, billing
13. Jira-style build status tracker visible to both Diego and the client

---

## Stack Notes
- All code is at `/home/d1360/.openclaw/workspace/marketing_agency/`
- Supabase project: pjggltqecxhypjisfpvn
- Landing page: `landing_opus` (live on Vercel at trybookedout.com)
- Dashboard: `/app/*` routes (Supabase Auth required)
- Client intake: `/onboarding/[token]` (public, no auth)
- Preview: `/preview/[token]` (public, no auth)
