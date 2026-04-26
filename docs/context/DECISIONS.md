# Booked Out — Key Decisions

## Business

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pricing | $399/mo, no contract | Low enough to be a no-brainer; no contract removes risk objection |
| Territory model | 1 per trade per city | Creates genuine scarcity + exclusivity; aligns our success with client success |
| Target market | Local service trades, Texas | High need, low digital sophistication, high LTV potential |
| Cold email persona | Maria Egil | Neutral name, female sender (higher open rates in trades) |
| Sending domains | 3 separate domains, never main domain | Protect trybookedout.com reputation |
| Lead sourcing | Brave Search + Scrapling (free) | Beat Apollo/ZoomInfo on accuracy for local businesses; 2-3% bounce vs 12-16% |

## Technical

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email provider | Resend | Free tier generous, great DX, reliable deliverability |
| Cold outreach | Instantly.ai | Purpose-built for warmup + cold send; domain reputation management |
| Lead scraping | Brave API (not Google Maps direct) | Free, reliable, no rate limit headaches |
| Database | Supabase | Free tier, RLS, real-time, auth included |
| Hosting | Vercel | Zero config Next.js deploys |
| CMS | None needed | Static pages + Supabase for dynamic content |
| Email extractor | TypeScript (production) + Python/Scrapling (local scripts) | Vercel can't run Python; Scrapling for heavy lifting locally |
| Main session model | Sonnet (switched from Opus 2026-03-04) | $342 spike on March 2 on Opus; Sonnet 5x cheaper, equivalent for most tasks |

## Copy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hero headline | "You Do Great Work. So Why Does Your Competitor Get the Call?" | Emotion over specifics; broad enough to apply to any trade (Collier approach) |
| Copywriter framework | PAS + Slippery Slide | Works for both cold (problem-aware) and warm (product-aware) audiences |
| Sequence naming | Sequence A (Review Gap) / Sequence B (No Website) | Clear segmentation by prospect situation |
