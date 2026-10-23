# Ad Tracking Setup (trybookedout.com)

The homepage (`/`, served by `src/app/landing_v2`) ships with first-party attribution and conversion tracking. Every tag is off until its environment variable is set in Vercel, so the code is safe to deploy before the accounts exist.

## What happens on a visit

1. `captureAttribution()` (`src/lib/attribution.ts`) saves UTMs and click IDs (`fbclid`, `gclid`, `gbraid`, `wbraid`, `msclkid`) as first touch and last touch in localStorage. Other query parameters are never stored.
2. If the visit has an `fbclid`, the `_fbc` cookie is set in Meta's format so server events match the ad click even when the pixel is blocked.
3. The Meta Pixel and Google tag load from `src/components/marketing-tags.tsx` and fire PageView.

## What happens on an audit-form submit

1. The browser creates one `eventId` and sends it to `/api/leads/inbound` with the click IDs, `_fbp`, `_fbc`, GA client ID and page URL.
2. The server saves source, campaign, click IDs and the event ID in the lead's CRM notes.
3. After responding, the server sends a **Lead** event to the Meta Conversions API with hashed email, phone, name, city and state, plus IP, user agent, `_fbc` and `_fbp` (`src/lib/meta-capi.ts`).
4. On success, the browser fires Pixel **Lead** with the same `eventId`, so Meta deduplicates the pair; GA4 `generate_lead`; and, if configured, the Google Ads conversion with enhanced-conversion user data.

Phone and "Book a call" clicks send Pixel **Contact** and GA4 `phone_click` / `book_call_click`.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where to find it | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Events Manager → Data sources → your dataset ID | Pixel + CAPI |
| `META_CAPI_ACCESS_TOKEN` | Events Manager → dataset → Settings → Conversions API → Generate access token. Server-only. | CAPI |
| `META_TEST_EVENT_CODE` | Events Manager → Test events. Set only while testing, then delete. | Testing |
| `META_GRAPH_API_VERSION` | Optional. Defaults to `v24.0`; set to a current Graph API version if Meta deprecates it. | CAPI |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 → Admin → Data streams → Measurement ID (`G-…`) | GA4 |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads → Goals → Conversions → tag setup (`AW-…`) | Google Ads |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` | The label after the slash in the conversion's `send_to` value | Google Ads lead conversion |
| `BOOKED_OUT_BOOKING_URL` | Your HighLevel calendar booking link | "Book a call" buttons |

`NEXT_PUBLIC_*` values are read at build time, so redeploy after changing them. Until `BOOKED_OUT_BOOKING_URL` is set, the booking buttons fall back to calling (737) 260-5332.

In Google Ads, turn on enhanced conversions for the lead conversion action (Goals → Settings → Enhanced conversions → Google tag).

## Verify after setting the variables

1. Set `META_TEST_EVENT_CODE`, redeploy, open `https://trybookedout.com/?utm_source=test&fbclid=test123`.
2. Submit the audit form with real-looking test details.
3. Events Manager → Test events should show **Lead** twice (Browser and Server) marked **Deduplicated**.
4. The new lead's notes in `/app/leads` should show `Attribution (last touch): source=test` and the click ID.
5. GA4 → Realtime should show `generate_lead`; Google Ads → Conversions → diagnostics should show the tag firing.
6. Remove `META_TEST_EVENT_CODE` and redeploy.

## Next phase: booked and paid events

Booked and paid events come from the CRM, not the website. Once the new HighLevel account is live, add workflow actions that send **Schedule** (appointment booked) and **Purchase** (paid, with value) to Meta CAPI and upload the stored `gclid` as an offline conversion in Google Ads. The click IDs saved on each lead are what make that matching possible.
