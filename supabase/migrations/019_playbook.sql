-- Playbook sections table
-- Stores training docs: scripts, objections, pricing, FAQs, follow-up templates

create table if not exists playbook_sections (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('scripts', 'objections', 'pricing', 'faqs', 'templates')),
  title text not null,
  content text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table playbook_sections enable row level security;

-- All authenticated users can read
create policy "Authenticated users can read playbook"
  on playbook_sections for select
  to authenticated
  using (true);

-- All authenticated users can insert/update/delete (team-editable)
create policy "Authenticated users can manage playbook"
  on playbook_sections for all
  to authenticated
  using (true)
  with check (true);

-- Index for fast category filtering
create index if not exists idx_playbook_sections_category on playbook_sections (category, sort_order);

-- ============================================================
-- SEED DATA — placeholder content (edit in Supabase dashboard)
-- ============================================================

-- CALL SCRIPTS
insert into playbook_sections (category, title, content, sort_order) values
(
  'scripts',
  'Opening Line (Cold Call)',
  'Hey [Name], this is [Your Name] with Booked Out — we help local service businesses get more 5-star reviews and fill their calendar automatically. I know you''re busy, so I''ll be quick — do you have 60 seconds?

[If yes] → Great. We work with [plumbers / roofers / HVAC companies] in [City] to automate their follow-up so they''re consistently getting reviews and referrals without lifting a finger. I''d love to show you exactly how it works. Are you open to a quick 15-minute demo this week?',
  10
),
(
  'scripts',
  'Discovery Questions',
  'Use these to qualify and understand the prospect before pitching:

1. How are you currently getting new customers? (referrals, Google, word of mouth?)
2. How many reviews do you have on Google right now? What''s your rating?
3. What happens after a job is complete — do you follow up with the customer at all?
4. Do you have any kind of CRM or system to track leads and follow-ups?
5. What''s your biggest challenge right now — getting new leads, converting them, or keeping customers coming back?
6. How many jobs do you do per month on average?

Listen for: manual chaos, no reviews system, no CRM, owner doing everything themselves.',
  20
),
(
  'scripts',
  'Closing Script',
  'So based on everything you told me, it sounds like [recap their pain: e.g., "you''re doing great work but not getting the reviews to show for it"].

Here''s what we do: we automate your follow-up after every job — review requests, reminders, referral asks — all on autopilot. Most clients see 3-5x more Google reviews within the first 60 days.

We have a [Starter / Growth] plan that would be a perfect fit for you. It''s [price] per month, no long-term contract.

Can we get you set up this week?

[If hesitant] → Totally understand. What would need to be true for this to be a yes for you?',
  30
);

-- OBJECTION HANDLING
insert into playbook_sections (category, title, content, sort_order) values
(
  'objections',
  '"I''m not interested."',
  'No problem at all — can I ask, is it that you''re happy with how things are going, or just not the right time?

[If happy] → That''s great to hear. Most of our clients felt the same way until they saw what automated follow-up could add to their monthly revenue. Even just 10 extra Google reviews can move you from page 2 to page 1. Would you be open to a 10-minute look, no strings?

[If timing] → Makes sense. When would be a better time to reconnect?',
  10
),
(
  'objections',
  '"I already have someone doing my marketing."',
  'That''s great — we actually work alongside existing marketing. What we do is specifically the post-job automation piece: review requests, follow-up sequences, referral asks. Most marketing agencies don''t touch that.

What does your current person handle for you? [Listen] — Is review generation part of what they''re doing?',
  20
),
(
  'objections',
  '"It''s too expensive."',
  'I hear you — let''s put it in perspective. If our system gets you 5 extra jobs per month at $500 average ticket, that''s $2,500 in revenue. Our plan is [price]. The math usually works out pretty fast.

Also — we don''t lock you into a contract. If it''s not producing results in the first 60 days, you can cancel.

Would it help if I showed you what results look like for a business similar to yours?',
  30
),
(
  'objections',
  '"I need to think about it."',
  'Of course — this is a real decision. Can I ask what specifically you''d want to think through? Is it the price, whether it would actually work for your business, or something else?

[Address the specific thing]

One thing I can do is set you up with a 2-week trial so you can see it work before committing. Would that help?',
  40
),
(
  'objections',
  '"I don''t have time to manage another tool."',
  'That''s exactly why our clients love it — there''s nothing to manage. Once we set it up, it runs automatically. You do the job, we handle the follow-up. No extra work on your end.

Setup takes about 30 minutes on our end. You just connect your Google account and we do the rest.',
  50
);

-- PRICING & PACKAGES
insert into playbook_sections (category, title, content, sort_order) values
(
  'pricing',
  'Starter Plan — $297/month',
  'Best for: Solo operators and small crews just getting started with automation.

Includes:
• Automated Google review requests (SMS + email)
• Up to 100 contacts/month
• 1 follow-up sequence (5-step)
• Basic reporting dashboard
• Email support

Ideal prospect: 1-5 person operation, <50 jobs/month, less than 50 Google reviews.',
  10
),
(
  'pricing',
  'Growth Plan — $597/month',
  'Best for: Established businesses ready to scale reviews and referrals.

Includes everything in Starter, plus:
• Unlimited contacts
• Up to 3 follow-up sequences
• Referral request automation
• Review response templates
• Priority support + monthly strategy call
• CRM integration (if applicable)

Ideal prospect: 5-20 person team, 50-200 jobs/month, wants to dominate local SEO.',
  20
),
(
  'pricing',
  'Agency / White-Label — Custom',
  'For marketing agencies or businesses with multiple locations.

Includes:
• All Growth features
• Multi-location dashboard
• White-label options
• Dedicated onboarding
• Custom integrations

Price: Custom quote based on locations and volume. Start the conversation at $1,500+/month.',
  30
),
(
  'pricing',
  'What''s Always Included',
  '• Initial setup and onboarding call
• We configure everything — you don''t need to be technical
• No long-term contracts (month-to-month)
• 30-day satisfaction guarantee
• Access to all future platform updates',
  40
);

-- FAQs
insert into playbook_sections (category, title, content, sort_order) values
(
  'faqs',
  'How long does setup take?',
  'Typically 24-48 hours from when you sign up. We handle the setup — you just need to connect your Google Business Profile and give us a few details about your business. We''ll walk you through it on an onboarding call.',
  10
),
(
  'faqs',
  'Do you require a contract?',
  'No long-term contracts. Everything is month-to-month. You can cancel anytime with 30 days notice. We''d rather earn your business every month than lock you in.',
  20
),
(
  'faqs',
  'Will this work for my industry?',
  'We work best with local service businesses: plumbers, HVAC, roofers, landscapers, electricians, cleaning services, pest control, auto repair, and similar trades. If you do jobs for homeowners or businesses and want more reviews and referrals — it works.',
  30
),
(
  'faqs',
  'How do you send the review requests?',
  'We send automated SMS and/or email messages to your customers after each job is marked complete. The message includes a direct link to your Google review page. You set the timing (e.g., 2 hours after job close, then a reminder 3 days later).',
  40
),
(
  'faqs',
  'What results can I expect?',
  'Most clients see 3-5x more Google reviews within the first 60 days. Average response rate on review requests is 15-25%. Clients typically move up 1-2 positions in local search rankings within 90 days. Results depend on job volume and how responsive your customers are.',
  50
),
(
  'faqs',
  'What do I need to get started?',
  '1. A Google Business Profile (we can help you claim one if needed)
2. A customer list or CRM export (even a spreadsheet works)
3. A phone number for SMS sending (we provide one)
4. 30 minutes for the onboarding call

That''s it.',
  60
);

-- FOLLOW-UP TEMPLATES
insert into playbook_sections (category, title, content, sort_order) values
(
  'templates',
  'Post-Demo Follow-up Email',
  'Subject: Quick recap + next steps — [Company Name]

Hey [Name],

Thanks for taking the time today — really enjoyed learning about [their business / specific detail from call].

Quick recap of what we covered:
• [Pain point they mentioned]
• How Booked Out automates your review follow-up after every job
• [Plan you discussed] at [price]/month, month-to-month

Next step: I''ll send over a short proposal by [date]. In the meantime, if you have any questions just reply here.

Looking forward to getting you set up.

[Your name]',
  10
),
(
  'templates',
  '24-Hour Follow-up (No Response)',
  'Subject: Still thinking it over?

Hey [Name], just checking in — wanted to make sure my last email didn''t get buried.

Happy to answer any questions or jump on a quick call. Even 10 minutes would work.

[Your name]

P.S. If the timing isn''t right, just let me know and I''ll follow up next quarter.',
  20
),
(
  'templates',
  '1-Week Follow-up',
  'Subject: One thing I forgot to mention

Hey [Name],

I realized I didn''t mention this on our call — we''re running a promotion through [end of month] where new clients get their first month at 50% off.

Wanted to make sure you knew before it expired. Would you like to lock that in?

[Your name]',
  30
),
(
  'templates',
  'Post-Demo SMS (Same Day)',
  'Hey [Name], this is [Your name] from Booked Out — great chatting today! Sending over the recap to your email now. Let me know if you have any questions. 🙌',
  40
),
(
  'templates',
  'Re-engagement (Gone Cold — 30+ Days)',
  'Subject: Still dealing with [pain point]?

Hey [Name],

We spoke a while back about automating your review follow-up. Wanted to check in — is that still something you''re looking to solve?

We just rolled out [new feature or social proof, e.g., "a new referral automation module" or "50 new clients in your area are now using Booked Out"].

Worth a quick 10-minute call to revisit?

[Your name]',
  50
);
