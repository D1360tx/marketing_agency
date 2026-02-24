-- Add Gemini API key column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
