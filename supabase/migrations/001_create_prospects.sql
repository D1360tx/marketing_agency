-- Core business data from Google Maps
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  google_maps_url TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER,
  business_type TEXT,
  search_query TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','interested','client','not_interested','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_user ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(user_id, status);
