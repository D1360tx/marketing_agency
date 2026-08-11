-- Reserve approved campaign messages before contacting the provider so concurrent
-- requests cannot send the same row twice.

ALTER TABLE public.campaign_messages
  DROP CONSTRAINT IF EXISTS campaign_messages_status_check;

ALTER TABLE public.campaign_messages
  ADD CONSTRAINT campaign_messages_status_check
  CHECK (status IN (
    'pending', 'sending', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed'
  ));
