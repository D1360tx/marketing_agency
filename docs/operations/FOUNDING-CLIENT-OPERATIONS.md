# Founding Client Operations Runbook

Use this process for Booked Out's first one or two paid clients. The goal is reliable fulfillment without building a temporary CRM before moving to GoHighLevel.

## Operating model

- Booked Out remains the source of truth for website lead intake and contact details.
- The operations workbook tracks fulfillment state and business outcomes only. Do not copy phone numbers, email addresses, message bodies, or other unnecessary PII into it.
- One client gets one tenant-specific endpoint, one exact allowed origin, and one verified recipient.
- No SMS is sent unless a separate consent-aware implementation is approved.

## Daily lead routine

1. Open **Website Leads** and select each active client.
2. Reconcile every new lead into the workbook by immutable `lead_id`.
3. Contact the lead using the client-approved process.
4. Update `contact_status`, `first_contacted_at`, `appointment_status`, and `outcome`.
5. Escalate any failed owner or acknowledgment email immediately.
6. Never mark a lead contacted, booked, or won without a real client confirmation.

## Weekly client review

- Reconcile lead count between Booked Out and the workbook.
- Review uncontacted leads and leads without an outcome.
- Confirm appointments, wins, losses, and revenue values with the client.
- Record one prioritized conversion improvement and its owner.
- Check the client endpoint, exact origin, owner recipient, and website form.

## Monthly evidence report

1. Freeze the reporting month in the workbook.
2. Reconcile totals against Website Leads.
3. Populate `MONTHLY-EVIDENCE-REPORT-TEMPLATE.md`.
4. Label unknown or client-unconfirmed values as **Not confirmed**; never convert them to zero.
5. Save the final report with the client ID and month.
6. Record `report_sent_at` only after delivery is confirmed.

## Cancellation and export

- Follow `CANCELLATION-OFFBOARDING-CHECKLIST.md` for every cancellation.
- Follow `WEBSITE-EXPORT-PROCEDURE.md` only after eligibility and account standing are verified.
- Do not delete client data as part of cancellation. Retention or deletion requires a separate documented decision.

## GoHighLevel migration triggers

Begin migration when any trigger is met:

- Two paying clients are active.
- Combined website intake reaches 25–50 leads per month.
- Manual operations exceed two hours per week.
- A lead is missed because of the manual process.

## GHL-compatible field contract

Keep these values stable so migration is mechanical:

| Booked Out field | Interim source | Future GHL target |
|---|---|---|
| `client_id` | client onboarding UUID | Location/sub-account external ID |
| `lead_id` | client lead UUID | Contact custom field: Booked Out Lead ID |
| `submission_id` | public intake UUID | Contact custom field: Submission ID |
| `source` | website/form identifier | Contact source |
| `contact_status` | operations workbook | Opportunity stage |
| `appointment_status` | client confirmation | Appointment/opportunity field |
| `outcome` | client confirmation | Opportunity status/lost reason |
| `opportunity_value` | client estimate | Opportunity value |
| `won_revenue` | client-confirmed value | Won opportunity value |
| `consent_email_at` | intake evidence if collected | Contact custom field |
| `consent_sms_at` | separate affirmative evidence only | Contact custom field |

## Migration method

1. Create the GHL location, fields, pipeline, and disabled workflows.
2. Send new leads to GHL in shadow mode while Booked Out remains authoritative.
3. Reconcile contact and opportunity IDs for at least seven days.
4. Enable one acknowledgment/notification owner at a time; never let both systems send the same message.
5. Switch the source of truth only after count, field, consent, and workflow-log verification.
6. Retain Booked Out receipts for rollback, then retire the custom email/reporting components after 30 stable days.
