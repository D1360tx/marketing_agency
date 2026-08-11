import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
const ownerId = required("BOOKED_OUT_OWNER_USER_ID");
const sequenceId = required("BOOKED_OUT_DEFAULT_SEQUENCE_ID");
const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const desired = [
  {
    step_order: 1,
    delay_days: 0,
    subject_template: "We received your Booked Out audit request",
    body_template: "Thanks for requesting a Booked Out audit for {{business_name}}. We are reviewing the available public source data and will email the priorities we can support. If you want to choose a review time now, use {{booking_url}}.",
  },
  {
    step_order: 2,
    delay_days: 2,
    subject_template: "Choose a time to review {{business_name}}",
    body_template: "A short review call is the fastest way to compare the audit priorities with your current process. Choose a time at {{booking_url}}. There is no obligation, and we do not guarantee calls, rankings, reviews, jobs, or revenue.",
  },
  {
    step_order: 3,
    delay_days: 3,
    subject_template: "Should we close your audit request?",
    body_template: "I do not want to crowd your inbox. If you still want to review the priorities for {{business_name}}, choose a time at {{booking_url}}. Otherwise, no action is needed and this audit follow-up will end here.",
  },
];

const { data: existingSequence, error: sequenceLookupError } = await supabase
  .from("drip_sequences")
  .select("id,user_id,name,status")
  .eq("id", sequenceId)
  .maybeSingle();
if (sequenceLookupError) throw sequenceLookupError;
if (existingSequence && existingSequence.user_id !== ownerId) {
  throw new Error("Configured sequence belongs to a different owner; refusing to modify it");
}

if (!existingSequence) {
  const { error } = await supabase.from("drip_sequences").insert({
    id: sequenceId,
    user_id: ownerId,
    name: "Booked Out Inbound Audit Follow-up",
    description: "Approved email-only follow-up for requested sourced audits. No cold SMS.",
    channel: "email",
    status: "active",
  });
  if (error) throw error;
} else {
  const { error } = await supabase
    .from("drip_sequences")
    .update({
      name: "Booked Out Inbound Audit Follow-up",
      description: "Approved email-only follow-up for requested sourced audits. No cold SMS.",
      channel: "email",
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("user_id", ownerId);
  if (error) throw error;
}

const { data: existingSteps, error: stepLookupError } = await supabase
  .from("drip_steps")
  .select("id,step_order")
  .eq("sequence_id", sequenceId)
  .order("step_order");
if (stepLookupError) throw stepLookupError;
if ((existingSteps?.length || 0) > desired.length) {
  throw new Error("Sequence has unexpected extra steps; refusing to remove or overwrite them automatically");
}

for (const step of desired) {
  const existing = existingSteps?.find((item) => item.step_order === step.step_order);
  if (existing) {
    const { error } = await supabase
      .from("drip_steps")
      .update({ ...step, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("sequence_id", sequenceId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("drip_steps").insert({
      id: crypto.randomUUID(),
      sequence_id: sequenceId,
      ...step,
    });
    if (error) throw error;
  }
}

const { data: verification, error: verificationError } = await supabase
  .from("drip_sequences")
  .select("id,name,status,channel,drip_steps(id,step_order,delay_days,subject_template)")
  .eq("id", sequenceId)
  .eq("user_id", ownerId)
  .single();
if (verificationError) throw verificationError;
console.log(JSON.stringify({ provisioned: true, sequence: verification }, null, 2));
