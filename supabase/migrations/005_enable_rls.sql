-- Enable RLS on all tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies: each user can only see/modify their own data
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
