import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityType =
  | "created"
  | "status_changed"
  | "notes_updated"
  | "analyzed"
  | "email_sent"
  | "sms_sent"
  | "email_found"
  | "score_updated";

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    prospect_id: string;
    user_id: string;
    activity_type: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("prospect_activities").insert({
    prospect_id: params.prospect_id,
    user_id: params.user_id,
    activity_type: params.activity_type,
    description: params.description,
    metadata: params.metadata || {},
  });

  if (error) {
    console.error("Failed to log activity:", error);
  }
}
