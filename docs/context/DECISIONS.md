# Booked Out — Key Decisions

## Business

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pricing | First 3 qualified clients at $499/mo and $0 setup; no second public tier yet | Approved founding offer as of 2026-08-25; reprice from actual fulfillment data after the cohort |
| Founding clients | First 3 at $499/mo, no setup fee, month-to-month; core page export after 3 paid months | Low-friction proof cohort with strict one-location scope and no outcome guarantees |
| Territory model | No exclusivity by default | Any exclusivity requires a written addendum with defined trade, geography, payment, termination, and release rules |
| Target market | Established owner-operated HVAC companies in one Austin-area cluster | Focused proof cohort with meaningful job economics and observable conversion leaks |
| Cold email sender | Diego / Booked Out using accurate sender identity | CAN-SPAM compliant, replyable, and founder-led; no fabricated personas |
| Initial sending | Low-volume manually approved email from a verified Booked Out mailbox/domain | Protect deliverability while validating message-market fit; scale only after inbox, bounce, reply, and opt-out evidence |
| Lead sourcing | Brave Search + direct public business sources | Use observed or provider-sourced addresses only; no speculative email guessing |

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
