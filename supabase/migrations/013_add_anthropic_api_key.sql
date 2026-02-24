-- Add anthropic_api_key column to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT;
