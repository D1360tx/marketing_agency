// Reserved, authenticated-operator-only QA cohort. Never infer this mode from
// public intake fields. The persisted, owner-scoped prospect is authoritative.
export const SYNTHETIC_HANDOFF_SOURCE = "Synthetic Handoff QA - No Notifications";
export const SYNTHETIC_HANDOFF_NAME = "TEST ONLY - Booked Out Synthetic Handoff";
export const SYNTHETIC_HANDOFF_EMAIL = "bookedout-handoff@example.invalid";

export function isSyntheticHandoffProspect(prospect: {
  source?: unknown; business_name?: unknown; email?: unknown; phone?: unknown;
}): boolean {
  return prospect.source === SYNTHETIC_HANDOFF_SOURCE
    && prospect.business_name === SYNTHETIC_HANDOFF_NAME
    && prospect.email === SYNTHETIC_HANDOFF_EMAIL
    && !prospect.phone;
}
