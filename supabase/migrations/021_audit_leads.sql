create table if not exists public.audit_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_name text,
  business_city text,
  place_id text,
  email text not null,
  score integer,
  report_data jsonb,
  pdf_url text
);

alter table public.audit_leads enable row level security;

create policy "anon insert" on public.audit_leads
  for insert to anon with check (true);
