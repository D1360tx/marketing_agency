# Booked Out Revenue-Readiness Build Plan

## Objective

Make the $499/month Local Call System safe to sell, collect, onboard, fulfill, and report without unsupported claims or hidden manual gaps.

## Gate 1: Production Safety

- Merge and deploy security and onboarding privacy work
- Apply Supabase migrations 023, 024, 025, and 026 in order
- Verify cron, audit, onboarding, private assets, and service-role ownership
- Keep production dependencies at zero known audit findings
- Protect public lead capture with strict schemas, bounded bodies, distributed rate limits, honeypot, and optional Turnstile
- Retire the mock audit and old public landing variants

## Gate 2: Revenue Conversion

Configure these Vercel variables:

- `BOOKED_OUT_BOOKING_URL`
- `BOOKED_OUT_AGREEMENT_URL`
- `BOOKED_OUT_LOCAL_CALL_PAYMENT_URL`

The public site and CRM use stable `/go/book`, `/go/agreement`, and `/go/start` routes so provider URLs remain server-side. Do not create or configure a Growth Partner payment link until recurring fulfillment is approved.

Before the first payment:

- Service agreement reviewed by Texas counsel
- Agreement loaded into an e-sign tool
- Booked Out mailing address completed
- Cancellation and renewal process tested
- Payment receipt and failed-payment alerts tested

## Gate 3: Fulfillment

- Phone/SMS provider selected
- A2P or equivalent messaging registration approved
- Missed-call text-back tested
- Form-lead follow-up tested
- Review requests remain neutral
- SMS is blocked without recorded consent
- STOP and suppression behavior verified
- Website deployment checklist verified
- Monthly evidence report template approved

## Gate 4: Dry Run

Run fake client ABC Plumbing through:

1. Prospect and sourced audit
2. Booking
3. Agreement
4. Test recurring payment
5. Secure onboarding
6. Asset upload
7. Website generation and approval
8. Domain deployment
9. Review-request workflow
10. Missed-call and form-lead follow-up
11. Opt-out
12. Monthly report
13. Cancellation and export scenario

Every failed step must have an owner, fix, fallback, and passing retest.

## Gate 5: Founder-Led Sales

Start with HVAC in one Texas metro cluster. Daily target after the dry run passes:

- 20 calls
- 10 personalized direct messages
- 20-30 personalized emails
- 5 follow-ups
- 1-2 sourced audits

Do not launch high-volume automation, paid ads, an affiliate program, a client portal, or automated domain provisioning before three paying clients.
