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
