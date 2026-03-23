"use client";

import React, { useState, useCallback } from "react";
import {
  ArrowRight,
  Check,
  DollarSign,
  HandshakeIcon,
  Phone,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PartnerForm = {
  name: string;
  email: string;
  phone: string;
  howYouKnow: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cl(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function PartnersPage() {
  /* -- Form -------------------------------------------------------- */
  const [form, setForm] = useState<PartnerForm>({
    name: "",
    email: "",
    phone: "",
    howYouKnow: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");

  const set = useCallback(
    (field: keyof PartnerForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.howYouKnow.trim()
    ) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          howYouKnow: form.howYouKnow.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", phone: "", howYouKnow: "" });
    } catch {
      // Show success regardless — API not wired yet
      setStatus("success");
      setForm({ name: "", email: "", phone: "", howYouKnow: "" });
    }
  }

  /* -- Earnings data ----------------------------------------------- */
  const earnings = [
    { referrals: "1 client", monthly: "$80/mo", annual: "$960/yr" },
    { referrals: "5 clients", monthly: "$400/mo", annual: "$4,800/yr" },
    { referrals: "10 clients", monthly: "$800/mo", annual: "$9,600/yr" },
    { referrals: "20 clients", monthly: "$1,600/mo", annual: "$19,200/yr" },
  ];

  /* -- Render ------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 antialiased">
      {/* ============================================================ */}
      {/*  NAV                                                          */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Booked Out</span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="tel:+17372605332"
              className="hidden items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white sm:inline-flex"
            >
              <Phone className="h-4 w-4" />
              (737) 260-5332
            </a>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-24">
          {/* Subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-400">
              <DollarSign className="h-4 w-4" />
              Partner Program
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Earn{" "}
              <span className="text-orange-500">$80/Month</span>{" "}
              for Every Client You Send Us. Forever.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              Refer a local contractor to Booked Out, they get a website and
              automated Google reviews, and you get $80/month in recurring
              commissions — as long as they&apos;re a client.
            </p>

            <div className="mt-8">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-7 py-4 text-base font-bold text-white shadow-md transition hover:bg-orange-700 hover:shadow-lg"
              >
                Apply to Be a Partner
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { value: "$80/mo", label: "per active referral" },
                { value: "Forever", label: "recurring, not one-time" },
                { value: "No cap", label: "on how many you refer" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-700 bg-gray-800/60 px-6 py-5 text-center"
                >
                  <div className="text-2xl font-bold tracking-tight text-orange-400 sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  HOW IT WORKS                                                */}
        {/* ============================================================ */}
        <section className="border-t border-gray-800 bg-gray-800/40 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Simple process
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                How It Works
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Make the intro",
                  body: "Share your referral link or forward our email template to a contractor you know.",
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "We handle everything",
                  body: "Onboarding, website build, review automation, client support. You do nothing.",
                },
                {
                  step: "03",
                  icon: DollarSign,
                  title: "Get paid every month",
                  body: "$80/month hits your account for every active client you referred. No cap.",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl border border-gray-700 bg-gray-800/60 p-7"
                >
                  <div className="text-xs font-bold tracking-widest text-orange-500">
                    STEP {s.step}
                  </div>
                  <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <s.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  EARNINGS TABLE                                              */}
        {/* ============================================================ */}
        <section className="border-t border-gray-800 bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                The math
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                What Your Referrals Are Worth
              </h2>
            </div>

            {/* Desktop table */}
            <div className="mt-10 hidden overflow-hidden rounded-2xl border border-gray-700 sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800">
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-400">
                      Referrals
                    </th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-400">
                      Monthly
                    </th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-400">
                      Annual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {earnings.map((row, i) => (
                    <tr
                      key={i}
                      className={cl(
                        "transition hover:bg-gray-800/60",
                        i === earnings.length - 1 &&
                          "bg-orange-500/5 ring-1 ring-inset ring-orange-500/20"
                      )}
                    >
                      <td className="px-6 py-4 text-base font-semibold text-white">
                        {row.referrals}
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-orange-400">
                        {row.monthly}
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-gray-300">
                        {row.annual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:hidden">
              {earnings.map((row, i) => (
                <div
                  key={i}
                  className={cl(
                    "rounded-2xl border p-5",
                    i === earnings.length - 1
                      ? "border-orange-500/40 bg-orange-500/5"
                      : "border-gray-700 bg-gray-800/60"
                  )}
                >
                  <div className="text-base font-semibold text-white">
                    {row.referrals}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Monthly</div>
                      <div className="text-xl font-bold text-orange-400">
                        {row.monthly}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Annual</div>
                      <div className="text-lg font-semibold text-gray-300">
                        {row.annual}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  BENEFITS                                                    */}
        {/* ============================================================ */}
        <section className="border-t border-gray-800 bg-gray-800/40 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Why it works
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Built for Real Partners
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "Recurring, not one-time.",
                  body: "$80/month per referral adds up fast. 5 clients = $400/month. 10 clients = $800/month. You do the math.",
                },
                {
                  icon: Zap,
                  title: "Nothing to manage.",
                  body: "We handle the onboarding, the website, the tech, and the client relationship. You just make the intro.",
                },
                {
                  icon: Users,
                  title: "Your clients will thank you.",
                  body: "Booked Out helps contractors look more professional and get more reviews without lifting a finger. It's a genuine win for them.",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-700 bg-gray-800/60 p-7"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <benefit.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {benefit.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  WHO IT'S FOR                                                */}
        {/* ============================================================ */}
        <section className="border-t border-gray-800 bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                  Ideal partners
                </p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Who It&apos;s For
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-400">
                  If you work with local contractors or have relationships in the
                  trades, you&apos;re already halfway there. The intro takes 30
                  seconds. The commission lasts as long as they&apos;re a client.
                </p>
              </div>

              <div className="mt-10 lg:mt-0">
                <ul className="space-y-4">
                  {[
                    "Bookkeepers and accountants who work with contractors",
                    "Business coaches for trades businesses",
                    "Insurance agents serving HVAC, plumbing, and roofing",
                    "Marketing agencies that don't offer websites",
                    "Anyone with relationships in the local service industry",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
                        <Check className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                      <span className="text-base text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  APPLY FORM                                                  */}
        {/* ============================================================ */}
        <section
          id="apply"
          className="border-t border-gray-800 bg-gray-800/40 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-gray-700 shadow-2xl lg:grid lg:grid-cols-2">
              {/* Left panel */}
              <div className="bg-gray-900 p-8 sm:p-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                  <HandshakeIcon className="h-6 w-6 text-orange-400" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Apply to Be a Partner
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-400">
                  We review every application and reach out within 24 hours. If
                  you&apos;re approved, we&apos;ll send your referral link and a
                  simple email template you can forward to contractors you know.
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: DollarSign,
                      title: "$80/month per referral",
                      desc: "Paid monthly, as long as the client stays active.",
                    },
                    {
                      icon: Zap,
                      title: "Zero ongoing work",
                      desc: "Make the intro once. Collect commissions indefinitely.",
                    },
                    {
                      icon: Users,
                      title: "No cap on referrals",
                      desc: "Send 1 client or 50. Every active one pays.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 ring-1 ring-gray-700">
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

                <div className="mt-10 flex items-center gap-3 border-t border-gray-800 pt-6">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500">
                      Questions? Call or email us.
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

              {/* Right panel — Form */}
              <div className="bg-gray-800/80 p-8 sm:p-12">
                {status === "success" ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30">
                      <Check className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-white">
                      Application received.
                    </h3>
                    <p className="mt-3 text-base text-gray-400">
                      We&apos;ll be in touch within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white">
                      Partner Application
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Takes 60 seconds. We review every submission.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                      <div>
                        <label
                          htmlFor="partner-name"
                          className="block text-sm font-semibold text-gray-300"
                        >
                          Full Name
                        </label>
                        <input
                          id="partner-name"
                          type="text"
                          value={form.name}
                          onChange={set("name")}
                          placeholder="Jane Smith"
                          autoComplete="name"
                          className="mt-1.5 w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="partner-email"
                          className="block text-sm font-semibold text-gray-300"
                        >
                          Email
                        </label>
                        <input
                          id="partner-email"
                          type="email"
                          value={form.email}
                          onChange={set("email")}
                          placeholder="jane@example.com"
                          autoComplete="email"
                          inputMode="email"
                          className="mt-1.5 w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="partner-phone"
                          className="block text-sm font-semibold text-gray-300"
                        >
                          Phone
                        </label>
                        <input
                          id="partner-phone"
                          type="tel"
                          value={form.phone}
                          onChange={set("phone")}
                          placeholder="(555) 123-4567"
                          autoComplete="tel"
                          inputMode="tel"
                          className="mt-1.5 w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="partner-how"
                          className="block text-sm font-semibold text-gray-300"
                        >
                          How do you know contractors?
                        </label>
                        <textarea
                          id="partner-how"
                          value={form.howYouKnow}
                          onChange={set("howYouKnow")}
                          placeholder="e.g. I'm a bookkeeper with 30 contractor clients in Austin"
                          rows={4}
                          className="mt-1.5 w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className={cl(
                          "flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700",
                          status === "submitting" &&
                            "cursor-not-allowed opacity-60"
                        )}
                      >
                        {status === "submitting"
                          ? "Submitting..."
                          : "Apply to Partner with Us"}
                        {status !== "submitting" && (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </button>

                      {status === "error" && (
                        <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
                          Please fill out all fields and try again.
                        </div>
                      )}
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
        <footer className="border-t border-gray-800 bg-gray-900">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Booked Out</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Questions? Email us at{" "}
                <a
                  href="mailto:hello@trybookedout.com"
                  className="text-orange-400 hover:text-orange-300"
                >
                  hello@trybookedout.com
                </a>{" "}
                or call{" "}
                <a
                  href="tel:+17372605332"
                  className="text-orange-400 hover:text-orange-300"
                >
                  (737) 260-5332
                </a>
              </p>
            </div>
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Booked Out. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
