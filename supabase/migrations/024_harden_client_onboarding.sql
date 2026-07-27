-- P0 privacy hardening for client onboarding.
-- Public form access now goes exclusively through token-validating server routes.

ALTER TABLE public.client_onboarding
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Backfill ownership where the onboarding record is linked to an existing prospect.
UPDATE public.client_onboarding AS onboarding
SET user_id = prospects.user_id
FROM public.prospects AS prospects
WHERE onboarding.prospect_id = prospects.id
  AND onboarding.user_id IS NULL;

-- Preserve unlinked records automatically only when the database has one
-- unambiguous prospect owner. Multi-tenant databases require an explicit owner.
WITH candidate_owners AS (
  SELECT DISTINCT user_id FROM public.prospects WHERE user_id IS NOT NULL
), sole_owner AS (
  SELECT max(user_id::text)::uuid AS user_id
  FROM candidate_owners
  HAVING count(*) = 1
)
UPDATE public.client_onboarding AS onboarding
SET user_id = sole_owner.user_id
FROM sole_owner
WHERE onboarding.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_onboarding_user
  ON public.client_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_expires
  ON public.client_onboarding(expires_at)
  WHERE submitted_at IS NULL AND revoked_at IS NULL;

DROP POLICY IF EXISTS "public_insert_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "public_select_own_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "auth_select_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "auth_update_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "auth_insert_onboarding" ON public.client_onboarding;
DROP POLICY IF EXISTS "auth_delete_onboarding" ON public.client_onboarding;

REVOKE ALL ON TABLE public.client_onboarding FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_onboarding TO authenticated;

CREATE POLICY "auth_select_onboarding"
  ON public.client_onboarding
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auth_insert_onboarding"
  ON public.client_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      prospect_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.prospects AS owned_prospect
        WHERE owned_prospect.id = client_onboarding.prospect_id
          AND owned_prospect.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "auth_update_onboarding"
  ON public.client_onboarding
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      prospect_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.prospects AS owned_prospect
        WHERE owned_prospect.id = client_onboarding.prospect_id
          AND owned_prospect.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "auth_delete_onboarding"
  ON public.client_onboarding
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep client assets private. Token holders upload only through the server route,
-- and authenticated staff receive short-lived signed URLs after ownership checks.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-assets',
  'onboarding-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_upload_onboarding_assets" ON storage.objects;
DROP POLICY IF EXISTS "public_read_onboarding_assets" ON storage.objects;
DROP POLICY IF EXISTS "anon_upload_onboarding_assets" ON storage.objects;
DROP POLICY IF EXISTS "anon_read_onboarding_assets" ON storage.objects;
