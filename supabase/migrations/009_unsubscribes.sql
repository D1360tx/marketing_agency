-- Unsubscribe tracking for CAN-SPAM compliance

CREATE TABLE IF NOT EXISTS unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

-- RLS: users can read their own unsubscribes
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own unsubscribes"
  ON unsubscribes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unsubscribes"
  ON unsubscribes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public insert policy for the unsubscribe endpoint (uses service role or anon with token verification)
CREATE POLICY "Allow public unsubscribe inserts"
  ON unsubscribes FOR INSERT
  WITH CHECK (true);
