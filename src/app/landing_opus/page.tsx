"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { PublicFormTurnstile } from "@/components/public-form-turnstile";
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
          "text-2xl font-bold leading-tight tracking-tight [text-wrap:balance] sm:text-3xl",
          accent ? "text-orange-600" : "text-gray-900"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-600 [text-wrap:balance]">{label}</div>
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
  const [turnstileToken, setTurnstileToken] = useState("");
  const [contactTime, setContactTime] = useState("");

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
          turnstileToken,
          contact_time: contactTime,
          smsConsent: false,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTurnstileToken("");
      setContactTime("");

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
      a: "Maybe not. We audit what you have first. If the contact path works and the site clearly explains why customers should choose you, we improve what is already there. If it is creating friction, we rebuild only what the approved scope requires.",
    },
    {
      q: "How is this different from the last agency that burned me?",
      a: "We begin with an observable baseline, deploy tangible assets, test the customer path, and show the work completed every month. Business outcomes are reported only when they are client-reported or attribution-supported.",
    },
    {
      q: "What do I actually have to do?",
      a: "Join one kickoff, provide accurate business information and account access, and give consolidated approvals. We handle the audit, build, deployment, testing, review-request setup, and monthly evidence report.",
    },
    {
      q: "How fast will I see results?",
      a: "The site and workflows can launch quickly after we receive your materials, but outcomes vary by market, baseline, and customer volume. We establish your baseline and report what changes each month without guaranteeing a specific number of calls, reviews, or rankings.",
    },
    {
      q: "Do you offer territory exclusivity?",
      a: "Not by default. We limit founding-client capacity so service quality stays high. Any trade or geographic exclusivity must be defined in a separate written territory addendum.",
    },
    {
      q: "What happens if I want to cancel?",
      a: "You can cancel without a long-term contract. Service stays active through the paid billing period. After three paid months, you can request an export of the website content and core page files; before then, the managed site remains part of the Booked Out service.",
    },
    {
      q: "Do I own the website if I cancel?",
      a: "After three paid months, you can request an export of your website content and core page files for another provider to rebuild or migrate. Hosting, software integrations, automations, and third-party licenses remain part of the managed service.",
    },
    {
      q: "Are email, hosting, and reporting included?",
      a: "Yes. Hosting, monthly reporting, and the standard email-first review and follow-up workflows are included within the published founding scope.",
    },
    {
      q: "What happens in the first month?",
      a: "We audit your current presence, launch or improve the website, set up review requests for every customer, clean up obvious Google Business Profile gaps, and give you a first report showing what changed and what we are watching next.",
    },
  ];

  const proofStats = [
    { label: "Review gap", before: "Behind local leaders", after: "Baseline + neutral request workflow", note: "Measured against real local competitors" },
    { label: "Call clarity", before: "Calls hard to find", after: "Tap-to-call on key pages", note: "Mobile-first website rebuild" },
    { label: "Follow-up gap", before: "No defined response path", after: "Tested routing + email acknowledgment", note: "Manual-first founding workflow" },
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
            name: "Local Call System",
            price: "499",
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

  /* -- Transparent process proof ----------------------------------- */
  const proofCards = [
    {
      title: "Find the leaks",
      startingPoint: "Website, Google profile, reviews, and lead response",
      work: "Compare your business with the local competitors winning calls",
      deliverable: "A prioritized audit with the first fixes clearly ranked",
    },
    {
      title: "Install the system",
      startingPoint: "Disconnected pages, requests, and follow-up",
      work: "Launch the site, neutral review requests, and lead-response workflow",
      deliverable: "One managed system built around your real operation",
    },
    {
      title: "Measure your baseline",
      startingPoint: "Marketing activity without clear accountability",
      work: "Test contact paths and document review requests, lead handling, and approved changes",
      deliverable: "Monthly evidence, lessons, and the next actions to take",
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
            <span className="hidden rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 lg:inline-flex">
              Limited founding-client capacity
            </span>
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

      <main id="top" className="[text-wrap:pretty]">
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gray-50">
          {/* Subtle texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] sm:opacity-[0.055]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(249,250,251,0.42)_42%,rgba(249,250,251,0.92)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,rgba(249,250,251,1)_0%,rgba(249,250,251,0)_100%)]"
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

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 [text-wrap:balance] sm:text-5xl lg:text-6xl">
              You do great work{city ? ` ${areaIn}` : ""}.{" "}
              <span className="text-orange-600">So why does your competitor get the call?</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 [text-wrap:pretty] sm:text-xl">
              A good local business can still lose opportunities when its proof,
              contact path, and follow-up are inconsistent. We install and manage
              the customer-facing foundation that helps serious service businesses
              get found, earn trust, and respond consistently.
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
            <p className="mt-4 flex max-w-2xl items-start gap-2 text-sm font-medium leading-relaxed text-gray-600">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              Your free Revenue Leak Snapshot documents review gaps, customer-path
              friction, and follow-up risks before we recommend any work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge>No long contracts</Badge>
              <Badge>Audit before we recommend a plan</Badge>
              <Badge>Compliant review requests</Badge>
              <Badge>Built for established home services</Badge>
            </div>

            {/* Stats strip */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard value="Review gap" label="competitor proof" accent />
              <StatCard value="Ranking gap" label="trust signals" />
              <StatCard value="Site speed" label="speed leaks" />
              <StatCard value="Lead speed" label="reply risk" />
            </div>
            <p className="mt-3 text-xs text-gray-500 [text-wrap:balance]">
              We show the gaps before we recommend a plan.
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
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                See exactly what changed and what needs attention next.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 [text-wrap:pretty]">
                We document the baseline, deploy the agreed foundation, test the
                customer path, and report completed work separately from business
                outcomes. You keep control of your accounts and data.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  bad: "Locked into a 12-month contract",
                  good: "Month-to-month. Stay for results.",
                  icon: X,
                },
                {
                  bad: "Paid for reports you couldn't measure",
                  good: "Track calls, reviews, and leads.",
                  icon: X,
                },
                {
                  bad: "Never talked to the same person twice",
                  good: "Same team. Direct line.",
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
                Where the calls disappear
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                Your next customer chooses from Google first.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600 [text-wrap:pretty]">
                If your site, reviews, and Google profile do not answer their
                questions fast, the call goes to someone else.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "Your website loses the first impression",
                  body: "Customers decide fast. If your site is slow, dated, hard to use on mobile, or missing clear service areas, they leave before they ever see how good your work is.",
                },
                {
                  icon: Star,
                  title: "Your competitor looks safer to call",
                  body: "Reviews are proof when people do not know you yet. If the company next to you has more recent Google reviews, they win trust before the estimate even starts.",
                },
                {
                  icon: PhoneCall,
                  title: "New leads go cold while your team is busy",
                  body: "When someone needs help now, 20 minutes is enough time to contact two or three other companies. Fast follow-up keeps the lead warm until your team can take over.",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <card.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900 [text-wrap:balance]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 [text-wrap:pretty]">
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
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                Three moves that turn Google searches into booked jobs
              </h2>
              <p className="mt-4 text-lg text-gray-600 [text-wrap:pretty]">
                A better website gets prospects to trust you. Consistent review
                requests build proof. Fast follow-up keeps new leads warm before
                they call the next company.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Service 1 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 sm:h-64">
                  <Image
                    src="/marketing/website-call-system.png"
                    alt="Mobile-first local service website with call buttons and trust proof"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
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
                  <Image
                    src="/marketing/review-request-system.png"
                    alt="Automated review request flow with text message and five-star review card"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
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
                      "Separate service feedback form for every customer",
                      "Review growth tracked monthly",
                      "Email-first workflow for the founding launch",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Service 3 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 bg-gray-950 p-5 sm:h-64">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.25),transparent_34%),linear-gradient(180deg,rgba(17,24,39,1),rgba(3,7,18,1))]" />
                  <div className="relative flex h-full flex-col justify-end">
                    <div className="mb-5 max-w-[92%] rounded-2xl rounded-bl-sm bg-white p-3 text-sm font-medium leading-relaxed text-gray-800 shadow-lg">
                      We received your AC service request and sent the details to the team responsible for the next step.
                    </div>
                    <span className="w-fit rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      Included
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Fast Follow-Up Before Leads Go Cold
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Most marketing stops when the lead comes in. We test where
                    website inquiries go, prepare a clear acknowledgment email,
                    and give the team a manual-first response process.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      "Tested form routing to the responsible inbox",
                      "Clear email acknowledgment copy",
                      "Service, urgency, and location fields captured",
                      "Lead details organized before the callback",
                      "Response handling reviewed in reporting",
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
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                We show the leak before we sell the fix.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600 [text-wrap:pretty]">
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
                    <h3 className="mt-1 text-lg font-bold text-gray-900 [text-wrap:balance]">
                      Smith&apos;s Plumbing vs. top 3 competitors
                    </h3>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-200">
                    48 hrs
                  </span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Mobile speed", "41/100", "Slow on mobile"],
                    ["Review gap", "-38", "Fresher competitor proof"],
                    ["CTA score", "C-", "Phone buried low"],
                    ["Lead speed", "20+ min", "Slow replies lose jobs"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs font-semibold text-gray-500">{label}</div>
                      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 [text-wrap:balance]">{note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="text-sm font-bold text-orange-900">
                    Biggest fix first
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-orange-800 [text-wrap:pretty]">
                    Rebuild the first mobile viewport around emergency calls,
                    proof, service area clarity, and fast follow-up before
                    spending more on ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  TRANSPARENT PROCESS PROOF                                   */}
        {/* ============================================================ */}
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Process proof, not borrowed claims
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white [text-wrap:balance] sm:text-4xl">
                See exactly what we inspect, install, and measure.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-400 [text-wrap:pretty]">
                We are building our first verified case studies. Until then, we
                show the work clearly and measure every client from their own baseline.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {proofCards.map((card, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-gray-700 bg-gray-800/50 p-6"
                >
                  <div className="text-sm font-bold uppercase tracking-wider text-orange-400">
                    {card.title}
                  </div>
                  <div className="mt-5 space-y-3 rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                    {[
                      ["Starting point", card.startingPoint],
                      ["Our work", card.work],
                      ["You receive", card.deliverable],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[92px_1fr] gap-3 text-sm">
                        <div className="font-semibold text-gray-500">
                          {label}
                        </div>
                        <div
                          className={cl(
                            "font-semibold",
                            label === "You receive" ? "text-emerald-300" : "text-gray-200"
                          )}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
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
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                We do the work. You do your job.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-0 md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Find the leaks",
                  desc: "We compare your website, reviews, Google profile, and competitors so you know exactly where calls are leaking.",
                  icon: Shield,
                },
                {
                  step: "02",
                  title: "Fix the first impression",
                  desc: "We launch the pages, CTAs, trust proof, and review system that make you easier to choose.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Ask every customer",
                  desc: "Every completed job triggers a compliant review request by text or email, so recent proof keeps building.",
                  icon: Star,
                },
                {
                  step: "04",
                  title: "Turn trust into calls",
                  desc: "Better pages, stronger reviews, and clearer Google signals help more ready-to-buy customers call you first.",
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
                  <h3 className="mt-4 text-base font-bold text-gray-900 [text-wrap:balance]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 [text-wrap:pretty]">
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
              <p className="mx-auto max-w-2xl text-base text-gray-600 [text-wrap:pretty]">
                The founding Local Call System is a 90-Day Booking Foundation:
                website, Google Business Profile foundation, review requests by
                email, supported lead follow-up, and evidence reporting. The first
                3 accepted clients receive setup at no additional charge.
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl gap-8">

              {/* Plan 1 — Local Call System */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-200 bg-gray-900 px-6 py-8 text-center sm:px-10">
                  <p className="text-sm font-semibold text-orange-400">Local Call System</p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-white">$499</span>
                    <span className="text-lg font-semibold text-gray-400">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">Founding offer: first 3 clients, setup included, month-to-month.</p>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-5 rounded-xl bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-orange-800">90-Day Booking Foundation</p>
                    <p className="mt-1 text-xs text-orange-700 [text-wrap:pretty]">A defined launch, a tested customer path, and monthly evidence without an outcome guarantee.</p>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { title: "Managed mobile-first website", desc: "Built around service areas, proof, and tap-to-call CTAs" },
                      { title: "Google Business Profile foundation", desc: "Documented corrections to core business, service, and trust information" },
                      { title: "Review requests by email", desc: "Neutral requests for eligible customers, without review gating" },
                      { title: "Supported form-lead follow-up", desc: "Acknowledgment copy, routing tests, and a manual-first follow-up process" },
                      { title: "Lead inbox + simple pipeline", desc: "A clear place to review opportunities and required next actions" },
                      { title: "Monthly evidence report", desc: "Completed work, tested paths, observable activity, and next priorities" },

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
                  <p className="mt-6 text-center text-xs text-gray-500 [text-wrap:balance]">For service businesses that want the essentials handled well.</p>
                  <a href="#get-started" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700">
                    Start With the Audit <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>


            </div>

            {/* Trial nudge */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Start with the free audit.{" "}
              <a href="#get-started" className="font-semibold text-orange-600 hover:underline">If we can&apos;t show a clear path to more calls, you should not buy.</a>
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-gray-500 [text-wrap:pretty]">
              Founding scope covers one business, one location, one domain, one
              Google Business Profile, and email-first workflows. Additional
              locations, custom integrations, advertising, or high-volume work
              require a separate written scope.
            </p>

            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              <p className="font-bold">30-Day Foundation Promise</p>
              <p className="mt-1 leading-relaxed">
                Once required access, accurate information, and approvals are in,
                we complete the agreed core foundation within 30 days. If a Booked
                Out delay causes us to miss that delivery commitment, the next
                service month is not charged until the agreed foundation is complete.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  INDUSTRIES                                                  */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
                Built for businesses that do real work
              </h2>
              <p className="mt-4 text-lg text-gray-600 [text-wrap:pretty]">
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
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 [text-wrap:balance] sm:text-4xl">
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
        {/*  FOUNDING CAPACITY                                           */}
        {/* ============================================================ */}
        <section className="bg-gray-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
              </span>
              <p className="text-sm font-semibold text-white [text-wrap:balance]">
                Founding capacity is limited to <span className="text-orange-400">3 qualified home-service companies</span> so implementation stays hands-on.
              </p>
            </div>
            <a
              href="#get-started"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Request a Fit Review
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
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white [text-wrap:balance] sm:text-4xl">
                  See what is keeping you from ranking {areaIn}.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-400 [text-wrap:pretty]">
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
                      desc: "We don't sell your data. Follow-up stays focused on your audit, and you can opt out anytime.",
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
                    <p className="mt-2 text-base text-gray-600 [text-wrap:pretty]">
                      We are reviewing the available source data and will email
                      the next step. Want to talk through the priorities? Call us at{" "}
                      <a
                        href="tel:+17372605332"
                        className="font-semibold text-orange-600"
                      >
                        (737) 260-5332
                      </a>
                      .
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <a
                        href="/go/book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
                      >
                        Schedule audit review
                        <Clock className="h-4 w-4" />
                      </a>
                      <a
                        href="tel:+173****5332"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                      >
                        Call now
                        <Phone className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">
                      Request your free audit
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 [text-wrap:balance]">
                      Takes about 60 seconds. No commitment.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                      <div
                        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                        aria-hidden="true"
                      >
                        <label htmlFor="opus-contact-time">Contact time</label>
                        <input
                          id="opus-contact-time"
                          name="contact_time"
                          type="text"
                          value={contactTime}
                          onChange={(event) => setContactTime(event.target.value)}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>
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


                      <PublicFormTurnstile
                        action="inbound_lead"
                        onToken={setTurnstileToken}
                      />

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

                      <p className="text-xs text-gray-400 [text-wrap:pretty]">
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
              <p className="mt-2 text-sm text-gray-500 [text-wrap:balance]">
                Websites, reviews, and fast follow-up for local service
                businesses.
              </p>
              <a
                href="tel:+17372605332"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Phone className="h-3.5 w-3.5" />
                (737) 260-5332
              </a>
            </div>
            <div className="flex flex-col gap-3 text-xs text-gray-400 sm:items-end">
              <p>
                &copy; {new Date().getFullYear()} Booked Out. All rights
                reserved.
              </p>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-gray-700">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-gray-700">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
