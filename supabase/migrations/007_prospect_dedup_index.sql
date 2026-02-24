-- Add composite unique index to prevent duplicate prospects per user
-- Deduplication key: (user_id, business_name, phone) OR (user_id, business_name, website_url)
-- Using partial unique indexes since phone/website_url can be NULL

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_dedup_phone
  ON prospects (user_id, lower(business_name), phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_dedup_website
  ON prospects (user_id, lower(business_name), website_url)
  WHERE website_url IS NOT NULL;
