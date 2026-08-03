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
  'Hey [Name], this is [Your Name] with Booked Out. We help local service businesses tighten up their website, review-request process, and lead follow-up. I know you''re busy, so I''ll be quick — do you have 60 seconds?

[If yes] → Great. I prepared a short audit of how the business appears online and where follow-up may be leaking. Are you open to a 15-minute review this week?',
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

Here''s what we do: we install a managed website, neutral review requests, and lead follow-up, then report against the starting baseline. Results vary, so we do not promise a fixed number of calls, reviews, rankings, jobs, or revenue.

The Local Call System is $499 per month with no setup fee for the founding offer and no long-term contract.

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

[If happy] → That''s great to hear. I can still show you the audit baseline so you can confirm whether there is anything worth fixing. Would you be open to a 10-minute look, no strings?

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
  'I hear you. The right comparison is the cost of the current gaps, not a made-up revenue projection. Let''s review the audit and decide whether the website, review requests, and lead follow-up are worth $499 per month for your business.

There is no long-term contract. Service is month-to-month, and we report what was actually delivered and observed.

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
  'The system is managed for you, but we still need accurate business information, access, approvals, and lawful customer data. Once configured, Booked Out handles the agreed website and follow-up operations.

Onboarding usually takes about 15-30 minutes of your time. We confirm the actual launch schedule after reviewing access and scope.',
  50
);

-- PRICING & PACKAGES
insert into playbook_sections (category, title, content, sort_order) values
(
  'pricing',
  'Local Call System — $499/month',
  'Best for: Local service businesses that need a credible website, consistent review requests, and faster lead follow-up.

Includes:
• Managed mobile-first website and hosting
• Neutral Google review requests by email and consented SMS
• Missed-call and form-lead follow-up
• Google Business Profile foundation work
• Monthly edits and evidence-based reporting
• Month-to-month service with no setup fee

Do not promise a specific number of calls, reviews, rankings, jobs, or revenue.',
  10
),
(
  'pricing',
  'Growth Partner — $997/month',
  'Best for: Established clients that have completed the Local Call System launch and need recurring growth work.

Includes everything in Local Call System, plus:
• Expanded Google Business Profile work
• Ongoing content and citation work
• Conversion optimization
• Monthly strategy review

Sell this tier only when its recurring fulfillment capacity is confirmed.',
  20
),
(
  'pricing',
  'Founding Client Terms',
  'The first three clients may join the Local Call System at $499/month with no setup fee.

Service is month-to-month. Website content and core page files are available for export after three paid months. Hosting, third-party licenses, software integrations, and automations remain part of the managed service.',
  30
),
(
  'pricing',
  'What Is Always Included',
  '• Initial audit and onboarding
• Configuration handled by Booked Out
• Month-to-month billing
• Clear baseline and monthly evidence
• No guaranteed calls, reviews, rankings, jobs, or revenue',
  40
);

-- FAQs
insert into playbook_sections (category, title, content, sort_order) values
(
  'faqs',
  'How long does setup take?',
  'We confirm the launch schedule after receiving your onboarding information and required account access. Timing varies by website scope, domain access, and messaging registration. We provide a written launch plan rather than promising a fixed turnaround.',
  10
),
(
  'faqs',
  'Do you require a contract?',
  'No long-term contract. Service is month-to-month and continues through the current paid billing period after cancellation. Follow the signed service agreement for notice and export terms.',
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
  'We send neutral review requests by email and, when affirmative consent is recorded, SMS. Messages include a direct link to the client''s review page and do not filter customers by expected sentiment. Recipients can opt out.',
  40
),
(
  'faqs',
  'What results can I expect?',
  'Results vary by market, starting point, customer volume, and client cooperation. We establish a baseline and report requests sent, delivery failures, opt-outs, reviews, calls or forms captured, and ranking movement where those data are available. We do not guarantee calls, reviews, rankings, jobs, or revenue.',
  50
),
(
  'faqs',
  'What do I need to get started?',
  '1. Accurate business and service-area information
2. Website, domain, and Google Business Profile access where applicable
3. Approved customer contact data with the consent records required for each messaging channel
4. About 15-30 minutes for onboarding

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
  'Subject: One more useful detail

Hey [Name],

One thing I want to make clear: Booked Out is month-to-month, with no setup fee for the founding Local Call System offer. We establish the baseline first and do not guarantee a specific number of calls, reviews, rankings, jobs, or revenue.

Would it be useful to review the audit priorities together?

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

If it is still relevant, I can refresh the audit and show you the current priorities.

Worth a quick 10-minute call to revisit?

[Your name]',
  50
);
