-- Add webhook_url to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS webhook_url TEXT;
