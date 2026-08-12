-- Synchronize existing AgencyFlow playbooks with the approved Booked Out offer.
-- This migration only replaces known legacy seed rows, leaving custom user rows intact.

DELETE FROM public.playbook_sections
WHERE category = 'pricing'
  AND title IN (
    'Starter Plan — $297/month',
    'Growth Plan — $597/month',
    'Agency / White-Label — Custom',
    'What''s Always Included'
  );

INSERT INTO public.playbook_sections (category, title, content, sort_order)
SELECT values_to_insert.*
FROM (
  VALUES
    (
      'pricing'::text,
      'Local Call System — $499/month'::text,
      'Best for: Local service businesses that need a credible website, consistent review requests, and faster lead follow-up.

Includes:
• Managed mobile-first website and hosting
• Neutral Google review requests by email and consented SMS
• Missed-call and form-lead follow-up
• Google Business Profile foundation work
• Monthly edits and evidence-based reporting
• Month-to-month service with no setup fee

Do not promise a specific number of calls, reviews, rankings, jobs, or revenue.'::text,
      10::integer
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
    )
) AS values_to_insert(category, title, content, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.playbook_sections existing
  WHERE existing.category = values_to_insert.category
    AND existing.title = values_to_insert.title
);

UPDATE public.playbook_sections
SET content = 'We confirm the launch schedule after receiving your onboarding information and required account access. Timing varies by website scope, domain access, and messaging registration. We provide a written launch plan rather than promising a fixed turnaround.'
WHERE category = 'faqs' AND title = 'How long does setup take?';

UPDATE public.playbook_sections
SET content = 'No long-term contract. Service is month-to-month and continues through the current paid billing period after cancellation. Follow the signed service agreement for notice and export terms.'
WHERE category = 'faqs' AND title = 'Do you require a contract?';

UPDATE public.playbook_sections
SET content = 'We send neutral review requests by email and, when affirmative consent is recorded, SMS. Messages include a direct link to the client''s review page and do not filter customers by expected sentiment. Recipients can opt out.'
WHERE category = 'faqs' AND title = 'How do you send the review requests?';

UPDATE public.playbook_sections
SET content = 'Results vary by market, starting point, customer volume, and client cooperation. We establish a baseline and report requests sent, delivery failures, opt-outs, reviews, calls or forms captured, and ranking movement where those data are available. We do not guarantee calls, reviews, rankings, jobs, or revenue.'
WHERE category = 'faqs' AND title = 'What results can I expect?';

UPDATE public.playbook_sections
SET content = 'Subject: One more useful detail

Hey [Name],

One thing I want to make clear: Booked Out is month-to-month, with no setup fee for the founding Local Call System offer. We establish the baseline first and do not guarantee a specific number of calls, reviews, rankings, jobs, or revenue.

Would it be useful to review the audit priorities together?

[Your name]'
WHERE category = 'templates' AND title = '1-Week Follow-up';

UPDATE public.playbook_sections
SET content = replace(
  content,
  'We just rolled out [new feature or social proof, e.g., "a new referral automation module" or "50 new clients in your area are now using Booked Out"].',
  'If it is still relevant, I can refresh the audit and show you the current priorities.'
)
WHERE category = 'templates' AND title = 'Re-engagement (Gone Cold — 30+ Days)';

UPDATE public.playbook_sections
SET content = 'Hey [Name], this is [Your Name] with Booked Out. We help local service businesses tighten up their website, review-request process, and lead follow-up. I know you''re busy, so I''ll be quick — do you have 60 seconds?

[If yes] → Great. I prepared a short audit of how the business appears online and where follow-up may be leaking. Are you open to a 15-minute review this week?'
WHERE category = 'scripts' AND title = 'Opening Line (Cold Call)';

UPDATE public.playbook_sections
SET content = 'So based on everything you told me, it sounds like [recap their pain].

Here''s what we do: we install a managed website, neutral review requests, and lead follow-up, then report against the starting baseline. Results vary, so we do not promise a fixed number of calls, reviews, rankings, jobs, or revenue.

The Local Call System is $499 per month with no setup fee for the founding offer and no long-term contract.

Can we get you set up this week?'
WHERE category = 'scripts' AND title = 'Closing Script';

UPDATE public.playbook_sections
SET content = 'No problem at all — can I ask, is it that you''re happy with how things are going, or just not the right time?

[If happy] → That''s great to hear. I can still show you the audit baseline so you can confirm whether there is anything worth fixing. Would you be open to a 10-minute look, no strings?

[If timing] → Makes sense. When would be a better time to reconnect?'
WHERE category = 'objections' AND title = '"I''m not interested."';

UPDATE public.playbook_sections
SET content = 'I hear you. The right comparison is the cost of the current gaps, not a made-up revenue projection. Let''s review the audit and decide whether the website, review requests, and lead follow-up are worth $499 per month for your business.

There is no long-term contract. Service is month-to-month, and we report what was actually delivered and observed.'
WHERE category = 'objections' AND title = '"It''s too expensive."';

UPDATE public.playbook_sections
SET content = 'The system is managed for you, but we still need accurate business information, access, approvals, and lawful customer data. Once configured, Booked Out handles the agreed website and follow-up operations.

Onboarding usually takes about 15-30 minutes of your time. We confirm the actual launch schedule after reviewing access and scope.'
WHERE category = 'objections' AND title = '"I don''t have time to manage another tool."';
