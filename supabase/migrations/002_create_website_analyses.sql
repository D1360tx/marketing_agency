-- Website quality analysis results
CREATE TABLE IF NOT EXISTS website_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,
  has_ssl BOOLEAN,
  is_mobile_friendly BOOLEAN,
  load_time_ms INTEGER,
  has_viewport_meta BOOLEAN,
  technology_stack JSONB,
  overall_grade TEXT CHECK (overall_grade IN ('A','B','C','D','F')),
  raw_data JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_prospect ON website_analyses(prospect_id);
