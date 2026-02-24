-- Generated sites storage for sharing

CREATE TABLE IF NOT EXISTS generated_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_sites_token
  ON generated_sites (share_token);

CREATE INDEX IF NOT EXISTS idx_generated_sites_user
  ON generated_sites (user_id, created_at DESC);

ALTER TABLE generated_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sites"
  ON generated_sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites"
  ON generated_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read for share links (anyone with the token can view)
CREATE POLICY "Public can read by share_token"
  ON generated_sites FOR SELECT
  USING (true);
