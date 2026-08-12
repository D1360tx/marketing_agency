-- Secure email tracking callbacks.
-- Public routes now verify HMAC tokens and write through a constrained server path.

-- Remove replay duplicates before adding uniqueness guarantees.
DELETE FROM public.tracked_opens older
USING public.tracked_opens newer
WHERE older.message_type = newer.message_type
  AND older.message_id = newer.message_id
  AND older.opened_at > newer.opened_at;

DELETE FROM public.tracked_clicks older
USING public.tracked_clicks newer
WHERE older.message_type = newer.message_type
  AND older.message_id = newer.message_id
  AND older.url = newer.url
  AND older.clicked_at > newer.clicked_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_opens_unique_message
  ON public.tracked_opens (message_type, message_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracked_clicks_unique_message_url
  ON public.tracked_clicks (message_type, message_id, url);

DROP POLICY IF EXISTS "Allow insert for tracking" ON public.tracked_opens;
DROP POLICY IF EXISTS "Allow insert for tracking" ON public.tracked_clicks;

REVOKE INSERT ON TABLE public.tracked_opens FROM anon;
REVOKE INSERT ON TABLE public.tracked_clicks FROM anon;
REVOKE INSERT ON TABLE public.tracked_opens FROM authenticated;
REVOKE INSERT ON TABLE public.tracked_clicks FROM authenticated;
