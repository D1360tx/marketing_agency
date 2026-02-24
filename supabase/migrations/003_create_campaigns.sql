-- Outreach campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email','sms')) NOT NULL,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual messages within campaigns
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  prospect_id UUID REFERENCES prospects(id) NOT NULL,
  channel TEXT CHECK (channel IN ('email','sms')) NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','opened','replied','bounced','failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON campaign_messages(status);
