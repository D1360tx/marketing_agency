-- Add Brave API key to user settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS brave_api_key TEXT;
