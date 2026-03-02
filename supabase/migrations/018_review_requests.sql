create table if not exists review_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  customer_name text not null,
  customer_email text not null,
  business_name text not null,
  google_review_url text not null,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table review_requests enable row level security;

create policy "Users can manage own review requests" on review_requests
  for all using (auth.uid() = user_id);
