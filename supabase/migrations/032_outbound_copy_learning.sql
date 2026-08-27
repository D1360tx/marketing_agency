-- Phase 2 compounding outbound copy learning (additive; apply separately from code).
-- This migration stores manually imported outcomes and review-only recommendations.
-- It does not send, publish, or promote copy automatically.

CREATE TABLE IF NOT EXISTS public.outbound_copy_variants (
  variant_key text PRIMARY KEY,
  cohort text NOT NULL CHECK (cohort IN ('emerging_operator', 'established_under_optimized')),
  segment text NOT NULL CHECK (segment IN ('hvac_emerging_operator', 'hvac_established_under_optimized')),
  framework_key text NOT NULL CHECK (framework_key IN ('gap_audit_direct', 'baseline_then_fix')),
  pain_angle text NOT NULL CHECK (pain_angle IN ('inquiry_followup_gap', 'mobile_web_presence_gap', 'review_request_process_gap')),
  offer text NOT NULL CHECK (offer IN ('local_call_system_499_monthly', 'free_baseline_audit')),
  proof_style text NOT NULL CHECK (proof_style IN ('observable_baseline', 'specific_gap_evidence', 'month_to_month_delivery')),
  cta_style text NOT NULL CHECK (cta_style IN ('review_audit', 'reply_for_baseline', 'book_15_minute_review')),
  subject_style text NOT NULL CHECK (subject_style IN ('business_name_question', 'local_gap', 'plain_audit')),
  length_band text NOT NULL CHECK (length_band IN ('short_60_90', 'medium_91_140')),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.outbound_copy_variants
  (variant_key, cohort, segment, framework_key, pain_angle, offer, proof_style, cta_style, subject_style, length_band)
VALUES
  ('bo2-emerging-inquiry-followup-v1', 'emerging_operator', 'hvac_emerging_operator', 'gap_audit_direct', 'inquiry_followup_gap', 'free_baseline_audit', 'specific_gap_evidence', 'review_audit', 'business_name_question', 'short_60_90'),
  ('bo2-emerging-web-gap-v1', 'emerging_operator', 'hvac_emerging_operator', 'baseline_then_fix', 'mobile_web_presence_gap', 'local_call_system_499_monthly', 'observable_baseline', 'reply_for_baseline', 'local_gap', 'medium_91_140'),
  ('bo2-emerging-review-gap-v1', 'emerging_operator', 'hvac_emerging_operator', 'gap_audit_direct', 'review_request_process_gap', 'local_call_system_499_monthly', 'month_to_month_delivery', 'book_15_minute_review', 'plain_audit', 'short_60_90'),
  ('bo2-established-inquiry-followup-v1', 'established_under_optimized', 'hvac_established_under_optimized', 'baseline_then_fix', 'inquiry_followup_gap', 'local_call_system_499_monthly', 'observable_baseline', 'review_audit', 'business_name_question', 'medium_91_140'),
  ('bo2-established-web-gap-v1', 'established_under_optimized', 'hvac_established_under_optimized', 'gap_audit_direct', 'mobile_web_presence_gap', 'free_baseline_audit', 'specific_gap_evidence', 'book_15_minute_review', 'local_gap', 'short_60_90'),
  ('bo2-established-review-gap-v1', 'established_under_optimized', 'hvac_established_under_optimized', 'baseline_then_fix', 'review_request_process_gap', 'local_call_system_499_monthly', 'month_to_month_delivery', 'reply_for_baseline', 'plain_audit', 'medium_91_140')
ON CONFLICT (variant_key) DO NOTHING;

ALTER TABLE public.campaign_messages
  ADD COLUMN IF NOT EXISTS outbound_variant_key text REFERENCES public.outbound_copy_variants(variant_key),
  ADD COLUMN IF NOT EXISTS reply_outcome text CHECK (reply_outcome IN ('positive', 'objection', 'timing', 'unsubscribe', 'irrelevant', 'unknown')),
  ADD COLUMN IF NOT EXISTS audit_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_booked_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_won_at timestamptz,
  ADD COLUMN IF NOT EXISTS complaint_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_id_user_id_unique ON public.campaigns(id, user_id);

CREATE TABLE IF NOT EXISTS public.outbound_learning_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL,
  variant_key text NOT NULL REFERENCES public.outbound_copy_variants(variant_key),
  delivered integer NOT NULL DEFAULT 0 CHECK (delivered >= 0),
  reply_positive integer NOT NULL DEFAULT 0 CHECK (reply_positive >= 0),
  reply_objection integer NOT NULL DEFAULT 0 CHECK (reply_objection >= 0),
  reply_timing integer NOT NULL DEFAULT 0 CHECK (reply_timing >= 0),
  reply_unsubscribe integer NOT NULL DEFAULT 0 CHECK (reply_unsubscribe >= 0),
  reply_irrelevant integer NOT NULL DEFAULT 0 CHECK (reply_irrelevant >= 0),
  reply_unknown integer NOT NULL DEFAULT 0 CHECK (reply_unknown >= 0),
  audits_accepted integer NOT NULL DEFAULT 0 CHECK (audits_accepted >= 0),
  meetings integer NOT NULL DEFAULT 0 CHECK (meetings >= 0),
  clients integer NOT NULL DEFAULT 0 CHECK (clients >= 0),
  complaints integer NOT NULL DEFAULT 0 CHECK (complaints >= 0),
  imported_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    reply_positive + reply_objection + reply_timing + reply_unsubscribe +
      reply_irrelevant + reply_unknown <= delivered
  ),
  CHECK (audits_accepted <= delivered),
  CHECK (meetings <= audits_accepted),
  CHECK (clients <= meetings),
  CHECK (complaints <= delivered),
  UNIQUE (campaign_id, variant_key),
  FOREIGN KEY (campaign_id, user_id) REFERENCES public.campaigns(id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.outbound_copy_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment text NOT NULL CHECK (segment IN ('hvac_emerging_operator', 'hvac_established_under_optimized')),
  framework_key text NOT NULL CHECK (framework_key IN ('gap_audit_direct', 'baseline_then_fix')),
  pain_angle text NOT NULL CHECK (pain_angle IN ('inquiry_followup_gap', 'mobile_web_presence_gap', 'review_request_process_gap')),
  winning_variant_key text NOT NULL REFERENCES public.outbound_copy_variants(variant_key),
  status text NOT NULL DEFAULT 'candidate_pending_human_review'
    CHECK (status IN ('candidate_pending_human_review', 'approved', 'retired')),
  evidence_score numeric(8,1) NOT NULL,
  campaign_count integer NOT NULL CHECK (campaign_count >= 2),
  delivered integer NOT NULL CHECK (delivered >= 75),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, segment, framework_key, pain_angle)
);

ALTER TABLE public.outbound_copy_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_learning_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_copy_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read outbound variant catalog" ON public.outbound_copy_variants;
CREATE POLICY "Authenticated users read outbound variant catalog"
  ON public.outbound_copy_variants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own outbound observations" ON public.outbound_learning_observations;
CREATE POLICY "Users manage own outbound observations"
  ON public.outbound_learning_observations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own outbound copy library" ON public.outbound_copy_library;
CREATE POLICY "Users manage own outbound copy library"
  ON public.outbound_copy_library FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.outbound_copy_variants FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.outbound_copy_variants FROM authenticated;
REVOKE ALL ON public.outbound_learning_observations, public.outbound_copy_library FROM anon;
GRANT SELECT ON public.outbound_copy_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_learning_observations, public.outbound_copy_library TO authenticated;
