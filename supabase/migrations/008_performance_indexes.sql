-- Performance indexes for common query patterns

-- Campaign messages: fetching by campaign + filtering by status
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_status
  ON campaign_messages (campaign_id, status);

-- Website analyses: lookup by prospect
CREATE INDEX IF NOT EXISTS idx_website_analyses_prospect
  ON website_analyses (prospect_id);

-- Prospects: user's leads sorted by score
CREATE INDEX IF NOT EXISTS idx_prospects_user_score
  ON prospects (user_id, lead_score DESC NULLS LAST);
