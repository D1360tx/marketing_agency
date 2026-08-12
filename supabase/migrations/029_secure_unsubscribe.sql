-- Public unsubscribe callbacks are verified by the API route and written with
-- the service role. Browser clients no longer receive direct INSERT access.

DROP POLICY IF EXISTS "Allow public unsubscribe inserts" ON public.unsubscribes;
REVOKE INSERT ON TABLE public.unsubscribes FROM anon;
