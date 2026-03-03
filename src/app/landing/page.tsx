"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  Phone,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";

type GeoResponse = { city?: string; region?: string };

type LeadPayload = {
  name: string;
  business: string;
  phone: string;
  email: string;
  source: "landing_v3";
  city: string;
};

const COLORS = {
  navy: "#0f172a",
  blue: "#3b82f6",
  orange: "#f97316",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isNonEmpty(v: string) {
  return v.trim().length > 0;
}

function SkeletonText({ w = "w-44" }: { w?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block h-7 rounded-md bg-white/10 align-middle",
        "animate-pulse",
        w
      )}
    />
  );
}

function Stars({ value = 5 }: { value?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cx(
            "h-4 w-4",
            i < value ? "text-amber-400 fill-amber-400" : "text-white/20"
          )}
        />
      ))}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        {kicker}
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-200">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const [geoLoading, setGeoLoading] = useState(true);
  const [city, setCity] = useState<string>("your area");
  const [region, setRegion] = useState<string>("Texas");

  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({
    website: false,
    doAnything: false,
    cities: false,
    speed: false,
  });

  const [form, setForm] = useState({
    name: "",
    business: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | "success" | "error">(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/geo", { method: "GET" });
        const data = (await res.json()) as GeoResponse;
        if (!alive) return;

        const nextCity = data?.city && isNonEmpty(data.city) ? data.city : "your area";
        const nextRegion =
          data?.region && isNonEmpty(data.region) ? data.region : "Texas";

        setCity(nextCity);
        setRegion(nextRegion);
      } catch {
        if (!alive) return;
        setCity("your area");
        setRegion("Texas");
      } finally {
        if (!alive) return;
        setGeoLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const dynamic = useMemo(() => {
    const c = city || "your area";
    return {
      heroHeadline: geoLoading ? (
        <>
          Your <SkeletonText w="w-32" /> Neighbors Are Already Searching for You.
          <span className="text-blue-400"> Are They Finding You?</span>
        </>
      ) : (
        <>
          Your <span className="text-blue-400">{c}</span> Neighbors Are Already
          Searching for You. <span className="text-blue-400">Are They Finding You?</span>
        </>
      ),
      problemLead: `Right now, someone in ${c} is searching for your service...` ,
      scarcity: `We only work with 1 business per trade in ${c}.`,
      activity: `3 businesses from ${c} requested a free audit this week`,
      finalCta: `Ready to Get Found in ${c}?`,
    };
  }, [city, geoLoading]);

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(null);

    const payload: LeadPayload = {
      name: form.name.trim(),
      business: form.business.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: "landing_v3",
      city: (city || "your area").trim() || "your area",
    };

    if (!payload.name || !payload.business || !payload.phone || !payload.email) {
      setSubmitted("error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/inbound", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setSubmitted("error");
        return;
      }

      setSubmitted("success");
      setForm({ name: "", business: "", phone: "", email: "" });
    } catch {
      setSubmitted("error");
    } finally {
      setSubmitting(false);
    }
  }

  const contractorImage =
    "https://images.unsplash.com/photo-1581579188871-c4b6f0634f5e?q=plumber+working&w=1200&auto=format&fit=crop";
  const workImage =
    "https://images.unsplash.com/photo-1541976590-713941681591?q=hvac+technician&w=1200&auto=format&fit=crop";

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{ backgroundColor: COLORS.navy }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-orange-500/15 blur-3xl" />
      </div>

      {/* 1) Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f172a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Shield className="h-5 w-5 text-blue-400" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">
              Booked Out
            </span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="tel:+15125550100"
              className="hidden items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-orange-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 sm:inline-flex"
            >
              <Phone className="h-4 w-4" />
              (512) 555-0100
            </a>
            <a
              href="#audit"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95"
              style={{ backgroundColor: COLORS.orange }}
            >
              Get Free Audit
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* 2) Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={contractorImage}
              alt="Contractor at work"
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/60 via-[#0f172a]/85 to-[#0f172a]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                {geoLoading ? (
                  <span className="opacity-80">Local visibility audit</span>
                ) : (
                  <span className="opacity-90">Local visibility audit for {city}, {region}</span>
                )}
              </div>

              <h1
                className={cx(
                  "mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl",
                  geoLoading ? "opacity-95" : "opacity-100",
                  "transition-opacity duration-500"
                )}
              >
                {dynamic.heroHeadline}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
                If your website is slow, your reviews are stale, or Google can’t tell
                who to rank… you’re bleeding calls.
                <span className="text-white"> We fix it</span> with a professional
                website + review automation built for contractors.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#audit"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:brightness-95"
                  style={{ backgroundColor: COLORS.orange }}
                >
                  Get My Free Audit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-3.5 text-base font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10"
                >
                  See Pricing
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {["No contracts", "Results in 30 days", "1 business per city"].map(
                  (t) => (
                    <div
                      key={t}
                      className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10"
                    >
                      <Check className="h-3.5 w-3.5 text-blue-400" />
                      {t}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="mx-auto max-w-xl">
                <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 shadow-2xl shadow-black/30">
                  <div className="overflow-hidden rounded-2xl bg-slate-950/30 ring-1 ring-white/10">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/90" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
                      </div>
                      <div className="hidden flex-1 px-4 sm:block">
                        <div className="truncate rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                          google.com — “{geoLoading ? "plumber near me" : `plumber near me ${city.toLowerCase()}` }”
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">What customers see</div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">Before</div>
                            <div className="mt-1 text-sm text-slate-200">
                              Slow website. Few reviews. Google shrugs.
                            </div>
                          </div>
                          <TrendingDown className="h-5 w-5 text-rose-400" />
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 rounded bg-white/10" />
                          <div className="h-2 w-4/5 rounded bg-white/10" />
                          <div className="h-2 w-3/5 rounded bg-white/10" />
                        </div>
                        <div className="mt-4 text-xs font-semibold text-white/70">
                          Missed calls: “We’ll call someone else.”
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">After</div>
                            <div className="mt-1 text-sm text-slate-200">
                              Fast site + automated review requests.
                            </div>
                          </div>
                          <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-950/30 p-3 ring-1 ring-white/10">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-white">Google Reviews</div>
                            <div className="text-xs font-semibold text-emerald-300">+47 reviews</div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Stars value={5} />
                            <span className="text-xs text-white/70">4.9 avg</span>
                          </div>
                        </div>

                        <div className="mt-4 text-xs font-semibold text-white/70">
                          More calls in 30 days — without chasing people.
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                          { icon: Clock, title: "Results in 30 days", desc: "Rank + reviews + calls" },
                          { icon: Smartphone, title: "Mobile-first", desc: "Built for thumb scroll" },
                          { icon: BadgeCheck, title: "Done-for-you", desc: "We build. We launch." },
                        ].map((b) => (
                          <div key={b.title} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                            <b.icon className="h-4 w-4 text-blue-400" />
                            <div className="mt-2 text-sm font-semibold text-white">{b.title}</div>
                            <div className="mt-1 text-xs text-slate-200">{b.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-white/60">
                  No contracts. Cancel anytime. We win by getting you found.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3) Problem */}
        <section id="problem" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="This is why you’re losing calls"
            title="Google doesn’t reward ‘good enough’ anymore"
            desc="Fear first: if you don’t look like the obvious choice online, customers in your city move on in seconds. Relief next: we make you the obvious choice."
          />

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "No real website",
                desc: "A Facebook page isn’t a website. When someone in your city searches, you look untrustworthy — and they click your competitor.",
              },
              {
                icon: Star,
                title: "Not enough reviews",
                desc: "Customers filter by stars. If you have 0–10 reviews, you’re invisible next to the guy with 47.",
              },
              {
                icon: Search,
                title: "Competitors outrank you",
                desc: "Even if you do great work, Google ranks what it can understand: fast site, clear services, consistent activity.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
                  <p.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  <span className="font-semibold text-white">{dynamic.problemLead}</span> {p.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-gradient-to-r from-orange-500/15 via-white/5 to-blue-600/15 p-6 ring-1 ring-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  Stop guessing. Get the exact fixes.
                </div>
                <div className="mt-1 text-sm text-slate-200">
                  We’ll show you what’s blocking calls in <span className="text-white">{city}</span> and what to change first.
                </div>
              </div>
              <a
                href="#audit"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95"
                style={{ backgroundColor: COLORS.orange }}
              >
                Get My Free Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 4) Services Bento Grid */}
        <section id="services" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Everything you need to win locally"
            title="Websites + reviews + local SEO — packaged for contractors"
            desc="You don’t need 12 vendors. You need one system that makes Google trust you and customers choose you."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="md:col-span-7 rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-400/20">
                  <Globe className="h-6 w-6 text-orange-300" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Professional Website</div>
                  <div className="text-sm text-slate-200">
                    Fast, modern, built to convert calls and quote requests.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { icon: Smartphone, t: "Mobile-first layout", d: "Thumb-friendly, tap-to-call, clear CTAs." },
                  { icon: Shield, t: "Trust builders", d: "Licensing, badges, warranties, and proof." },
                  { icon: Clock, t: "Speed optimized", d: "Fast loads = higher rank + higher conversion." },
                  { icon: Wrench, t: "Trade-specific copy", d: "HVAC, plumbing, landscaping, electrical." },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <x.icon className="h-5 w-5 text-blue-400" />
                    <div className="mt-3 text-sm font-semibold text-white">{x.t}</div>
                    <div className="mt-1 text-sm text-slate-200">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 grid grid-cols-1 gap-5">
              {[ 
                {
                  title: "Google Review Automation",
                  desc: "Turn jobs into 5-star reviews automatically — no awkward asking.",
                  icon: Star,
                  accent: "text-amber-300",
                },
                {
                  title: "Local SEO",
                  desc: "City + service pages that Google understands and ranks.",
                  icon: MapPin,
                  accent: "text-blue-300",
                },
                {
                  title: "Mobile Optimized",
                  desc: "Tap-to-call, fast loads, clean layout. No friction.",
                  icon: Smartphone,
                  accent: "text-emerald-300",
                },
                {
                  title: "Done For You",
                  desc: "We build, launch, and keep it running. You stay focused on jobs.",
                  icon: Shield,
                  accent: "text-orange-300",
                },
              ].map((s) => (
                <div
                  key={s.title}
                  className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-white">{s.title}</div>
                      <div className="mt-1 text-sm text-slate-200">{s.desc}</div>
                    </div>
                    <s.icon className={cx("h-6 w-6", s.accent)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-7">
                <div className="text-sm font-semibold text-white/80">What this solves</div>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  {[
                    "You stop losing the ‘near me’ searches.",
                    "You build trust fast with reviews and proof.",
                    "You become the obvious choice in your city.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/20">
                        <Check className="h-3.5 w-3.5 text-blue-300" />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img
                  src={workImage}
                  alt="Technician working"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/40 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* 5) Social proof */}
        <section id="proof" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Proof beats promises"
            title="0 reviews → 47 reviews in 60 days"
            desc="That’s what happens when review requests run automatically after every job — and your website actually converts the traffic Google sends you."
          />

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[ 
              {
                name: "Mark T.",
                trade: "HVAC",
                city: "Round Rock",
                stars: 5,
                quote:
                  "We went from basically invisible to booked. The review automation alone paid for this in the first month.",
              },
              {
                name: "Javier R.",
                trade: "Plumbing",
                city: "Cedar Park",
                stars: 5,
                quote:
                  "The site looks legit and the calls feel higher quality. People mention they saw our reviews before calling.",
              },
              {
                name: "Chris D.",
                trade: "Landscaping",
                city: "Leander",
                stars: 5,
                quote:
                  "I don’t chase reviews anymore. It just happens. We hit 47 reviews fast and my phone didn’t stop.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <Stars value={t.stars} />
                <p className="mt-4 text-sm leading-relaxed text-slate-200">“{t.quote}”</p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/70">
                      {t.trade} — {t.city}, TX
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                    <Check className="h-3.5 w-3.5" />
                    Verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6) Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Simple pricing"
            title="$399/mo — built for local service businesses"
            desc="No long contracts. No mystery retainers. Just a system designed to get you found and chosen."
          />

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-white/80">Booked Out Growth</div>
                  <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
                    $399<span className="text-base font-semibold text-white/70">/mo</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    <span className="font-semibold text-white">First 30 days free if no results.</span> We don’t win unless you do.
                  </div>
                </div>
                <div className="hidden sm:block rounded-2xl bg-orange-500/15 px-4 py-3 ring-1 ring-orange-400/20">
                  <div className="text-xs font-semibold text-orange-200">Scarcity</div>
                  <div className="mt-1 text-sm font-semibold text-white">{dynamic.scarcity}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  "Professional website built to convert",
                  "Google review automation (47+ in 60 days)",
                  "Local SEO pages for your service area",
                  "Ongoing updates + monitoring",
                  "Support by real humans",
                  "Cancel anytime",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/20">
                      <Check className="h-4 w-4 text-blue-300" />
                    </span>
                    <span className="text-sm text-slate-200">{t}</span>
                  </div>
                ))}
              </div>

              <a
                href="#audit"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:brightness-95"
                style={{ backgroundColor: COLORS.orange }}
              >
                Get My Free Audit
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>

              <div className="mt-3 text-center text-xs text-white/60">
                {dynamic.scarcity}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white/80">What you get first</div>
              <div className="mt-3 text-lg font-semibold text-white">Free audit in 24–48 hours</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                We’ll review your online presence and send a quick, brutally clear
                plan: what’s broken, what’s missing, and what to fix to win in {city}.
              </p>

              <div className="mt-6 space-y-3">
                {[ 
                  { icon: Search, t: "Ranking blockers", d: "Speed, content, local intent." },
                  { icon: Star, t: "Review gap", d: "What competitors have that you don’t." },
                  { icon: Phone, t: "Conversion leaks", d: "Where leads fall off." },
                ].map((x) => (
                  <div key={x.t} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
                      <x.icon className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{x.t}</div>
                      <div className="mt-1 text-sm text-slate-200">{x.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7) Activity counter */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <div className="text-sm font-semibold text-white">{dynamic.activity}</div>
              </div>
              <a
                href="#audit"
                className="inline-flex items-center justify-center rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10"
              >
                Claim My Spot
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 8) FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="FAQ"
            title="Quick answers before you book an audit"
            desc="If you’re serious about getting found locally, this is the fastest, lowest-risk way to start."
          />

          <div className="mt-10 mx-auto max-w-3xl space-y-4">
            {[
              {
                key: "website",
                q: "What if I already have a website?",
                a: "Perfect. We’ll audit it. If it’s fast and converting, we keep what works. If it’s slow or outdated, we rebuild what’s needed so Google (and customers) trust it.",
              },
              {
                key: "doAnything",
                q: "Do I need to do anything?",
                a: "Not much. We’ll ask a few quick questions about your services and service area. After that, we build and run the system. You focus on jobs.",
              },
              {
                key: "cities",
                q: "What cities do you serve?",
                a: "Texas suburbs and surrounding areas. The important part: we only work with 1 business per trade per city — so you’re not funding your competitor.",
              },
              {
                key: "speed",
                q: "How fast do I see results?",
                a: "Most businesses see movement within 30 days: faster site, better conversion, more reviews, stronger local signals. Review growth can be very quick — we’ve seen 47 reviews in 60 days.",
              },
            ].map((item) => {
              const open = !!faqOpen[item.key];
              return (
                <div key={item.key} className="rounded-3xl bg-white/5 ring-1 ring-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setFaqOpen((s) => ({ ...s, [item.key]: !s[item.key] }))
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-base font-semibold text-white">{item.q}</span>
                    <ChevronDown
                      className={cx(
                        "h-5 w-5 text-white/70 transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cx(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden px-6 pb-5">
                      <p className="text-sm leading-relaxed text-slate-200">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 9) Final CTA + Form */}
        <section id="audit" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500/15 via-white/5 to-blue-600/15 ring-1 ring-white/10">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
              <div className="lg:col-span-6 p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  No contracts · Results in 30 days
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {dynamic.finalCta}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Get a free audit that shows exactly why you’re not ranking and what
                  to fix first. If we can’t show results in the first 30 days, you don’t
                  pay.
                </p>

                <div className="mt-6 space-y-3">
                  {[ 
                    { icon: Check, t: "Audit delivered in 24–48 hours" },
                    { icon: Check, t: "Review plan to reach 47 reviews" },
                    { icon: Check, t: "We only work with 1 business per trade in your city" },
                  ].map((x) => (
                    <div key={x.t} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20">
                        <x.icon className="h-4 w-4 text-emerald-200" />
                      </span>
                      <span className="text-sm text-slate-200">{x.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#0b1224]/70 p-8 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Request your free audit</div>
                    <div className="mt-1 text-xs text-white/60">
                      You’ll get a response within 1 business day.
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                    <Phone className="h-3.5 w-3.5 text-orange-300" />
                    <a href="tel:+15125550100" className="text-orange-200 hover:text-orange-100">
                      (512) 555-0100
                    </a>
                  </div>
                </div>

                <form onSubmit={submitLead} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">Your name</span>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="Diego"
                        autoComplete="name"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">Business name</span>
                      <input
                        value={form.business}
                        onChange={(e) => setForm((s) => ({ ...s, business: e.target.value }))}
                        className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="Adept Plumbing"
                        autoComplete="organization"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">Phone</span>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="(512) 555-0100"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">Email</span>
                      <input
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        placeholder="you@business.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={cx(
                      "inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all",
                      submitting && "opacity-70"
                    )}
                    style={{ backgroundColor: COLORS.orange }}
                  >
                    {submitting ? "Sending…" : "Get My Free Audit"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>

                  {submitted === "success" && (
                    <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
                      <div className="font-semibold text-white">Request received.</div>
                      <div className="mt-1 text-emerald-100/90">
                        We’ll send your audit within 1 business day.
                      </div>
                    </div>
                  )}

                  {submitted === "error" && (
                    <div className="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/20">
                      <div className="font-semibold text-white">Double-check the form.</div>
                      <div className="mt-1 text-rose-100/90">
                        Please enter your name, business name, phone, and email.
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-white/60">
                    By requesting an audit, you agree to be contacted about your results.
                    No spam.
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 10) Footer */}
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <div className="text-base font-semibold text-white">Booked Out</div>
              <div className="mt-1 text-sm text-white/60">
                Websites + review automation for contractors in Texas suburbs.
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm">
                <a href="tel:+15125550100" className="inline-flex items-center gap-2 text-orange-200 hover:text-orange-100">
                  <Phone className="h-4 w-4" />
                  (512) 555-0100
                </a>
                <a
                  href="mailto:diego@trybookedout.com"
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-300" />
                  </span>
                  diego@trybookedout.com
                </a>
              </div>
            </div>

            <div className="text-xs text-white/50">© 2026 Booked Out</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
