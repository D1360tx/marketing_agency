-- Activity log for prospect interactions

CREATE TABLE IF NOT EXISTS prospect_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_activities_prospect
  ON prospect_activities (prospect_id, created_at DESC);

ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activities"
  ON prospect_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON prospect_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
