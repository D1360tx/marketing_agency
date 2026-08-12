-- Create campaigns and recipient messages in one authenticated transaction.
-- Any invalid, foreign, duplicate, or non-contactable recipient aborts the call.

CREATE OR REPLACE FUNCTION public.create_campaign_with_recipients(
  p_name text,
  p_type text,
  p_subject_template text,
  p_body_template text,
  p_recipient_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_campaign_id uuid;
  v_valid_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_type NOT IN ('email', 'sms') THEN
    RAISE EXCEPTION 'Unsupported campaign type';
  END IF;
  IF cardinality(p_recipient_ids) < 1 OR cardinality(p_recipient_ids) > 100 THEN
    RAISE EXCEPTION 'Choose between 1 and 100 recipients';
  END IF;
  IF cardinality(p_recipient_ids) <> (
    SELECT count(DISTINCT recipient_id)
    FROM unnest(p_recipient_ids) AS recipient_id
  ) THEN
    RAISE EXCEPTION 'Duplicate recipients are not allowed';
  END IF;

  SELECT count(*)
  INTO v_valid_count
  FROM public.prospects
  WHERE user_id = v_user_id
    AND id = ANY(p_recipient_ids)
    AND (
      (p_type = 'email' AND email IS NOT NULL AND btrim(email) <> '')
      OR
      (p_type = 'sms' AND phone IS NOT NULL AND btrim(phone) <> '' AND sms_consent_at IS NOT NULL)
    );

  IF v_valid_count <> cardinality(p_recipient_ids) THEN
    RAISE EXCEPTION 'One or more recipients are unavailable or lack required contact consent';
  END IF;

  INSERT INTO public.campaigns (
    user_id,
    name,
    type,
    subject_template,
    body_template,
    status
  )
  VALUES (
    v_user_id,
    p_name,
    p_type,
    NULLIF(p_subject_template, ''),
    p_body_template,
    'draft'
  )
  RETURNING id INTO v_campaign_id;

  INSERT INTO public.campaign_messages (
    campaign_id,
    prospect_id,
    channel,
    to_address,
    subject,
    body,
    status
  )
  SELECT
    v_campaign_id,
    id,
    p_type,
    CASE WHEN p_type = 'email' THEN email ELSE phone END,
    CASE WHEN p_type = 'email' THEN NULLIF(p_subject_template, '') ELSE NULL END,
    p_body_template,
    'pending'
  FROM public.prospects
  WHERE user_id = v_user_id
    AND id = ANY(p_recipient_ids);

  RETURN v_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_campaign_with_recipients(text, text, text, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_campaign_with_recipients(text, text, text, text, uuid[]) TO authenticated;
