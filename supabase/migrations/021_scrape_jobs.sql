-- Migration 021: scrape_jobs table for Google Maps scraper job queue

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE,
  query           TEXT NOT NULL,
  niche           TEXT,
  city            TEXT,
  limit_count     INTEGER DEFAULT 60,
  enrich          BOOLEAN DEFAULT true,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_count    INTEGER,
  error_message   TEXT,
  results         JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Index for polling (daemon fetches pending jobs)
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs (status, created_at);
-- Index for user job history
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_id ON scrape_jobs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs
CREATE POLICY "users_read_own_scrape_jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "users_insert_own_scrape_jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass (via supabaseAdmin client — no RLS needed for service role)
-- Service role inherently bypasses RLS in Supabase when using the service key.
