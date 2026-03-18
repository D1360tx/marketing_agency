-- Fix: Enable RLS on public.watchlist_items
-- Table was created without RLS, flagged by Supabase Security Advisor

ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to their own rows
-- Adjust user_id column name if yours is different (e.g. created_by, owner_id)
CREATE POLICY "Users can manage their own watchlist items"
  ON public.watchlist_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- If this is a single-tenant app (no per-user data isolation needed),
-- use this instead of the policy above:
-- CREATE POLICY "Authenticated users can access all watchlist items"
--   ON public.watchlist_items
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
