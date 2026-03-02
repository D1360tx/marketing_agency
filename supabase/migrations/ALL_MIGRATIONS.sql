-- ============================================
-- AgencyFlow - Complete Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  google_maps_url TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER,
  business_type TEXT,
  search_query TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','interested','client','not_interested','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_user ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(user_id, status);

-- 2. Website analyses table
CREATE TABLE IF NOT EXISTS website_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,
  has_ssl BOOLEAN,
  is_mobile_friendly BOOLEAN,
  load_time_ms INTEGER,
  has_viewport_meta BOOLEAN,
  technology_stack JSONB,
  overall_grade TEXT CHECK (overall_grade IN ('A','B','C','D','F')),
  raw_data JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_prospect ON website_analyses(prospect_id);

-- 3. Campaigns table
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

-- 4. Campaign messages table
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

-- 5. User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  outscraper_api_key TEXT,
  google_pagespeed_key TEXT,
  hunter_api_key TEXT,
  resend_api_key TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  sender_email TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable Row Level Security
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Users see own prospects" ON prospects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own analyses" ON website_analyses
  FOR ALL USING (prospect_id IN (SELECT id FROM prospects WHERE user_id = auth.uid()));

CREATE POLICY "Users see own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own messages" ON campaign_messages
  FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

CREATE POLICY "Users see own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- === New migrations (2026-03-01) ===

-- Add Brave API key to user settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS brave_api_key TEXT;

-- Drip sequence definitions
CREATE TABLE drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual steps within a drip sequence
CREATE TABLE drip_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  delay_days INTEGER NOT NULL DEFAULT 0, -- days after enrollment (step 1 = 0, step 2 = 3, etc.)
  subject_template TEXT, -- for email only
  body_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sequence_id, step_order)
);

-- Track which prospects are enrolled in which sequences
CREATE TABLE drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0, -- 0 = enrolled but hasn't received step 1 yet
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ, -- pre-calculated next send time
  completed_at TIMESTAMPTZ,
  UNIQUE (sequence_id, prospect_id) -- can't enroll same prospect twice in same sequence
);

-- Track individual drip messages sent
CREATE TABLE drip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES drip_steps(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sequences" ON drip_sequences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage steps of own sequences" ON drip_steps
  FOR ALL USING (
    sequence_id IN (SELECT id FROM drip_sequences WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own enrollments" ON drip_enrollments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drip messages" ON drip_messages
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for the drip engine query (find due messages)
CREATE INDEX idx_drip_enrollments_next_send ON drip_enrollments (next_send_at)
  WHERE status = 'active' AND next_send_at IS NOT NULL;

CREATE INDEX idx_drip_enrollments_sequence ON drip_enrollments (sequence_id, status);
CREATE INDEX idx_drip_messages_enrollment ON drip_messages (enrollment_id);
CREATE INDEX idx_drip_steps_sequence ON drip_steps (sequence_id, step_order);

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
