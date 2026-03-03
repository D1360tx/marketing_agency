import type { Metadata } from "next";
import Link from "next/link";
import { AuditForm } from "@/components/audit-form";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Globe,
  MapPin,
  Phone,
  Search,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Booked Out | Modern Websites + Review Automation for Local Services",
  description:
    "Booked Out helps local service businesses get more calls with modern, fast websites and automated Google review requests. Launch in as little as 48 hours.",
};

export default function LandingPage() {
  return (
    <div className={inter.className}>
      <div className="min-h-screen bg-white text-slate-900">
        {/* Top glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_60%)]"
        />

        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a href="#top" className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm ring-1 ring-slate-900/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </span>
              <span className="text-base font-semibold tracking-tight text-slate-900">
                Booked Out
              </span>
            </a>

            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#services"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Services
              </a>
              <a
                href="#process"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                How it works
              </a>
              <a
                href="#results"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Results
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Contact
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
              >
                Sign in
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 ring-1 ring-blue-600/10 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30"
              >
                Get a free audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <main id="top" className="relative z-10">
          <section className="relative overflow-hidden bg-[#0F172A]">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80"
                alt="Contractor reviewing work"
                className="h-full w-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 via-[#0F172A]/80 to-[#0F172A]" />
            </div>

            <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-28">
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  Built for local service businesses
                </div>

                <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  A modern website that turns searches into
                  <span className="text-blue-400"> calls</span>.
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
                  Booked Out helps HVAC, plumbing, landscaping, and other local
                  service pros get more customers with lightning-fast websites
                  and automated Google review requests.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30"
                  >
                    Get my free audit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3.5 text-base font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/15"
                  >
                    View pricing
                  </a>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      icon: Clock,
                      title: "Live in 48 hours",
                      desc: "Fast turnaround, no bloated process.",
                    },
                    {
                      icon: Smartphone,
                      title: "Mobile-first",
                      desc: "Designed for thumb-scrolling customers.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Built to convert",
                      desc: "More calls, more quote requests.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                    >
                      <item.icon className="h-5 w-5 text-blue-400" />
                      <div className="mt-3 text-sm font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-200">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero: mock browser before/after */}
              <div className="lg:col-span-6">
                <div className="mx-auto max-w-xl">
                  <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/12 shadow-2xl shadow-black/30">
                    <div className="rounded-2xl bg-slate-950/50 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/90" />
                          <span className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
                        </div>
                        <div className="hidden flex-1 px-4 sm:block">
                          <div className="truncate rounded-lg bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                            yourbusiness.com
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          Before / After
                        </div>
                      </div>

                      <div className="grid grid-cols-2">
                        {/* Before */}
                        <div className="border-r border-white/10 p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                            Before
                          </div>
                          <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                            <div className="h-3 w-24 rounded bg-white/10" />
                            <div className="mt-3 space-y-2">
                              <div className="h-2 w-full rounded bg-white/10" />
                              <div className="h-2 w-5/6 rounded bg-white/10" />
                              <div className="h-2 w-4/6 rounded bg-white/10" />
                            </div>
                            <div className="mt-4 h-28 rounded-lg bg-white/10" />
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <div className="h-8 rounded-lg bg-white/10" />
                              <div className="h-8 rounded-lg bg-white/10" />
                            </div>
                            <div className="mt-4 text-xs text-slate-300">
                              Slow, outdated, hard to use on mobile.
                            </div>
                          </div>
                        </div>

                        {/* After */}
                        <div className="p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                            After
                          </div>
                          <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                            <div className="relative">
                              <img
                                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
                                alt="Tradesperson working"
                                className="h-28 w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <div className="text-sm font-semibold text-white">
                                  Get service today
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-200">
                                  <MapPin className="h-3.5 w-3.5" />
                                  Local • Fast • Trusted
                                </div>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-slate-900">
                                  Modern layout
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                  <Zap className="h-3.5 w-3.5" />
                                  Fast
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-slate-600">
                                Clear calls-to-action and mobile-friendly
                                sections.
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white">
                                  <Phone className="h-4 w-4" />
                                  Call now
                                </div>
                                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2 py-2 text-xs font-semibold text-white">
                                  <Star className="h-4 w-4" />
                                  Reviews
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mini phone mockup (CSS) */}
                          <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold text-slate-200">
                                Mobile preview
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Thumb-first
                              </div>
                            </div>
                            <div className="mt-3 flex justify-center">
                              <div className="relative h-40 w-28 rounded-[24px] bg-slate-950 ring-1 ring-white/15 shadow-lg shadow-black/30">
                                <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/10" />
                                <div className="absolute inset-2 overflow-hidden rounded-[18px] bg-white">
                                  <div className="h-14 bg-gradient-to-br from-blue-600 to-slate-900" />
                                  <div className="space-y-2 p-2">
                                    <div className="h-2 w-4/5 rounded bg-slate-200" />
                                    <div className="h-2 w-full rounded bg-slate-200" />
                                    <div className="h-7 rounded-lg bg-blue-600" />
                                    <div className="h-7 rounded-lg bg-slate-900" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { icon: Globe, label: "Modern website" },
                        { icon: Star, label: "Review automation" },
                        { icon: Search, label: "Local SEO" },
                      ].map((b) => (
                        <div
                          key={b.label}
                          className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10"
                        >
                          <b.icon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-semibold text-white">
                            {b.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pain Points */}
          <section className="bg-white py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  The problem we fix
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Your website shouldn&apos;t leak leads.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Most local service sites are slow, hard to navigate, and don&apos;t
                  make it obvious how to call. We redesign the entire experience
                  to drive calls, quote requests, and reviews.
                </p>
              </div>

              <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    title: "Slow pages",
                    desc: "If your site takes more than a few seconds to load, visitors bounce before they ever call.",
                    stat: "< 2s",
                    statLabel: "target load time",
                  },
                  {
                    icon: Smartphone,
                    title: "Bad mobile UX",
                    desc: "Most searches happen on phones. If the site is a chore, customers pick the next business.",
                    stat: "Mobile",
                    statLabel: "first design",
                  },
                  {
                    icon: Phone,
                    title: "No clear CTA",
                    desc: "You need click-to-call, sticky CTAs, and conversion-focused layouts — not paragraphs.",
                    stat: "+ Calls",
                    statLabel: "built in",
                  },
                ].map((p) => (
                  <div
                    key={p.title}
                    className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-900/10">
                      <p.icon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {p.desc}
                    </p>
                    <div className="mt-5 flex items-baseline gap-2">
                      <div className="text-2xl font-semibold text-blue-600">
                        {p.stat}
                      </div>
                      <div className="text-sm text-slate-500">{p.statLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Services */}
          <section id="services" className="bg-slate-50 py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    What you get
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Everything your business needs to get booked out.
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-slate-600">
                    A premium web presence + the systems that build trust and
                    keep your phone ringing.
                  </p>

                  <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
                      alt="Plumber working"
                      className="h-56 w-full object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Built for trades & local services
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Clear service pages, strong calls-to-action, and
                        trust-first design that looks premium on every device.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {[
                      {
                        icon: Globe,
                        title: "Conversion-focused website",
                        desc: "Modern design, fast load times, service pages that rank and convert.",
                      },
                      {
                        icon: Smartphone,
                        title: "Mobile-first experience",
                        desc: "Tap-to-call, streamlined forms, and layouts that work on small screens.",
                      },
                      {
                        icon: Search,
                        title: "Local SEO foundation",
                        desc: "On-page SEO, schema, and location signals designed to win local searches.",
                      },
                      {
                        icon: Star,
                        title: "Review automation",
                        desc: "Automated Google review requests to build trust and improve ranking.",
                      },
                      {
                        icon: Phone,
                        title: "Click-to-call everywhere",
                        desc: "Calls are the lifeblood. We make contacting you frictionless.",
                      },
                      {
                        icon: BarChart3,
                        title: "Analytics & reporting",
                        desc: "Know what&apos;s working: calls, forms, traffic, and performance.",
                      },
                    ].map((s) => (
                      <div
                        key={s.title}
                        className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-600/10">
                          <s.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="mt-5 text-base font-semibold text-slate-900">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {s.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-blue-300">
                          Typical outcome
                        </div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight">
                          More calls. Better reviews. Stronger Google presence.
                        </div>
                      </div>
                      <a
                        href="#contact"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
                      >
                        Request an audit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="process" className="bg-white py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  Simple, fast, predictable
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Launch in 3 steps.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  No drawn-out agency timelines. We move quickly and keep you in
                  the loop.
                </p>
              </div>

              <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Audit",
                    desc: "We review your current site (or your competitors) and identify the fastest wins to get more calls.",
                    icon: Search,
                  },
                  {
                    step: "02",
                    title: "Build",
                    desc: "You get a clean, premium design with clear CTAs, service pages, and mobile-first layouts.",
                    icon: Globe,
                  },
                  {
                    step: "03",
                    title: "Grow",
                    desc: "We launch, optimize, and (on Growth/Pro) automate review requests to boost trust and ranking.",
                    icon: TrendingUp,
                  },
                ].map((st) => (
                  <div
                    key={st.step}
                    className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-500">
                        {st.step}
                      </div>
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-900/10">
                        <st.icon className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                      {st.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {st.desc}
                    </p>
                    <div className="mt-6 h-px w-full bg-slate-200" />
                    <ul className="mt-5 space-y-3">
                      {["Clear timeline", "No fluff", "Built for calls"].map(
                        (x) => (
                          <li key={x} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600" />
                            <span className="text-sm text-slate-600">{x}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Social proof / Stats */}
          <section id="results" className="bg-slate-50 py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <Star className="h-3.5 w-3.5 text-blue-600" />
                  Social proof
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Built to look premium — and perform.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Your website is often the first impression. We make sure it
                  feels trustworthy and makes it effortless to contact you.
                </p>
              </div>

              <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
                {[
                  { value: "48h", label: "Typical launch window" },
                  { value: "95+", label: "Target PageSpeed score" },
                  { value: "2x", label: "More inbound calls" },
                  { value: "5★", label: "Review-first design" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm"
                  >
                    <div className="text-3xl font-semibold tracking-tight text-slate-900">
                      {s.value}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {[
                  {
                    quote:
                      "Our new site looks premium and loads instantly. Customers mention it on the phone — and we&apos;re booking more jobs.",
                    name: "Plumbing & Drain Service",
                    location: "Austin, TX",
                  },
                  {
                    quote:
                      "The review automation alone was worth it. We&apos;re getting more Google reviews each week and ranking better locally.",
                    name: "HVAC Company",
                    location: "Dallas, TX",
                  },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {t.name}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {t.location}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                        <Shield className="h-4 w-4 text-blue-400" />
                        Verified
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="bg-white py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                  Pricing
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Simple monthly plans. Built for local growth.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Start with a modern website, then add review automation and
                  growth systems when you&apos;re ready.
                </p>
              </div>

              <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {[
                  {
                    name: "Starter",
                    price: "$299",
                    badge: null as string | null,
                    desc: "Website only — live in 48hrs.",
                    features: [
                      "Modern website",
                      "Mobile optimized",
                      "Hosting included",
                      "Fast turnaround",
                    ],
                  },
                  {
                    name: "Growth",
                    price: "$399",
                    badge: "Most popular",
                    desc: "Everything in Starter + reviews + GBP optimization.",
                    features: [
                      "Everything in Starter",
                      "Automated Google review requests",
                      "Google Business Profile optimization",
                      "Conversion improvements",
                    ],
                  },
                  {
                    name: "Pro",
                    price: "$599",
                    badge: null as string | null,
                    desc: "Everything in Growth + ads + reporting.",
                    features: [
                      "Everything in Growth",
                      "Google Ads management",
                      "Monthly reporting",
                      "Ongoing optimizations",
                    ],
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-3xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      plan.badge
                        ? "border-blue-600 ring-1 ring-blue-600/15"
                        : "border-slate-200"
                    }`}
                  >
                    {plan.badge ? (
                      <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                        {plan.badge}
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {plan.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {plan.desc}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-semibold tracking-tight text-slate-900">
                          {plan.price}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">/mo</div>
                      </div>
                    </div>

                    <div className="mt-6 h-px w-full bg-slate-200" />

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600" />
                          <span className="text-sm text-slate-700">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#contact"
                      className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                        plan.badge
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      Choose {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>

                    <p className="mt-3 text-center text-xs text-slate-500">
                      Cancel anytime.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA / Contact */}
          <section id="contact" className="bg-[#0F172A] py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                    Free website audit
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Want more calls this month?
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-slate-200">
                    Send your details and we&apos;ll review your current site (or
                    your online presence) and reply with a clear plan.
                  </p>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        icon: CheckCircle,
                        title: "Clear recommendations",
                        desc: "What to fix, what to build, and what to prioritize first.",
                      },
                      {
                        icon: Smartphone,
                        title: "Mobile & speed review",
                        desc: "We check load time, mobile usability, and your call-to-action flow.",
                      },
                      {
                        icon: Star,
                        title: "Review & Google profile audit",
                        desc: "See what&apos;s holding your local ranking back.",
                      },
                    ].map((x) => (
                      <div key={x.title} className="flex gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                          <x.icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {x.title}
                          </div>
                          <div className="mt-1 text-sm text-slate-200">
                            {x.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/30 ring-1 ring-black/5">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Request your audit
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          We reply within 24 hours.
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/10">
                        <Clock className="h-4 w-4" />
                        24h response
                      </div>
                    </div>

                    <AuditForm />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 ring-1 ring-slate-900/10">
                  <Zap className="h-5 w-5 text-blue-500" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Booked Out
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Websites + review automation for local services.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
                <a
                  href="#services"
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  Services
                </a>
                <a
                  href="#process"
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  Pricing
                </a>
                <a
                  href="#contact"
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} Booked Out. All rights reserved.
              </p>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                  <MapPin className="h-4 w-4" />
                  Serving local service businesses
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
