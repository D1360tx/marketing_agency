-- Fix overly permissive RLS on generated_sites
-- The "Public can read by share_token" policy used USING (true) which allowed
-- anyone with the Supabase anon key to read ALL generated sites via direct API calls.
-- Token enforcement now happens exclusively at the app layer (in /api/preview/[token]).

DROP POLICY IF EXISTS "Public can read by share_token" ON generated_sites;

-- Ensure the user-scoped read policy exists (created in 012 but making it idempotent)
DROP POLICY IF EXISTS "Users can read own sites" ON generated_sites;

CREATE POLICY "Users can read own sites"
  ON generated_sites FOR SELECT
  USING (auth.uid() = user_id);
