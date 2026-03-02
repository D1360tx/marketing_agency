-- Click tracking table
CREATE TABLE tracked_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('campaign', 'drip')),
  message_id UUID NOT NULL, -- campaign_messages.id or drip_messages.id
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Open tracking table
CREATE TABLE tracked_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('campaign', 'drip')),
  message_id UUID NOT NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- RLS
ALTER TABLE tracked_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clicks" ON tracked_clicks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for tracking" ON tracked_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own opens" ON tracked_opens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for tracking" ON tracked_opens
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_tracked_clicks_message ON tracked_clicks (message_type, message_id);
CREATE INDEX idx_tracked_clicks_user ON tracked_clicks (user_id, clicked_at);
CREATE INDEX idx_tracked_opens_message ON tracked_opens (message_type, message_id);
CREATE INDEX idx_tracked_opens_user ON tracked_opens (user_id, opened_at);

-- Daily analytics materialized view (optional optimization for large datasets)
CREATE INDEX idx_campaign_messages_status ON campaign_messages (status);
CREATE INDEX idx_drip_messages_status ON drip_messages (status);
