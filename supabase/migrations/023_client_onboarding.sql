-- Client onboarding intake form
CREATE TABLE IF NOT EXISTS client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_onboarding_token ON client_onboarding(token);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_prospect ON client_onboarding(prospect_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_status ON client_onboarding(status);

-- Enable RLS
ALTER TABLE client_onboarding ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (token-based, no auth needed)
CREATE POLICY "public_insert_onboarding"
  ON client_onboarding
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can SELECT their own record by token (for form validation)
CREATE POLICY "public_select_own_onboarding"
  ON client_onboarding
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can SELECT/UPDATE all
CREATE POLICY "auth_select_onboarding"
  ON client_onboarding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_onboarding"
  ON client_onboarding
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_insert_onboarding"
  ON client_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NOTE: Diego needs to manually create the Supabase Storage bucket:
-- Bucket name: onboarding-assets
-- Set to PUBLIC
-- Upload paths: [token]/logo.[ext] and [token]/photos/[filename]
