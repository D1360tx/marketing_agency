-- Reconcile prospect workflow columns used by the canonical /app UI so a clean
-- deployment has the same schema as the current production workflow.

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS follow_up_date date,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS loss_reason text,
  ADD COLUMN IF NOT EXISTS loss_reason_detail text,
  ADD COLUMN IF NOT EXISTS deal_value numeric(12, 2),
  ADD COLUMN IF NOT EXISTS call_scheduled_at timestamptz;

ALTER TABLE public.prospects
  DROP CONSTRAINT IF EXISTS prospects_status_check;

ALTER TABLE public.prospects
  ADD CONSTRAINT prospects_status_check
  CHECK (status IN (
    'new', 'contacted', 'interested', 'follow_up', 'call_scheduled',
    'client', 'not_interested', 'lost'
  ));

CREATE INDEX IF NOT EXISTS idx_prospects_follow_up_queue
  ON public.prospects (user_id, follow_up_date)
  WHERE status = 'follow_up' AND follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prospects_call_queue
  ON public.prospects (user_id, call_scheduled_at)
  WHERE status = 'call_scheduled' AND call_scheduled_at IS NOT NULL;
