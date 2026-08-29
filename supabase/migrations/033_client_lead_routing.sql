-- Tenant-safe client website lead capture and auditable, retryable email routing.
-- Migration 032 is intentionally reserved by another branch.

ALTER TABLE public.client_onboarding
  ADD COLUMN IF NOT EXISTS lead_capture_token text,
  ADD COLUMN IF NOT EXISTS lead_capture_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_notification_email text,
  ADD COLUMN IF NOT EXISTS lead_capture_allowed_origin text NOT NULL DEFAULT 'same-origin',
  ADD COLUMN IF NOT EXISTS lead_capture_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_capture_token_rotated_at timestamptz;

UPDATE public.client_onboarding
SET lead_capture_token = encode(gen_random_bytes(32), 'hex')
WHERE lead_capture_token IS NULL;

ALTER TABLE public.client_onboarding
  ALTER COLUMN lead_capture_token SET DEFAULT encode(gen_random_bytes(32), 'hex'),
  ALTER COLUMN lead_capture_token SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_onboarding_lead_capture_token_hex'
      AND conrelid = 'public.client_onboarding'::regclass
  ) THEN
    ALTER TABLE public.client_onboarding
      ADD CONSTRAINT client_onboarding_lead_capture_token_hex
      CHECK (lead_capture_token ~ '^[0-9a-f]{64}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_onboarding_lead_notification_email_length'
      AND conrelid = 'public.client_onboarding'::regclass
  ) THEN
    ALTER TABLE public.client_onboarding
      ADD CONSTRAINT client_onboarding_lead_notification_email_length
      CHECK (lead_notification_email IS NULL OR char_length(lead_notification_email) BETWEEN 3 AND 254);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_onboarding_lead_capture_allowed_origin'
      AND conrelid = 'public.client_onboarding'::regclass
  ) THEN
    ALTER TABLE public.client_onboarding
      ADD CONSTRAINT client_onboarding_lead_capture_allowed_origin
      CHECK (
        lead_capture_allowed_origin = 'same-origin'
        OR lead_capture_allowed_origin ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'
      );
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_onboarding_lead_capture_token
  ON public.client_onboarding(lead_capture_token);

CREATE TABLE IF NOT EXISTS public.client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid NOT NULL REFERENCES public.client_onboarding(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL,
  duplicate_hash text NOT NULL CHECK (duplicate_hash ~ '^[0-9a-f]{64}$'),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 32),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  service text NOT NULL CHECK (char_length(service) BETWEEN 1 AND 120),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 2000),
  owner_notification_status text NOT NULL DEFAULT 'pending',
  acknowledgment_status text NOT NULL DEFAULT 'pending',
  owner_notification_attempted_at timestamptz,
  owner_notification_accepted_at timestamptz,
  owner_notification_delivered_at timestamptz,
  acknowledgment_attempted_at timestamptz,
  acknowledgment_accepted_at timestamptz,
  acknowledgment_delivered_at timestamptz,
  owner_notification_attempt_count integer NOT NULL DEFAULT 0,
  acknowledgment_attempt_count integer NOT NULL DEFAULT 0,
  owner_notification_next_attempt_at timestamptz,
  acknowledgment_next_attempt_at timestamptz,
  owner_notification_provider_id text,
  acknowledgment_provider_id text,
  owner_notification_error_code text CHECK (char_length(owner_notification_error_code) <= 80),
  acknowledgment_error_code text CHECK (char_length(acknowledgment_error_code) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (onboarding_id, submission_id)
);

-- Keep this migration safe to rerun after an interrupted manual application.
ALTER TABLE public.client_leads
  ADD COLUMN IF NOT EXISTS owner_notification_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notification_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledgment_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledgment_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notification_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acknowledgment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_notification_next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledgment_next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notification_provider_id text,
  ADD COLUMN IF NOT EXISTS acknowledgment_provider_id text;

ALTER TABLE public.client_leads
  DROP CONSTRAINT IF EXISTS client_leads_owner_notification_status_check,
  DROP CONSTRAINT IF EXISTS client_leads_acknowledgment_status_check;
ALTER TABLE public.client_leads
  ADD CONSTRAINT client_leads_owner_notification_status_check
    CHECK (owner_notification_status IN ('pending', 'sending', 'accepted', 'delivered', 'failed')),
  ADD CONSTRAINT client_leads_acknowledgment_status_check
    CHECK (acknowledgment_status IN ('pending', 'sending', 'accepted', 'delivered', 'failed')),
  DROP CONSTRAINT IF EXISTS client_leads_owner_notification_attempt_count_check,
  DROP CONSTRAINT IF EXISTS client_leads_acknowledgment_attempt_count_check,
  ADD CONSTRAINT client_leads_owner_notification_attempt_count_check
    CHECK (owner_notification_attempt_count BETWEEN 0 AND 5),
  ADD CONSTRAINT client_leads_acknowledgment_attempt_count_check
    CHECK (acknowledgment_attempt_count BETWEEN 0 AND 5);

CREATE INDEX IF NOT EXISTS idx_client_leads_owner_created
  ON public.client_leads(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_leads_onboarding_created
  ON public.client_leads(onboarding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_leads_recent_duplicate
  ON public.client_leads(onboarding_id, duplicate_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_leads_retry_queue
  ON public.client_leads(updated_at)
  WHERE owner_notification_status IN ('pending', 'sending', 'failed')
     OR acknowledgment_status IN ('pending', 'sending', 'failed');

ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_leads_owner_select" ON public.client_leads;
DROP POLICY IF EXISTS "client_leads_owner_insert" ON public.client_leads;
DROP POLICY IF EXISTS "client_leads_owner_update" ON public.client_leads;
DROP POLICY IF EXISTS "client_leads_owner_delete" ON public.client_leads;
REVOKE ALL ON TABLE public.client_leads FROM anon, authenticated;
GRANT SELECT ON TABLE public.client_leads TO authenticated;

CREATE POLICY "client_leads_owner_select"
  ON public.client_leads
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.client_onboarding AS owned_onboarding
      WHERE owned_onboarding.id = client_leads.onboarding_id
        AND owned_onboarding.user_id = auth.uid()
    )
  );

-- A channel claim is one atomic UPDATE. Stale sending claims can be recovered,
-- while accepted/delivered channels and exhausted attempts can never be reclaimed.
CREATE OR REPLACE FUNCTION public.claim_client_lead_delivery(
  p_lead_id uuid,
  p_channel text,
  p_stale_after_seconds integer DEFAULT 900
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claimed_count integer;
BEGIN
  IF p_channel NOT IN ('owner', 'ack') OR p_stale_after_seconds < 60 THEN
    RAISE EXCEPTION 'invalid client lead delivery claim';
  END IF;

  UPDATE public.client_leads
  SET
    owner_notification_status = CASE WHEN p_channel = 'owner' THEN 'sending' ELSE owner_notification_status END,
    acknowledgment_status = CASE WHEN p_channel = 'ack' THEN 'sending' ELSE acknowledgment_status END,
    owner_notification_attempted_at = CASE WHEN p_channel = 'owner' THEN now() ELSE owner_notification_attempted_at END,
    acknowledgment_attempted_at = CASE WHEN p_channel = 'ack' THEN now() ELSE acknowledgment_attempted_at END,
    owner_notification_attempt_count = CASE WHEN p_channel = 'owner' THEN owner_notification_attempt_count + 1 ELSE owner_notification_attempt_count END,
    acknowledgment_attempt_count = CASE WHEN p_channel = 'ack' THEN acknowledgment_attempt_count + 1 ELSE acknowledgment_attempt_count END,
    owner_notification_next_attempt_at = CASE WHEN p_channel = 'owner' THEN NULL ELSE owner_notification_next_attempt_at END,
    acknowledgment_next_attempt_at = CASE WHEN p_channel = 'ack' THEN NULL ELSE acknowledgment_next_attempt_at END,
    owner_notification_error_code = CASE WHEN p_channel = 'owner' THEN NULL ELSE owner_notification_error_code END,
    acknowledgment_error_code = CASE WHEN p_channel = 'ack' THEN NULL ELSE acknowledgment_error_code END,
    updated_at = now()
  WHERE id = p_lead_id
    AND (
      (p_channel = 'owner'
        AND owner_notification_attempt_count < 5
        AND (
          owner_notification_status = 'pending'
          OR (owner_notification_status = 'failed' AND COALESCE(owner_notification_next_attempt_at, now()) <= now())
          OR (owner_notification_status = 'sending' AND owner_notification_attempted_at < now() - make_interval(secs => p_stale_after_seconds))
        ))
      OR
      (p_channel = 'ack'
        AND acknowledgment_attempt_count < 5
        AND (
          acknowledgment_status = 'pending'
          OR (acknowledgment_status = 'failed' AND COALESCE(acknowledgment_next_attempt_at, now()) <= now())
          OR (acknowledgment_status = 'sending' AND acknowledgment_attempted_at < now() - make_interval(secs => p_stale_after_seconds))
        ))
    );
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count = 1;
END;
$$;

-- Provider acceptance is audited separately from webhook-confirmed delivery.
CREATE OR REPLACE FUNCTION public.complete_client_lead_delivery(
  p_lead_id uuid,
  p_channel text,
  p_status text,
  p_provider_id text DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_next_attempt_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  completed_count integer;
BEGIN
  IF p_channel NOT IN ('owner', 'ack') OR p_status NOT IN ('accepted', 'failed') THEN
    RAISE EXCEPTION 'invalid client lead delivery completion';
  END IF;

  UPDATE public.client_leads
  SET
    owner_notification_status = CASE WHEN p_channel = 'owner' THEN p_status ELSE owner_notification_status END,
    acknowledgment_status = CASE WHEN p_channel = 'ack' THEN p_status ELSE acknowledgment_status END,
    owner_notification_accepted_at = CASE WHEN p_channel = 'owner' AND p_status = 'accepted' THEN now() ELSE owner_notification_accepted_at END,
    acknowledgment_accepted_at = CASE WHEN p_channel = 'ack' AND p_status = 'accepted' THEN now() ELSE acknowledgment_accepted_at END,
    owner_notification_provider_id = CASE WHEN p_channel = 'owner' THEN p_provider_id ELSE owner_notification_provider_id END,
    acknowledgment_provider_id = CASE WHEN p_channel = 'ack' THEN p_provider_id ELSE acknowledgment_provider_id END,
    owner_notification_error_code = CASE WHEN p_channel = 'owner' THEN p_error_code ELSE owner_notification_error_code END,
    acknowledgment_error_code = CASE WHEN p_channel = 'ack' THEN p_error_code ELSE acknowledgment_error_code END,
    owner_notification_next_attempt_at = CASE WHEN p_channel = 'owner' THEN p_next_attempt_at ELSE owner_notification_next_attempt_at END,
    acknowledgment_next_attempt_at = CASE WHEN p_channel = 'ack' THEN p_next_attempt_at ELSE acknowledgment_next_attempt_at END,
    updated_at = now()
  WHERE id = p_lead_id
    AND ((p_channel = 'owner' AND owner_notification_status = 'sending')
      OR (p_channel = 'ack' AND acknowledgment_status = 'sending'));
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  RETURN completed_count = 1;
END;
$$;

-- Serialize content deduplication per client/hash so concurrent requests with
-- different browser-generated submission IDs still create only one lead.
CREATE OR REPLACE FUNCTION public.create_or_get_client_lead(
  p_onboarding_id uuid,
  p_owner_user_id uuid,
  p_submission_id uuid,
  p_duplicate_hash text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_city text,
  p_service text,
  p_details text,
  p_duplicate_window_seconds integer DEFAULT 900
)
RETURNS TABLE(lead_id uuid, duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_id uuid;
  was_duplicate boolean := false;
BEGIN
  IF p_duplicate_hash !~ '^[0-9a-f]{64}$'
     OR p_duplicate_window_seconds < 60
     OR p_duplicate_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid client lead creation request';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.client_onboarding AS onboarding
    WHERE onboarding.id = p_onboarding_id
      AND onboarding.user_id = p_owner_user_id
      AND onboarding.lead_capture_enabled = true
      AND onboarding.lead_capture_revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'client lead routing is unavailable';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_onboarding_id::text || ':' || p_duplicate_hash, 0)
  );

  SELECT lead.id INTO existing_id
  FROM public.client_leads AS lead
  WHERE lead.onboarding_id = p_onboarding_id
    AND (
      lead.submission_id = p_submission_id
      OR (
        lead.duplicate_hash = p_duplicate_hash
        AND lead.created_at >= now() - make_interval(secs => p_duplicate_window_seconds)
      )
    )
  ORDER BY (lead.submission_id = p_submission_id) DESC, lead.created_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_id, true;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.client_leads (
      onboarding_id, owner_user_id, submission_id, duplicate_hash,
      full_name, email, phone, city, service, details
    ) VALUES (
      p_onboarding_id, p_owner_user_id, p_submission_id, p_duplicate_hash,
      p_full_name, p_email, p_phone, p_city, p_service, p_details
    )
    RETURNING id INTO existing_id;
  EXCEPTION WHEN unique_violation THEN
    was_duplicate := true;
    SELECT lead.id INTO existing_id
    FROM public.client_leads AS lead
    WHERE lead.onboarding_id = p_onboarding_id
      AND lead.submission_id = p_submission_id
    LIMIT 1;
  END;

  IF existing_id IS NULL THEN
    RAISE EXCEPTION 'client lead could not be created';
  END IF;
  RETURN QUERY SELECT existing_id, was_duplicate;
END;
$$;

-- Return only retryable rows. Exhausted, not-yet-due, disabled, and revoked
-- routes never occupy the bounded cron candidate window.
CREATE OR REPLACE FUNCTION public.list_client_lead_retry_candidates(
  p_limit integer DEFAULT 50,
  p_stale_after_seconds integer DEFAULT 900
)
RETURNS SETOF public.client_leads
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lead.*
  FROM public.client_leads AS lead
  JOIN public.client_onboarding AS onboarding ON onboarding.id = lead.onboarding_id
  WHERE p_limit BETWEEN 1 AND 100
    AND p_stale_after_seconds >= 60
    AND onboarding.lead_capture_enabled = true
    AND onboarding.lead_capture_revoked_at IS NULL
    AND onboarding.lead_notification_email IS NOT NULL
    AND (
      (lead.owner_notification_attempt_count < 5 AND (
        lead.owner_notification_status = 'pending'
        OR (lead.owner_notification_status = 'failed' AND COALESCE(lead.owner_notification_next_attempt_at, now()) <= now())
        OR (lead.owner_notification_status = 'sending' AND lead.owner_notification_attempted_at < now() - make_interval(secs => p_stale_after_seconds))
      ))
      OR
      (lead.acknowledgment_attempt_count < 5 AND (
        lead.acknowledgment_status = 'pending'
        OR (lead.acknowledgment_status = 'failed' AND COALESCE(lead.acknowledgment_next_attempt_at, now()) <= now())
        OR (lead.acknowledgment_status = 'sending' AND lead.acknowledgment_attempted_at < now() - make_interval(secs => p_stale_after_seconds))
      ))
    )
  ORDER BY lead.updated_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.claim_client_lead_delivery(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_client_lead_delivery(uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_or_get_client_lead(uuid, uuid, uuid, text, text, text, text, text, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_client_lead_retry_candidates(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_client_lead_delivery(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_client_lead_delivery(uuid, text, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_or_get_client_lead(uuid, uuid, uuid, text, text, text, text, text, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_client_lead_retry_candidates(integer, integer) TO service_role;
