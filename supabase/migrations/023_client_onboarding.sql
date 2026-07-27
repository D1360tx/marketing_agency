-- Client onboarding intake form
CREATE TABLE IF NOT EXISTS client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Business info
  business_name TEXT,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  -- Services
  service_areas TEXT,
  services_offered TEXT[] DEFAULT '{}',
  -- Online presence
  has_google_my_business BOOLEAN DEFAULT FALSE,
  google_my_business_url TEXT,
  existing_website TEXT,
  -- Brand & style
  brand_colors TEXT,
  style_notes TEXT,
  logo_url TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  -- Primary contact
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  preferred_contact_method TEXT,
  -- Additional
  review_process_notes TEXT,
  additional_notes TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'complete')),
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_onboarding_token ON client_onboarding(token);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_prospect ON client_onboarding(prospect_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_status ON client_onboarding(status);

-- Enable RLS
ALTER TABLE client_onboarding ENABLE ROW LEVEL SECURITY;

-- Public token access is handled only by server routes using the service role.
-- Authenticated users can access only their own onboarding records.
CREATE POLICY "auth_select_onboarding"
  ON client_onboarding
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auth_update_onboarding"
  ON client_onboarding
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      prospect_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.prospects AS owned_prospect
        WHERE owned_prospect.id = client_onboarding.prospect_id
          AND owned_prospect.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "auth_insert_onboarding"
  ON client_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      prospect_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.prospects AS owned_prospect
        WHERE owned_prospect.id = client_onboarding.prospect_id
          AND owned_prospect.user_id = auth.uid()
      )
    )
  );

-- The onboarding-assets bucket is created as private by migration 024.
-- Public token holders upload through /api/onboarding/[token]/upload.
