-- Add lead scoring columns to prospects

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_score_breakdown JSONB DEFAULT '{}';
