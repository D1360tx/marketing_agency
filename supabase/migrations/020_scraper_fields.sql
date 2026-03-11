-- Migration 020: Add scraper enrichment fields to prospects table
-- Adds social media links, hours, owner_name from Google Maps deep scraper

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS yelp TEXT,
  ADD COLUMN IF NOT EXISTS hours TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_score_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
