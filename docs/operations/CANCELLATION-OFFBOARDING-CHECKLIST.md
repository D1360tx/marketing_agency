# Cancellation and Offboarding Checklist

**Rule:** A cancellation is not complete when billing stops. It is complete only after service dates, access, routing, retention, and any eligible export are reconciled and confirmed in writing.

## 1. Intake and authority

- [ ] Save the written cancellation request.
- [ ] Record client ID, requester, request timestamp, and communication channel.
- [ ] Verify the requester is an authorized client contact.
- [ ] Acknowledge receipt without promising a final date until renewal terms are checked.

## 2. Contract and billing dates

- [ ] Confirm effective date and current paid-through date.
- [ ] Confirm the next renewal date.
- [ ] Determine the final service date under the signed agreement.
- [ ] Record whether the account is current.
- [ ] Stop or schedule the recurring charge through the actual billing provider.
- [ ] Verify the billing change by provider readback; a submitted cancellation is not enough.
- [ ] Record refund or credit decision, if any, with authority and reason.

## 3. Service shutdown plan

- [ ] Inventory website, domain, DNS, hosting, analytics, forms, email routing, integrations, and third-party licenses.
- [ ] Decide what remains active through the paid period.
- [ ] Schedule the tenant lead endpoint disablement for the final service date.
- [ ] Preserve a pre-shutdown backup.
- [ ] Remove Booked Out access from client-controlled systems when no longer required.
- [ ] Remove client access from Booked Out-controlled systems when appropriate.
- [ ] Do not delete data without a documented retention/deletion decision.

## 4. Export eligibility

- [ ] Calculate fully paid service months.
- [ ] Confirm account standing.
- [ ] Record: `eligible`, `not yet eligible`, `declined`, or `not requested`.
- [ ] If eligible and requested, follow `WEBSITE-EXPORT-PROCEDURE.md`.
- [ ] Explain exclusions: hosting, integrations, automations, third-party licenses, and reusable Booked Out systems.

## 5. Lead and reporting closeout

- [ ] Reconcile all leads through the final service date.
- [ ] Record unresolved/open outcomes as unknown, not lost or zero.
- [ ] Prepare the final monthly evidence report.
- [ ] Export tenant lead data if requested and authorized.
- [ ] Confirm the export contains only the requesting tenant's records.

## 6. Final verification

- [ ] Billing readback shows the intended state.
- [ ] Lead endpoint is disabled or revoked at the intended time.
- [ ] Website/domain state matches the written plan.
- [ ] Required backups and exports exist and pass checksum validation.
- [ ] Access changes are verified from each affected system.
- [ ] Final email states service end date, billing state, website/domain state, export status, and support contact.
- [ ] Record final confirmation timestamp and evidence links in the operations workbook.

## Minimum cancellation register fields

`client_id`, `request_received_at`, `requester`, `authorized`, `renewal_date`, `final_service_date`, `billing_action`, `billing_verified_at`, `endpoint_action`, `endpoint_verified_at`, `export_status`, `retention_decision`, `final_confirmation_sent_at`, `notes`.
