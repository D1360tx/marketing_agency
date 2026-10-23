/*
 * Copy, prices and proof for the Booked Out homepage.
 * Prices must match docs/context/OFFER-SOURCE-OF-TRUTH.md before publishing.
 */

export const PHONE_DISPLAY = "(737) 260-5332";
export const PHONE_HREF = "tel:+17372605332";

export type Stage = {
  name: string;
  label: string;
  title: string;
  desc: string;
  bullets: { text: string; crm: boolean }[];
};

export const STAGES: Stage[] = [
  {
    name: "Get found",
    label: "01 · GET FOUND",
    title: "Show up looking like the obvious choice.",
    desc: "When someone nearby searches for what you do, they find a fast site, a complete Google profile and a clear way to call.",
    bullets: [
      { text: "Mobile-first website with tap-to-call above the fold", crm: false },
      { text: "Google Business Profile cleaned up and complete", crm: false },
      { text: "Service areas, licenses and proof where buyers look", crm: false },
    ],
  },
  {
    name: "Get answered",
    label: "02 · GET ANSWERED",
    title: "Every inquiry hears back in seconds.",
    desc: "New requests get an instant acknowledgment and land with the right person, details attached, even while you’re busy with a customer.",
    bullets: [
      { text: "Instant acknowledgment for every web inquiry", crm: false },
      { text: "Routed to the right person with service, urgency and location", crm: false },
      { text: "Missed-call text-back and one inbox for texts, calls and email", crm: true },
    ],
  },
  {
    name: "Get booked",
    label: "03 · GET BOOKED",
    title: "Interested leads become appointments on the calendar.",
    desc: "Every opportunity moves through a clear pipeline, so nothing stalls between the first call and the appointment.",
    bullets: [
      { text: "Pipeline that shows where every opportunity stands", crm: true },
      { text: "Shared calendar and online booking", crm: true },
      { text: "Appointment reminders that cut no-shows", crm: true },
    ],
  },
  {
    name: "Get reviewed",
    label: "04 · GET REVIEWED",
    title: "Happy customers become your best proof.",
    desc: "After each visit, eligible customers get a simple, neutral ask to share their experience on Google.",
    bullets: [
      { text: "Neutral review request after every completed service", crm: false },
      { text: "Direct link to your Google review form", crm: false },
      { text: "Monthly report on review activity", crm: false },
    ],
  },
  {
    name: "Get called again",
    label: "05 · GET CALLED AGAIN",
    title: "Stay top of mind for next time.",
    desc: "Past customers hear from you at the right moments, so the next booking or referral comes back to you.",
    bullets: [
      { text: "Seasonal reminders to past customers", crm: true },
      { text: "Win-back campaigns by text and email", crm: true },
      { text: "Full history of every customer in one place", crm: true },
    ],
  },
];

export const COMPARISON = [
  { label: "Contract", them: "6 to 24 month lock-in", us: "Month-to-month. Stay because it works." },
  { label: "Reporting", them: "Clicks, impressions and “reach”", us: "Leads, bookings and cost per booked customer" },
  { label: "Tracking", them: "A pixel, if anything", us: "First click to paid invoice, sent back to Meta and Google" },
  { label: "Ownership", them: "They hold your site, ad accounts and data", us: "Everything in your name from day one" },
  { label: "Who you talk to", them: "An account manager who keeps changing", us: "The person who builds your system" },
  { label: "Strategy", them: "The same template for every client", us: "Built around your services, margins and market" },
];

export type Plan = {
  key: "foundation" | "growth" | "ads";
  eyebrow: string;
  name: string;
  price: string;
  priceNote: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    key: "foundation",
    eyebrow: "GET FOUND & TRUSTED",
    name: "Foundation",
    price: "$499",
    priceNote: "Setup included for founding clients.",
    cta: "Start with a free audit",
    features: [
      "Managed mobile-first website, up to 7 pages",
      "Google Business Profile foundation",
      "Up to 100 neutral review requests a month",
      "Tested form routing and instant email reply",
      "Monthly report and growth review",
    ],
  },
  {
    key: "growth",
    eyebrow: "NEVER MISS A LEAD",
    name: "Growth",
    price: "$997",
    priceNote: "Plus $1,500 one-time setup.",
    cta: "Get my free audit",
    features: [
      "Everything in Foundation",
      "Your own Booked Out CRM: pipeline, calendar and one inbox",
      "Instant text reply and missed-call text-back",
      "Follow-ups and appointment reminders",
      "Past-customer check-ins and win-back campaigns",
      "Weekly report on leads, bookings and response time",
    ],
  },
  {
    key: "ads",
    eyebrow: "THE FULL SYSTEM",
    name: "Growth + Ads",
    price: "$1,750",
    priceNote: "Plus $2,500 one-time setup. Ad spend is paid to Meta and Google directly.",
    cta: "Get my free audit",
    featured: true,
    features: [
      "Everything in Growth",
      "Managed Meta and Google ads",
      "Server-side tracking, with booked and paid events sent back to Meta and Google",
      "Fresh ad creative and tests every month",
      "Monday report on leads, bookings, cost per booked customer and revenue",
    ],
  },
];

export const TRACKING_FIX = {
  price: "$997",
  features: [
    "Server-side Meta Conversions API and Google conversion setup",
    "Click IDs and UTMs saved on every lead in your CRM",
    "Booked and paid events sent back to Meta and Google with their value",
    "Written report showing what was fixed and proof it works",
  ],
};

export const PRICING_FINE_PRINT =
  "Plans cover one business, location, domain and Google Business Profile. Ad spend is billed by Meta and Google directly. Text and call usage, A2P carrier registration and other third-party charges are billed separately. No calls, leads, reviews, rankings or revenue are guaranteed.";

export const CASE_STUDY = {
  client: "Joao Crus BJJ",
  meta: "Jiu-jitsu gym · Dripping Springs, TX",
  website: "https://joaocrusbjj.com",
  websiteLabel: "joaocrusbjj.com",
  photo: "/images/joao-crus.jpg",
  photoAlt: "Joao, owner of Joao Crus BJJ",
  problem:
    "An outdated website brought in about one lead a month. Ads were outsourced to an agency with no real tracking or follow-up, and the leads and data belonged to the agency, not the gym.",
  work: [
    "Rebuilt the website, mobile-first, with proper analytics",
    "Server-side tracking with booked events sent to Meta and Google",
    "CRM with automations, follow-ups and appointment reminders",
    "Instant text reply to every new lead",
  ],
  metrics: [
    { label: "Cost per booked customer", value: "−53%", note: "vs. before Booked Out" },
    { label: "Bookings per month", value: "37", note: "from 1" },
    { label: "Lead response time", value: "Instant", note: "from 4+ hours" },
  ],
  /*
   * Claims rule (OFFER-SOURCE-OF-TRUTH.md): no quotation may be published
   * without the client's own words and written permission. Replace the text
   * with Joao's real quote, then set quoteApproved to true.
   */
  quote: "Working with Booked Out has shown me what my business is really capable of.",
  quoteAttribution: "Joao, Owner, Joao Crus BJJ",
  quoteApproved: false,
};

export const FOUNDER_STATS = [
  { value: "15+ yrs", label: "in DTC and lead generation" },
  { value: "$10M+", label: "in ad spend managed on Meta and Google" },
  { value: "50+", label: "brands and businesses scaled" },
];

export const TRADES = [
  "Cleaning",
  "Window washing",
  "Auto detailing",
  "Lawn & landscaping",
  "Pressure washing",
  "Pet grooming",
  "Salons & barbers",
  "Fitness studios",
  "Martial arts gyms",
  "Home repair",
  "Moving",
  "Pool service",
  "and more",
];

export const FAQS = [
  {
    q: "Is the CRM included in the $499 plan?",
    a: "No. Foundation covers your website, Google profile, review requests and form follow-up. The CRM, text follow-up and automations start with Growth.",
  },
  {
    q: "What do I actually have to do?",
    a: "Join one kickoff, give us accurate business information and account access, and send consolidated approvals. We handle the audit, build, testing, review-request setup and the monthly report.",
  },
  {
    q: "Do I need a new website?",
    a: "Maybe not. We audit what you have first. If the contact path works and the site explains why customers should choose you, we improve it. If it creates friction, we rebuild only what the approved scope requires.",
  },
  {
    q: "Can it send texts and automate follow-up?",
    a: "Yes, on Growth and Growth + Ads. Texting requires carrier (A2P 10DLC) registration before launch, and text and call usage is billed separately.",
  },
  {
    q: "Do you guarantee more customers?",
    a: "No. We guarantee delivery of the agreed foundation within 30 days of getting what we need, and we report completed work every month. Outcomes depend on your market, baseline and volume.",
  },
  {
    q: "Am I locked into a long contract?",
    a: "No. Everything is month-to-month. Service stays active through the paid billing period if you cancel.",
  },
  {
    q: "Do I own everything?",
    a: "Yes. Your domain, website content, Google Business Profile, ad accounts, and lead and customer data are set up in your name from day one. If you ever leave, all of it goes with you.",
  },
  {
    q: "How fast will I see results?",
    a: "Your site, review requests and follow-up go live within 30 days of getting what we need. Paid ads usually need 2 to 4 weeks of data to settle in. Reviews and search visibility build month over month, and every report compares against your starting baseline.",
  },
];

export const INTEREST_OPTIONS = [
  "Not sure yet",
  "Foundation",
  "Growth (adds the CRM)",
  "Growth + Ads",
  "Tracking Fix only",
];
