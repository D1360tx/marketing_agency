# Booked Out — Affiliate Program Structure

## The Offer
- **Commission:** $80/month recurring per referred client (20% of $399/mo)
- **Type:** Revenue share, not one-time bounty — affiliates earn as long as the client stays
- **Payout:** Monthly via Venmo, PayPal, or ACH — paid on the 15th for prior month's active clients
- **Minimum payout:** $80 (1 active client)
- **Cookie/tracking:** Unique referral link per affiliate, tracked in Supabase

## Commission Examples
| Active Clients Referred | Monthly Earnings | Annual Earnings |
|---|---|---|
| 1 | $80 | $960 |
| 5 | $400 | $4,800 |
| 10 | $800 | $9,600 |
| 20 | $1,600 | $19,200 |

## Rules
- Commission starts when referred client completes first payment
- Commission stops when referred client cancels
- No commission on Market Dominator upgrades initially (revisit at 50+ affiliates)
- Affiliates cannot refer themselves
- No paid ads allowed using "Booked Out" brand name without written approval

## Target Affiliate Profiles (Priority Order)
1. **Bookkeepers/accountants** serving trades businesses — highest trust, existing relationships
2. **Business coaches** for contractors — already advising on growth
3. **Insurance agents** (commercial lines) — regular touchpoints with HVAC/plumbing owners
4. **Chamber of Commerce connectors** — know every local business owner in a city
5. **Other marketing agencies** — don't do websites or review management, can white-label refer
6. **GHL resellers** — have the client base but not the fulfillment capacity

## First 10 Affiliates — Recruitment Plan
Goal: 10 active affiliates within 60 days of launch

### Phase 1 — Warm Network (Week 1-2)
- Diego's personal network: accountants, insurance contacts, business connections
- LinkedIn outreach to bookkeepers in Austin metro who work with trades/contractors
- Target: 3-5 affiliates from warm network

### Phase 2 — Cold Outreach (Week 2-4)
- Apollo search: bookkeepers + accountants in Texas with "contractor" or "trades" in profile
- Sequence: 3-email cold outreach (see copy in affiliate-copy-draft.md)
- Target: 5-7 additional affiliates

### Phase 3 — Referral Loop (Ongoing)
- Ask every new affiliate: "Do you know 2 other people who serve contractors?"
- Each affiliate becomes a recruiter

## Tracking & Operations (Supabase)
Tables needed:
- `affiliates` — id, name, email, referral_code, payout_method, created_at
- `affiliate_referrals` — affiliate_id, client_id, status, commission_amount, paid_at

Dashboard view (AgencyFlow):
- Active referrals per affiliate
- Monthly commission owed
- Payout history
- Top performers

## Affiliate Portal (Phase 2 — after first 5 affiliates)
- Simple page at trybookedout.com/affiliates
- Login with email
- See: referral link, active clients, earnings, payout history
- Self-serve (no manual tracking calls)

## Launch Checklist
- [ ] Build affiliate tracking in Supabase (2 tables + referral_code on prospects)
- [ ] Create unique referral link generator
- [ ] Write program terms page (trybookedout.com/affiliate-terms)
- [ ] Set up payout method (Venmo/PayPal to start, Stripe Connect later)
- [ ] Recruit first 10 affiliates
- [ ] Add affiliate signup form to trybookedout.com/partners

## Open Questions
- Do we offer a signup bonus ($50 one-time) to recruit faster? (Risk: attracts low-quality affiliates)
- When do we add Market Dominator commission? (Suggest: after 25 active affiliates)
- Cap per affiliate? (No cap initially — reward the top performers)
