# Booked Out — Future Upsell Ideas

## Tier 3: Monthly Video Content (Voice Clone Pipeline)
**Date captured:** 2026-03-12
**Status:** Idea / Pre-validation

### The Problem
Local service business owners (plumbers, HVAC, etc.) have zero time and zero video production skills. They won't learn CapCut. But they have a phone and talk to customers all day.

### The Pipeline
```
Client records 60-sec voice memo on their phone
  ↓
Voicebox Whisper → auto-transcribes it
  ↓
Tim → cleans it up, punches the script
  ↓
Voicebox → regenerates polished voiceover in client's cloned voice (no re-recording)
  ↓
Vera → thumbnail, title card, text overlays
  ↓
Max → assembles + distributes to GBP, YouTube, Facebook
```

### The Money Angle
- Most agencies charge $500–1,500/month for video content
- Could be **Tier 3 upsell** — "we handle your monthly video content"
- Runs almost on autopilot once voice is cloned
- Target output: ~4 GBP videos/month per client

### The Key Unlock
Voice cloning. Client records once → we clone their voice → unlimited voiceovers that sound like them, no client involvement after setup.

### Pricing Target
TBD — Diego to nail down. Likely $300–700/mo on top of existing tier.

### Tools
- Voicebox Whisper (transcription)
- Voicebox (voice cloning + TTS)
- Vera (visuals)
- Max (assembly + distribution)

### Notes
Not a full production studio — but for a plumber in Austin who needs 4 GBP videos/month? Overkill in the best way.

---

*Add new upsell ideas below this line*

---

## Tier 2: Local SEO Domination
**Date captured:** 2026-04-08
**Status:** Idea / Ready to spec into offer
**Full playbook:** `LOCAL-SEO-SYSTEM.md`

### What It Is
20-prompt AI-powered local SEO system covering GBP, website, backlinks, and content. Automated via Claude Code + browser control. 90-day execution plan.

### The Money Angle
- **Price point:** $500–1,500/month upsell on top of core Booked Out plan
- **Lead gen hook:** Free GBP audit (prompts 1–3) as cold outreach offer
- **Onboarding add-on:** Run prompts 1–8 for every new client during setup

### Why It Works for Us
- Home service businesses (HVAC, plumbing, roofing) are exactly who this is built for
- Most agencies don't execute this systematically — we can
- Automation means high margin, low manual labor
- Free audit creates a natural sales conversation

### Next Steps
1. Build the free GBP audit as a standalone deliverable (PDF report template)
2. Price out Tier 2 SEO add-on in client pitch deck
3. Test as lead gen hook in next cold outreach batch

---

## GTM Auto-Reply Agent (Cold Email Follow-Up Automation)
**Date captured:** 2026-04-09
**Status:** Spec needed / Build ready
**Source:** https://x.com/codyschneider/status/2042316742639194454

### What It Does
Watches Instantly for positive replies (hourly cron), auto-responds based on business context, then runs a 5-step follow-up sequence automatically.

### Follow-Up Sequence
- **Immediate:** Auto-reply to positive response, propose call / next step
- **24-48h (F1):** Soft bump — lower activation energy, reference their specific reply, propose something smaller than a call
- **3-4 days (F2):** Value drop — case study, Loom teardown of their site/ads, useful asset. Converts "interested but slammed" people.
- **1 week (F3):** Pattern interrupt — one sentence + question, breakup-style but not really. Get a yes/no/later.
- **2 weeks (F4):** Actual breakup — "going to stop following up... reply 'later' to reschedule." Converts surprisingly well.
- **Monthly (F5+):** Indefinite low-effort touches — new feature, industry news, customer win in their vertical. Rotating bank, never same template twice.

### What We Need to Build
- Instantly API key (already use Instantly)
- Business context doc (already have it)
- Cron job watching for positive replies hourly
- Follow-up templates per stage (Tim writes)
- Max builds the pipeline automation

### Who Builds It
- **Max** — automation pipeline, Instantly API integration, cron job
- **Tim** — writes all 5 follow-up stage templates for Booked Out

### Why It Matters
Maria handles replies manually right now. This automates the entire sequence after a positive response — no leads go cold because someone forgot to follow up.
