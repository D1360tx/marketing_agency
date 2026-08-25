# Booked Out Founding Launch Build Plan

## Objective

Make the $499/month Local Call System safe to sell, collect, onboard, fulfill, and report for the first three qualified HVAC clients without unsupported claims or hidden automation gaps.

## Gate 1: Production Safety

- Security and onboarding privacy work deployed
- Production migrations through 031 verified
- Production dependencies at zero known audit findings
- Public lead capture protected by strict schemas, bounded bodies, distributed rate limits, honeypot, and Turnstile when both keys are configured
- Public offer and Spanish offer match the source of truth
- SMS and missed-call automation remain disabled

## Gate 2: Revenue Conversion

Configure these Vercel variables:

- `BOOKED_OUT_BOOKING_URL`
- `BOOKED_OUT_AGREEMENT_URL`
- `BOOKED_OUT_LOCAL_CALL_PAYMENT_URL`

The public site and CRM use stable `/go/book`, `/go/agreement`, and `/go/start` routes so provider URLs remain server-side.

Before the first payment:

- Service agreement reviewed by Texas counsel
- ICDC Ventures LLC / Booked Out DBA and mailing address completed
- Agreement loaded into an e-sign tool
- $499 recurring payment link created with quantity fixed at one
- Cancellation, renewal, receipt, failed-payment, and refund processes tested
- Payment link returns to the approved onboarding path

## Gate 3: Founding Fulfillment

- One-location access checklist approved
- 30-day foundation workflow documented
- Form-lead routing and email acknowledgment tested
- Review requests remain neutral and email-only
- Website deployment checklist verified
- Monthly evidence report template approved
- Day-90 scorecard template approved
- Fulfillment time logged by task and client

A2P registration, automated SMS, missed-call text-back, and STOP handling are a separate future gate. They do not block the email-first founding launch.

## Gate 4: Controlled Dry Run

Run an internal fixture client through:

1. Prospect record and sourced Revenue Leak Snapshot
2. Permission-based snapshot email
3. Click and unsubscribe tracking
4. Booking
5. Agreement
6. Stripe test recurring payment
7. Secure onboarding
8. Asset upload
9. Website generation, approval, and QA
10. Form-lead routing and email acknowledgment
11. Eligible review-request email and opt-out
12. Monthly evidence report
13. Cancellation and website-export scenario

Every failed step gets an owner, fix, fallback, and passing retest. No real prospect receives an email during the dry run.

## Gate 5: Founder-Led HVAC Pilot

### Target

- 50 established, owner-operated, non-franchise HVAC companies
- One Austin-area cluster: Austin, Round Rock, Cedar Park, Leander, Georgetown, and Pflugerville
- Publicly observed or provider-sourced business email only
- Valid website and Google Business Profile evidence
- Capacity and service-quality red flags reviewed manually

### Batches

- Batch 0: internal delivery tests only
- Batch 1: 5 manually approved prospects
- Batch 2: next 10 only after delivery, bounce, reply, complaint, and opt-out review
- Remaining prospects: release in controlled batches of 10 to 15

Stop sending if hard bounces exceed 2%, any complaint appears, the unsubscribe path fails, the monitored Reply-To fails, or the email renders without the required postal footer.

### First Touch

The email asks permission to send a short Revenue Leak Snapshot. It does not attach an unsolicited audit, use fabricated scarcity, or promise revenue.

**Subject:** Quick question about [Business Name]

Hi [First Name],

I was reviewing established HVAC companies in [City] and noticed [one factual, publicly observable issue].

I put together a short Revenue Leak Snapshot covering the customer path, review recency, and follow-up risks I could verify from public sources.

Would it be useful if I sent it over?

Diego Campos
Booked Out, a brand of ICDC Ventures LLC
hello@trybookedout.com
1309 Coffeen Avenue, Suite 1200, Sheridan, Wyoming 82801
[Working unsubscribe link]

### Snapshot Delivery

If the owner says yes, send three to five sourced observations, label unknowns as unknown, explain the likely customer impact without asserting lost revenue, and offer a 15-minute review through `/go/book`.

### Fit Call

Qualify business legitimacy, operational capacity, response ownership, job volume, access readiness, and willingness to provide lead-status feedback before presenting the $499 founding offer.

Do not send a payment link before agreement review and fit confirmation.

## Deferred Work

Do not launch high-volume automation, paid ads, affiliate recruitment, automated SMS, an AI receptionist, or automated domain provisioning before the first three paying clients establish fulfillment economics and proof.
