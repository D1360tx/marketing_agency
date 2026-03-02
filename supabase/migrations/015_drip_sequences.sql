-- Drip sequence definitions
CREATE TABLE drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual steps within a drip sequence
CREATE TABLE drip_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  delay_days INTEGER NOT NULL DEFAULT 0, -- days after enrollment (step 1 = 0, step 2 = 3, etc.)
  subject_template TEXT, -- for email only
  body_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sequence_id, step_order)
);

-- Track which prospects are enrolled in which sequences
CREATE TABLE drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0, -- 0 = enrolled but hasn't received step 1 yet
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ, -- pre-calculated next send time
  completed_at TIMESTAMPTZ,
  UNIQUE (sequence_id, prospect_id) -- can't enroll same prospect twice in same sequence
);

-- Track individual drip messages sent
CREATE TABLE drip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES drip_steps(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sequences" ON drip_sequences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage steps of own sequences" ON drip_steps
  FOR ALL USING (
    sequence_id IN (SELECT id FROM drip_sequences WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own enrollments" ON drip_enrollments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drip messages" ON drip_messages
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for the drip engine query (find due messages)
CREATE INDEX idx_drip_enrollments_next_send ON drip_enrollments (next_send_at)
  WHERE status = 'active' AND next_send_at IS NOT NULL;

CREATE INDEX idx_drip_enrollments_sequence ON drip_enrollments (sequence_id, status);
CREATE INDEX idx_drip_messages_enrollment ON drip_messages (enrollment_id);
CREATE INDEX idx_drip_steps_sequence ON drip_steps (sequence_id, step_order);
