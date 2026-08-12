-- Public submission abuse protection and fake-audit shutdown.
-- Apply after 023_client_onboarding.sql and 024_harden_client_onboarding.sql.

-- The old audit tool used fabricated GBP data and no longer accepts submissions.
-- Some production databases never created audit_leads, so guard the legacy cleanup.
DO $$
BEGIN
  IF to_regclass('public.audit_leads') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon insert" ON public.audit_leads';
    EXECUTE 'REVOKE ALL ON TABLE public.audit_leads FROM anon, authenticated';
  END IF;
END;
$$;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source text;

CREATE TABLE IF NOT EXISTS public.public_rate_limits (
  route text NOT NULL CHECK (char_length(route) BETWEEN 1 AND 80),
  key_hash text NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (route, key_hash, window_start)
);

ALTER TABLE public.public_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_rate_limits FROM anon, authenticated;

-- No anon/authenticated policies are created. Only the service role may call the
-- SECURITY DEFINER function below; raw IP addresses are never stored.
CREATE OR REPLACE FUNCTION public.consume_public_rate_limit(
  p_route text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_route IS NULL OR char_length(p_route) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'invalid route';
  END IF;
  IF p_key_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid key hash';
  END IF;
  IF p_limit NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'invalid limit';
  END IF;
  IF p_window_seconds NOT BETWEEN 60 AND 86400 THEN
    RAISE EXCEPTION 'invalid window';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  DELETE FROM public.public_rate_limits
  WHERE route = p_route
    AND key_hash = p_key_hash
    AND window_start < v_window_start - interval '1 day';

  INSERT INTO public.public_rate_limits (
    route,
    key_hash,
    window_start,
    request_count
  )
  VALUES (p_route, p_key_hash, v_window_start, 1)
  ON CONFLICT (route, key_hash, window_start)
  DO UPDATE SET request_count = public.public_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_rate_limit(text, text, integer, integer)
  TO service_role;

CREATE INDEX IF NOT EXISTS idx_public_rate_limits_cleanup
  ON public.public_rate_limits (window_start);
