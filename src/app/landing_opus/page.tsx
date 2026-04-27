"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Geo = { city?: string; region?: string };

type FormData = {
  name: string;
  business: string;
  phone: string;
  email: string;
  website: string;
  businessType: string;
  serviceArea: string;
  googleProfile: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cl(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Micro-components                                                   */
/* ------------------------------------------------------------------ */

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cl(
            "h-4 w-4",
            i < count ? "fill-amber-400 text-amber-400" : "text-gray-300"
          )}
        />
      ))}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <Check className="h-3 w-3" />
      {children}
    </span>
  );
}

function StatCard({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cl(
        "rounded-2xl border px-6 py-5 text-center",
        accent
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 bg-white"
      )}
    >
      <div
        className={cl(
          "text-3xl font-bold tracking-tight sm:text-4xl",
          accent ? "text-orange-600" : "text-gray-900"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Item                                                           */
/* ------------------------------------------------------------------ */

function FaqItem({
  q,
  a,
  open,
  toggle,
}: {
  q: string;
  a: string;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900">{q}</span>
        <ChevronDown
          className={cl(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cl(
          "grid transition-[grid-template-rows] duration-300",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-gray-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function LandingOpusPage() {
  /* -- Geo --------------------------------------------------------- */
  const [city, setCity] = useState("");
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: Geo) => {
        if (!alive) return;
        if (d?.city?.trim()) setCity(d.city.trim());
      })
      .catch(() => {})
      .finally(() => alive && setGeoReady(true));
    return () => { alive = false; };
  }, []);

  const area = city || "your area";
  const areaIn = city ? `in ${city}` : "in your area";

  /* -- Form -------------------------------------------------------- */
  const [form, setForm] = useState<FormData>({
    name: "",
    business: "",
    phone: "",
    email: "",
    website: "",
    businessType: "",
    serviceArea: "",
    googleProfile: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");

  const set = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.business.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.businessType.trim() ||
      !form.serviceArea.trim()
    ) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/leads/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          business: form.business.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website.trim(),
          businessType: form.businessType.trim(),
          serviceArea: form.serviceArea.trim(),
          googleProfile: form.googleProfile.trim(),
          source: "landing_opus",
          city: form.serviceArea.trim() || area,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({
        name: "",
        business: "",
        phone: "",
        email: "",
        website: "",
        businessType: "",
        serviceArea: "",
        googleProfile: "",
      });
    } catch {
      setStatus("error");
    }
  }

  /* -- FAQ --------------------------------------------------------- */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "I already have a website. Do I need a new one?",
      a: "Maybe not. We audit what you have first. If it loads fast, ranks well, and converts visitors into calls, we'll focus on reviews and SEO instead. If it's hurting you, we'll rebuild only what's needed. No unnecessary work.",
    },
    {
      q: "How is this different from the last agency that burned me?",
      a: "Most agencies sell you a retainer and a dashboard. We sell you a system with measurable outcomes: more reviews, better rankings, more calls. No long contracts. If we're not delivering, you leave. That's the deal.",
    },
    {
      q: "What do I actually have to do?",
      a: "Answer a few questions about your business and service area. That's about 15 minutes of your time. We handle everything else: the build, the launch, the review automation setup, the ongoing optimization.",
    },
    {
      q: "How fast will I see results?",
      a: "Review growth starts within the first week of automation going live. Website and SEO improvements typically show measurable ranking changes within 30 days. Most clients report noticeably more calls within the first 6 weeks.",
    },
    {
      q: "Why do you only take one business per trade per city?",
      a: "Because we'd be working against ourselves. If we build two plumbers in the same city to rank #1, one of them loses. We'd rather go all-in for you and actually deliver.",
    },
    {
      q: "What happens if I want to cancel?",
      a: "You cancel. No penalties, no fees, no guilt trip. Your website stays live through the end of your billing period. We keep things simple because we'd rather earn your business every month than trap you in a contract.",
    },
    {
      q: "Do I own the website if I cancel?",
      a: "The site stays live while your plan is active because hosting, updates, and management are included. If you ever want to leave, we'll give you a clean export of your content and core page files so another provider can rebuild or migrate it.",
    },
    {
      q: "Are SMS, email, hosting, and reporting included?",
      a: "Yes. Hosting, monthly reporting, and standard review request messages are included. If your account ever needs unusually high SMS volume, we'll flag it before any billing changes happen.",
    },
    {
      q: "What happens in the first month?",
      a: "We audit your current presence, launch or improve the website, set up review requests for every customer, clean up obvious Google Business Profile gaps, and give you a first report showing what changed and what we are watching next.",
    },
  ];

  const proofStats = [
    { label: "Review gap", before: "12 reviews", after: "53 reviews", note: "60-day review request campaign" },
    { label: "Call clarity", before: "3 buried CTAs", after: "Tap-to-call on every page", note: "Mobile-first website rebuild" },
    { label: "Audit depth", before: "Guesswork", after: "Speed, rankings, reviews, competitors", note: "Delivered before the sales call" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://trybookedout.com/#organization",
        name: "Booked Out",
        url: "https://trybookedout.com/",
        telephone: "+17372605332",
        description:
          "Websites and compliant review automation for local service businesses.",
      },
      {
        "@type": "Service",
        "@id": "https://trybookedout.com/#service",
        name: "Local service business website and review automation",
        provider: { "@id": "https://trybookedout.com/#organization" },
        areaServed: "United States",
        serviceType: "Website design, local SEO, and review automation",
        offers: [
          {
            "@type": "Offer",
            name: "The Full System",
            price: "399",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            name: "Market Dominator",
            price: "697",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://trybookedout.com/#faq",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  /* -- Testimonials ------------------------------------------------ */
  const testimonials = [
    {
      name: "Mike Hernandez",
      trade: "Plumbing",
      location: "Cedar Park, TX",
      quote: "Went from 6 reviews to 53 in two months. I stopped running ads because the phone was already ringing enough. Best money I spend every month.",
      metric: "53 reviews in 60 days",
    },
    {
      name: "Sarah Chen",
      trade: "Salon Owner",
      location: "Gilbert, AZ",
      quote: "My old website looked like it was from 2012. Within a week of launching the new one, I had three new clients mention they found me on Google. That never happened before.",
      metric: "3x more Google traffic",
    },
    {
      name: "James Washington",
      trade: "HVAC",
      location: "Murfreesboro, TN",
      quote: "I've wasted thousands on marketing companies. These guys actually showed me what was broken and fixed it. No fluff, no jargon. My wife noticed the difference in the books within a month.",
      metric: "40% more booked jobs",
    },
  ];

  /* -- Render ------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* ============================================================ */}
      {/*  NAV                                                          */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Booked Out</span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="tel:+17372605332"
              className="hidden items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 sm:inline-flex"
            >
              <Phone className="h-4 w-4" />
              (737) 260-5332
            </a>
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Get My Free Audit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gray-50">
          {/* Subtle texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
            {/* Geo badge */}
            <div className="flex items-center gap-2">
              {geoReady && city && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
                  <MapPin className="h-3 w-3 text-orange-500" />
                  Serving {city}
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              You do great work{city ? ` ${areaIn}` : ""}.{" "}
              <span className="text-orange-600">So why does your competitor get the call?</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              They&apos;re not better than you. They just look better online. We
              build fast local websites and compliant review request systems
              that help service businesses get more calls from Google. No setup
              fee. No contracts. Results in 30 days or your first month is free.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#get-started"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-7 py-4 text-base font-bold text-white shadow-md transition hover:bg-orange-700 hover:shadow-lg"
              >
                Get My Free Audit
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="tel:+17372605332"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-4 text-base font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                Call (737) 260-5332
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge>No contracts</Badge>
              <Badge>Results in 30 days</Badge>
              <Badge>Compliant review requests</Badge>
              <Badge>1 per trade per city</Badge>
            </div>

            {/* Stats strip */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard value="340%" label="avg. increase in calls" accent />
              <StatCard value="53" label="avg. reviews in 60 days" />
              <StatCard value="30" label="days to see results" />
              <StatCard value="0" label="long-term contracts" />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Example outcomes from recent local service campaigns. Your audit
              will show the exact gap in your market before we recommend a plan.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  TRUST BREAK                                                  */}
        {/* ============================================================ */}
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                No agency games
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                You shouldn&apos;t have to guess if your marketing is working.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Most agencies sell reports, contracts, and vague SEO progress.
                We keep it simple: more reviews, clearer rankings, more calls,
                and no long-term contract keeping you stuck.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  bad: "Locked into a 12-month contract",
                  good: "Month-to-month. Stay because it works.",
                  icon: X,
                },
                {
                  bad: "Paid for reports you couldn't measure",
                  good: "Track reviews, rankings, calls, and leads.",
                  icon: X,
                },
                {
                  bad: "Never talked to the same person twice",
                  good: "A direct line to the team doing the work.",
                  icon: X,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
                >
                  <div className="flex items-start gap-2">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-gray-500 line-through">
                      {item.bad}
                    </p>
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      {item.good}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  THE PROBLEM                                                 */}
        {/* ============================================================ */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                This is happening right now
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                While you&apos;re reading this, you&apos;re losing a $2,500 job.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "You don't have a real website",
                  body: `A Facebook page isn't a website. A site from 2019 isn't a website. When someone ${areaIn} searches for your service, you either look like the obvious choice — or you don't show up at all. There's no in-between anymore.`,
                },
                {
                  icon: Star,
                  title: "You don't have enough reviews",
                  body: "93% of customers read reviews before calling. Your competitor has dozens of stars glowing on Google. The math makes the decision for them — before they ever see your work.",
                },
                {
                  icon: PhoneCall,
                  title: "Google can't tell who you are",
                  body: `You might be the best in a 50-mile radius. Doesn't matter. Google ranks what it can understand: fast sites, clear service pages, consistent activity, and real reviews. Everything else gets buried on page 2. And nobody goes to page 2.`,
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <card.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  WHAT WE DO                                                  */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                The system
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                The two-part system that turns Google searches into booked jobs
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                A better website gets prospects to trust you. Consistent review
                requests make Google and future customers trust you.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Service 1 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 sm:h-64">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=website+design+modern&w=800&auto=format&fit=crop"
                    alt="Professional website on laptop"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      Included
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      A Website Built to Make People Call
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    We rebuild the first impression customers see on Google:
                    fast mobile pages, clear service areas, tap-to-call buttons,
                    and proof that makes you feel like the obvious choice.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      "Mobile-first pages built for callers",
                      "Tap-to-call CTAs above the fold",
                      "Service + city pages Google can understand",
                      "Reviews, licenses, warranties, and proof placed where buyers look",
                      "Monthly edits included as your business changes",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Service 2 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 sm:h-64">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=phone+reviews+business&w=800&auto=format&fit=crop"
                    alt="Customer leaving a review on phone"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      Included
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Review Requests That Happen After Every Job
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Your team should not have to remember to ask. Every customer
                    gets a simple, compliant request by text or email, so new
                    reviews keep showing up while you focus on the work.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      "Request sent after every completed job",
                      "Direct Google review link",
                      "Private feedback channel for service recovery",
                      "Review growth tracked monthly",
                      "Works by text and email",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  PROOF PREVIEW                                               */}
        {/* ============================================================ */}
        <section className="border-y border-gray-200 bg-white py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                What your audit shows
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                We show the leak before we sell the fix.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Your free audit compares your website, Google profile, reviews,
                and calls-to-action against the businesses already taking the
                jobs you want. The goal is simple: make the next step obvious.
              </p>
              <div className="mt-6 grid gap-3">
                {proofStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      {stat.label}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-md bg-white px-2.5 py-1 text-gray-500 line-through ring-1 ring-gray-200">
                        {stat.before}
                      </span>
                      <ArrowRight className="h-4 w-4 text-orange-500" />
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {stat.after}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-950 p-4 shadow-xl sm:p-6">
              <div className="rounded-xl bg-white p-5">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-orange-600">
                      Sample audit snapshot
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">
                      Smith&apos;s Plumbing vs. top 3 competitors
                    </h3>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-200">
                    48 hrs
                  </span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Mobile speed", "41/100", "Slow load loses emergency calls"],
                    ["Review gap", "-38", "Competitors have more recent proof"],
                    ["CTA score", "C-", "Phone number hidden below the fold"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs font-semibold text-gray-500">{label}</div>
                      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="text-sm font-bold text-orange-900">
                    Biggest fix first
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-orange-800">
                    Rebuild the first mobile viewport around emergency calls,
                    proof, and service area clarity before spending more on ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  RESULTS / SOCIAL PROOF                                      */}
        {/* ============================================================ */}
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Real numbers from real businesses
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                They were skeptical too. Then the phone started ringing.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-gray-700 bg-gray-800/50 p-6"
                >
                  <StarRating count={5} />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-300">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {t.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {t.trade} -- {t.location}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-700">
                        {t.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  HOW IT WORKS                                                */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Simple process
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                We do the work. You do your job.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-0 md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Free Audit",
                  desc: `We analyze your current online presence ${areaIn}: website speed, Google ranking, review count vs. competitors, conversion leaks. You get a clear report within 48 hours.`,
                  icon: Shield,
                },
                {
                  step: "02",
                  title: "We Build It",
                  desc: "Your professional website and review automation system get built and launched. Takes about a week. You answer a few questions. We handle the rest.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Reviews Stack Up",
                  desc: "The automation kicks in. After every job, your customers get prompted to leave a review. No effort from you. Reviews start compounding.",
                  icon: Star,
                },
                {
                  step: "04",
                  title: "Phone Rings More",
                  desc: `Better website + more reviews + local SEO = you show up first when someone ${areaIn} searches for your service. The calls come to you.`,
                  icon: PhoneCall,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={cl(
                    "relative p-6 sm:p-8",
                    i < 3 &&
                      "after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-10 after:-translate-x-1/2 after:bg-gray-200 md:after:bottom-auto md:after:left-auto md:after:right-0 md:after:top-1/2 md:after:h-10 md:after:w-px md:after:-translate-y-1/2 md:after:translate-x-0"
                  )}
                >
                  <div className="text-xs font-bold text-orange-500">
                    STEP {s.step}
                  </div>
                  <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <s.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  PRICING                                                     */}
        {/* ============================================================ */}
        <section className="border-y border-gray-200 bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {/* Intro */}
            <div className="mb-10 text-center">
              <p className="mx-auto max-w-2xl text-base text-gray-600">
                Every plan includes a professionally built website at no extra charge. No setup fees. No long-term contracts. And when you sign up, we lock in your trade {areaIn} — we never take on a direct competitor in your market. The difference between the two plans is how aggressively you want to go after the top spot.
              </p>
            </div>

            {/* Two-column cards */}
            <div className="grid gap-8 md:grid-cols-2 md:items-start">

              {/* Plan 1 — The Full System */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-200 bg-gray-900 px-6 py-8 text-center sm:px-10">
                  <p className="text-sm font-semibold text-orange-400">The Full System</p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-white">$399</span>
                    <span className="text-lg font-semibold text-gray-400">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">No setup fee. No contract. Cancel anytime.</p>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-5 rounded-xl bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-orange-800">We build your website free.</p>
                    <p className="mt-1 text-xs text-orange-700">Most agencies charge $1,000–$2,000 just to get started. You pay nothing upfront. Your site goes live in about a week.</p>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { title: "Professional website — built free", desc: "Hosted and managed for you (worth $1,000–$2,000 to build, $99–$199/mo elsewhere)" },
                      { title: "Google review automation", desc: "SMS + email requests after every job — reviews stack while you sleep" },
                      { title: "Missed call text-back", desc: "Miss a call? An auto-text goes out in seconds so the lead doesn't call your competitor" },
                      { title: "Monthly performance report", desc: "Reviews gained, ranking movement, call volume — proof it's working" },
                      { title: "Exclusive territory", desc: `One business per trade ${areaIn}. Your spot is protected.` },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                          <span className="text-sm text-gray-500"> — {item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs text-gray-500 text-center">For contractors who want to look like the obvious choice online and have their phone ring more.</p>
                  <a href="#get-started" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700">
                    Claim Your Spot <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Plan 2 — Market Dominator */}
              <div className="overflow-hidden rounded-2xl border-2 border-violet-500 bg-white shadow-xl md:scale-[1.02]">
                <div className="border-b border-violet-800 bg-gray-900 px-6 py-8 text-center sm:px-10 relative">
                  <span className="absolute top-3 right-3 rounded-full bg-violet-500 px-3 py-1 text-xs font-bold text-white">Best Value</span>
                  <p className="text-sm font-semibold text-violet-400">Market Dominator</p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-white">$697</span>
                    <span className="text-lg font-semibold text-gray-400">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">No setup fee. No contract. Cancel anytime.</p>
                </div>
                <div className="p-6 sm:p-8">
                  <p className="mb-5 text-sm text-gray-600">Everything in The Full System, plus we go after the top spot in your market and don&apos;t stop until you own it.</p>
                  <ul className="space-y-4">
                    {[
                      { title: "Everything in The Full System", desc: "Website, review automation, missed call text-back, monthly report, exclusive territory" },
                      { title: "Full SEO audit", desc: "Exactly where competitors beat you and what we're doing about it — no vague reports" },
                      { title: "Google Business Profile deep build-out", desc: "Right categories, photos, descriptions — all the signals Google uses to rank you in the Map Pack" },
                      { title: "Citation cleanup across 30+ directories", desc: "So Google knows exactly who you are, where you are, and what you do" },
                      { title: "Local backlink gap analysis", desc: "Who's linking to your competitors but not you — and how we fix that" },
                      { title: "Quarterly strategy call", desc: "Rankings, review growth, and your next 90 days" },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                          <Check className="h-3.5 w-3.5 text-violet-700" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                          <span className="text-sm text-gray-500"> — {item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs text-gray-500 text-center">For contractors who want to lock down the number one spot before a competitor does.</p>
                  <a href="#get-started" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-violet-700">
                    Own My Market <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>

            </div>

            {/* Trial nudge */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Not ready to commit at full price?{" "}
              <a href="#get-started" className="font-semibold text-orange-600 hover:underline">Ask about our first-month trial offer.</a>
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  INDUSTRIES                                                  */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Built for businesses that do real work
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We specialize in local service businesses. If your customers find
                you on Google and call you for a job, we can help.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                "HVAC",
                "Plumbing",
                "Electrical",
                "Landscaping",
                "Roofing",
                "Painting",
                "Pest Control",
                "Cleaning Services",
                "Auto Repair",
                "Salons & Barbershops",
                "Restaurants",
                "Dentists",
                "Chiropractors",
                "Handyman Services",
                "Pool Services",
                "Moving Companies",
              ].map((trade) => (
                <span
                  key={trade}
                  className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  {trade}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FAQ                                                         */}
        {/* ============================================================ */}
        <section className="border-t border-gray-200 bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Common questions
            </h2>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6">
              {faqs.map((faq, i) => (
                <FaqItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  toggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  SCARCITY BANNER                                             */}
        {/* ============================================================ */}
        <section className="bg-gray-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
              </span>
              <p className="text-sm font-semibold text-white">
                We only take <span className="text-orange-400">1 business per trade</span> {areaIn}.
                Once your spot is claimed, it&apos;s gone.
              </p>
            </div>
            <a
              href="#get-started"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Check Availability
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  LEAD FORM                                                   */}
        {/* ============================================================ */}
        <section id="get-started" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl lg:grid lg:grid-cols-2">
              {/* Left */}
              <div className="bg-gray-900 p-8 sm:p-12">
                <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                  Free audit
                </p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Find out exactly why you&apos;re not ranking {areaIn}.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-400">
                  Fill out the form. Within 48 hours, you&apos;ll get a clear
                  breakdown of what&apos;s holding you back online -- your
                  website speed, review count vs. competitors, ranking gaps, and
                  the specific fixes that will make the biggest difference.
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: Clock,
                      title: "48-hour turnaround",
                      desc: "Not a generic report. A real audit of your specific business.",
                    },
                    {
                      icon: Users,
                      title: "No obligation",
                      desc: "If we're not a fit, you still keep the audit. It's yours.",
                    },
                    {
                      icon: Shield,
                      title: "Your information stays private",
                      desc: "We don't sell data. We don't spam. One follow-up call, that's it.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800">
                        <item.icon className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-sm text-gray-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex items-center gap-3 border-t border-gray-700 pt-6">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">
                      Rather talk to someone?
                    </div>
                    <a
                      href="tel:+17372605332"
                      className="text-sm font-semibold text-orange-400 hover:text-orange-300"
                    >
                      (737) 260-5332
                    </a>
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div className="p-8 sm:p-12">
                {status === "success" ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-gray-900">
                      We got your request.
                    </h3>
                    <p className="mt-2 text-base text-gray-600">
                      Your audit is being prepared. Expect it in your inbox
                      within 48 hours. Want to walk through it sooner? Call us at{" "}
                      <a
                        href="tel:+17372605332"
                        className="font-semibold text-orange-600"
                      >
                        (737) 260-5332
                      </a>
                      .
                    </p>
                    <a
                      href="tel:+17372605332"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
                    >
                      Call now
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">
                      Request your free audit
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Takes about 60 seconds. No commitment.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                      <div>
                        <label
                          htmlFor="opus-name"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Your name
                        </label>
                        <input
                          id="opus-name"
                          type="text"
                          value={form.name}
                          onChange={set("name")}
                          placeholder="John Smith"
                          autoComplete="name"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="opus-business"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Business name
                        </label>
                        <input
                          id="opus-business"
                          type="text"
                          value={form.business}
                          onChange={set("business")}
                          placeholder="Smith's Plumbing"
                          autoComplete="organization"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="opus-business-type"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            Trade or business type
                          </label>
                          <input
                            id="opus-business-type"
                            type="text"
                            value={form.businessType}
                            onChange={set("businessType")}
                            placeholder="Plumbing, HVAC, salon..."
                            autoComplete="organization-title"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="opus-service-area"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            City or service area
                          </label>
                          <input
                            id="opus-service-area"
                            type="text"
                            value={form.serviceArea}
                            onChange={set("serviceArea")}
                            placeholder={city || "Austin, TX"}
                            autoComplete="address-level2"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="opus-website"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Current website
                          <span className="font-normal text-gray-400">
                            {" "}optional
                          </span>
                        </label>
                        <input
                          id="opus-website"
                          type="url"
                          value={form.website}
                          onChange={set("website")}
                          placeholder="https://smithplumbing.com"
                          autoComplete="url"
                          inputMode="url"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="opus-google-profile"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Google Business Profile link
                          <span className="font-normal text-gray-400">
                            {" "}optional
                          </span>
                        </label>
                        <input
                          id="opus-google-profile"
                          type="url"
                          value={form.googleProfile}
                          onChange={set("googleProfile")}
                          placeholder="Paste your Google profile link if you have it"
                          inputMode="url"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="opus-phone"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            Phone
                          </label>
                          <input
                            id="opus-phone"
                            type="tel"
                            value={form.phone}
                            onChange={set("phone")}
                            placeholder="(555) 123-4567"
                            autoComplete="tel"
                            inputMode="tel"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="opus-email"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            Email
                          </label>
                          <input
                            id="opus-email"
                            type="email"
                            value={form.email}
                            onChange={set("email")}
                            placeholder="john@smithplumbing.com"
                            autoComplete="email"
                            inputMode="email"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className={cl(
                          "flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700",
                          status === "submitting" && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {status === "submitting"
                          ? "Sending..."
                          : "Get My Free Audit"}
                        {status !== "submitting" && (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </button>

                      {status === "error" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          Please fill out your contact info, business type, and
                          service area so we can prepare the audit.
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        By submitting, you agree to a follow-up about your
                        audit results. No spam. Unsubscribe anytime.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FOOTER                                                      */}
        {/* ============================================================ */}
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold">Booked Out</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Websites + review automation for local service businesses.
              </p>
              <a
                href="tel:+17372605332"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Phone className="h-3.5 w-3.5" />
                (737) 260-5332
              </a>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Booked Out. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
