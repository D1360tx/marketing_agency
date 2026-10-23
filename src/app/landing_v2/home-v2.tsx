"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  LayoutGrid,
  Search,
  Smartphone,
  Star,
} from "lucide-react";
import { PublicFormTurnstile } from "@/components/public-form-turnstile";
import { inboundFormFailure, type InboundFormFailure } from "@/lib/inbound-form-feedback";
import { captureAttribution, leadTrackingPayload, newEventId } from "@/lib/attribution";
import { trackContactClick, trackLeadConversion } from "@/lib/ad-events";
import {
  CASE_STUDY,
  COMPARISON,
  FAQS,
  FOUNDER_STATS,
  INTEREST_OPTIONS,
  PHONE_DISPLAY,
  PHONE_HREF,
  PLANS,
  PRICING_FINE_PRINT,
  STAGES,
  TRACKING_FIX,
  TRADES,
} from "./content";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const WRAP = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const DISPLAY = "font-[family-name:var(--font-hanken)]";
const EYEBROW = "font-mono text-xs tracking-[0.1em]";
const H2 = `${DISPLAY} m-0 font-semibold text-[clamp(36px,4.6vw,64px)] leading-none tracking-[-0.035em]`;

function cl(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

function Tick({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <Check
      aria-hidden="true"
      strokeWidth={2.6}
      className={cl("mt-0.5 h-4 w-4 flex-none", dark ? "text-[#C2F26B]" : "text-[#0D1210]", className)}
    />
  );
}

function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
        <span className="h-[9px] w-[9px] rounded-[2px] bg-[#C2F26B]" />
        <span className={cl("h-[9px] w-[9px] rounded-[2px]", dark ? "bg-[#F3F1EA]" : "bg-[#0D1210]")} />
        <span className={cl("h-[9px] w-[9px] rounded-[2px]", dark ? "bg-[#F3F1EA]" : "bg-[#0D1210]")} />
        <span className="h-[9px] w-[9px] rounded-full bg-[#C2F26B]" />
      </span>
      <span className={cl(DISPLAY, "text-[21px] font-bold tracking-[-0.02em]")}>
        booked <span className="text-[#C2F26B]">out.</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage mockups (clearly labeled as examples)                        */
/* ------------------------------------------------------------------ */

function ExampleLabel() {
  return (
    <span className="absolute right-4 top-4 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-[#A3ADA7]">
      EXAMPLE
    </span>
  );
}

function StageMock({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex w-full max-w-[360px] flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#151C19] px-[18px] py-3 text-sm text-[#B7C0BA]">
          <Search className="h-4 w-4" aria-hidden="true" /> window cleaning near me
        </div>
        <div className="rounded-2xl bg-[#F3F1EA] p-[18px] text-[#0D1210]">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold">Clearview Window Co.</span>
            <span className="rounded-full bg-[#C2F26B] px-2 py-[3px] text-[11px] font-semibold">Open now</span>
          </div>
          <div className="mt-1.5 text-[13px] text-[#4F5753]">★ 4.9 · Serving Buda, Kyle &amp; Dripping Springs</div>
          <div className="mt-3.5 flex gap-2">
            <span className="flex-1 rounded-[10px] bg-[#0D1210] p-2.5 text-center text-[13px] font-semibold text-[#F3F1EA]">Call now</span>
            <span className="flex-1 rounded-[10px] border border-[#CFCABB] p-2.5 text-center text-[13px] font-semibold">Website</span>
          </div>
        </div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="flex w-full max-w-[360px] flex-col gap-2.5 text-sm">
        <div className="max-w-[80%] self-start rounded-[16px_16px_16px_4px] bg-[#1E2723] px-3.5 py-3">
          Hi! Do you have anything this week for a full interior detail? Two kids and a dog, so it’s rough.
        </div>
        <div className="max-w-[80%] self-end rounded-[16px_16px_4px_16px] bg-[#C2F26B] px-3.5 py-3 text-[#0D1210]">
          Thanks Sam, we got your request. We’ll text you a quote and open times in a few minutes.
        </div>
        <div className="self-end font-mono text-[11px] text-[#A3ADA7]">Sent automatically · 0:06</div>
        <div className="mt-2 rounded-xl border border-white/10 bg-[#151C19] px-3.5 py-3 text-[13px] text-[#B7C0BA]">
          Routed to <span className="font-semibold text-[#F3F1EA]">Alicia</span> with vehicle, service and location
        </div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#151C19] p-[18px]">
        <div className="flex justify-between text-[13px] text-[#B7C0BA]">
          <span className="font-semibold text-[#F3F1EA]">Thursday</span>
          <span>3 appointments</span>
        </div>
        <div className="mt-3.5 flex flex-col gap-2 text-[13px]">
          <div className="flex gap-3 rounded-[10px] bg-[#1E2723] px-3 py-2.5"><span className="font-mono text-[#A3ADA7]">9:00</span>Standard clean · Maria G.</div>
          <div className="flex gap-3 rounded-[10px] bg-[#1E2723] px-3 py-2.5"><span className="font-mono text-[#A3ADA7]">11:30</span>Walkthrough · Tom B.</div>
          <div className="flex gap-3 rounded-[10px] bg-[#C2F26B] px-3 py-2.5 font-semibold text-[#0D1210]"><span className="font-mono">2:15</span>Move-out clean · Jenna R. · New</div>
        </div>
        <div className="mt-3.5 text-xs text-[#A3ADA7]">Reminder text goes out the day before</div>
      </div>
    );
  }
  if (index === 3) {
    return (
      <div className="flex w-full max-w-[360px] flex-col gap-3">
        <div className="rounded-2xl bg-[#F3F1EA] p-[18px] text-sm leading-normal text-[#0D1210]">
          <div className="font-mono text-[11px] text-[#4F5753]">AFTER THE VISIT</div>
          <div className="mt-2">Thanks for choosing Greenline Lawn Care, Priya. You’re welcome to share an honest Google review of your experience.</div>
          <div className="mt-3 inline-block rounded-lg bg-[#0D1210] px-3 py-2 text-[13px] text-[#F3F1EA]">Leave a review</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#151C19] p-4 text-[13px]">
          <div className="text-[#E0A33A]" aria-label="5 stars">★★★★★</div>
          <div className="mt-1.5 text-[#C9D1CC]">“Answered right away and the yard looks better than it has in years.”</div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#151C19] p-[18px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Spring check-in</span>
        <span className="rounded-full bg-[#C2F26B] px-2 py-[3px] text-[11px] font-semibold text-[#0D1210]">Scheduled</span>
      </div>
      <div className="mt-1.5 text-[13px] text-[#A3ADA7]">To: past customers · Text + email</div>
      <div className="mt-3.5 rounded-xl bg-[#1E2723] px-3.5 py-3 text-sm leading-normal">
        Hi Dana, it’s been six months since your last visit. Want to get back on the calendar this spring? Reply YES to pick a time.
      </div>
    </div>
  );
}

function StagesExplorer() {
  const [stage, setStage] = useState(0);
  const current = STAGES[stage];
  return (
    <>
      <div className="mt-14 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            aria-pressed={stage === i}
            onClick={() => setStage(i)}
            className={cl(
              "flex min-h-11 cursor-pointer flex-col items-start gap-1.5 rounded-2xl border px-5 py-[18px] text-left transition-colors last:col-span-2 sm:last:col-span-1",
              stage === i
                ? "border-[#0D1210] bg-[#0D1210] text-[#F3F1EA]"
                : "border-[#DEDACE] bg-white text-[#0D1210] hover:border-[#0D1210]"
            )}
          >
            <span className="font-mono text-xs opacity-70">0{i + 1}</span>
            <span className={cl(DISPLAY, "text-lg font-semibold")}>{s.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 rounded-[22px] border border-[#DEDACE] bg-white p-3">
        <div className="min-w-0 flex-[1_1_420px] p-6 sm:p-8">
          <div className={cl(EYEBROW, "text-[#4F5753]")}>{current.label}</div>
          <h3 className={cl(DISPLAY, "m-0 mt-3.5 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl")}>{current.title}</h3>
          <p className="m-0 mt-3.5 text-base leading-relaxed text-[#4F5753]">{current.desc}</p>
          <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0 text-[15px]">
            {current.bullets.map((b) => (
              <li key={b.text} className="flex items-start gap-2.5">
                <Tick />
                <span>{b.text}</span>
                {b.crm && (
                  <span className="mt-px flex-none rounded-full bg-[#0D1210] px-2 py-[3px] text-[11px] font-semibold text-[#F3F1EA]">CRM</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex min-h-[360px] min-w-0 flex-[1_1_420px] items-center justify-center rounded-2xl bg-[#0D1210] p-8 text-[#F3F1EA]">
          <ExampleLabel />
          <StageMock index={stage} />
        </div>
      </div>
      <p className="mt-3.5 text-xs text-[#4F5753]">Items marked CRM come with Growth and Growth + Ads. Examples show sample businesses.</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-w-0 flex-[2_1_560px] border-t border-[#CFCABB]">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-b border-[#CFCABB]">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-5 bg-transparent py-6 text-left text-lg font-semibold text-[#0D1210]"
            >
              <span>{f.q}</span>
              <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[#CFCABB] font-mono text-base font-normal">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p id={`faq-${i}`} className="m-0 pb-6 pr-14 text-base leading-relaxed text-[#4F5753]">
                {f.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Audit form                                                         */
/* ------------------------------------------------------------------ */

type FormFields = {
  name: string;
  business: string;
  email: string;
  phone: string;
  website: string;
  businessType: string;
  serviceArea: string;
  interest: string;
};

const EMPTY_FORM: FormFields = {
  name: "",
  business: "",
  email: "",
  phone: "",
  website: "",
  businessType: "",
  serviceArea: "",
  interest: INTEREST_OPTIONS[0],
};

const INPUT =
  "mt-1.5 min-h-11 w-full rounded-[10px] border border-[#CFCABB] bg-white px-3.5 py-3 text-[15px] text-[#0D1210] placeholder:text-[#7A817D] focus:border-[#0D1210] focus:outline-none focus:ring-2 focus:ring-[#0D1210]/15";
const LABEL = "block text-[13px] font-medium text-[#0D1210]";

function AuditForm() {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [failure, setFailure] = useState<InboundFormFailure | null>(null);
  const [securityAttempt, setSecurityAttempt] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [contactTime, setContactTime] = useState("");
  const submitting = useRef(false);

  const set = useCallback(
    (field: keyof FormFields) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFailure(null);
    const required = [form.name, form.business, form.email, form.phone, form.businessType, form.serviceArea];
    if (required.some((value) => !value.trim())) {
      setFailure({ kind: "validation", message: "Please fill out your contact info, type of business and city so we can prepare the audit." });
      setStatus("error");
      return;
    }
    submitting.current = true;
    setStatus("submitting");
    const eventId = newEventId();
    try {
      const res = await fetch("/api/leads/inbound", {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          business: form.business.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          businessType: form.businessType.trim(),
          serviceArea: form.serviceArea.trim(),
          city: form.serviceArea.trim(),
          interest: form.interest,
          source: "landing_v2",
          turnstileToken,
          contact_time: contactTime,
          smsConsent: false,
          tracking: leadTrackingPayload(eventId),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.success !== true) {
        setFailure(inboundFormFailure(res.status, body));
        setStatus("error");
        return;
      }
      trackLeadConversion({ eventId, email: form.email, phone: form.phone });
      setStatus("success");
      setForm(EMPTY_FORM);
      setContactTime("");
    } catch {
      setFailure(inboundFormFailure(0, null));
      setStatus("error");
    } finally {
      submitting.current = false;
      setTurnstileToken("");
      setSecurityAttempt((attempt) => attempt + 1);
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="min-w-0 flex-[1_1_460px] rounded-3xl bg-[#F3F1EA] p-8 text-[#0D1210]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C2F26B]">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className={cl(DISPLAY, "m-0 mt-5 text-[28px] font-semibold tracking-[-0.02em]")}>Request received.</h3>
        <p className="m-0 mt-3 text-base leading-relaxed text-[#4F5753]">
          Your audit will be in your inbox within 48 hours. If anything is unclear we’ll reach out first.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative flex min-w-0 flex-[1_1_460px] flex-col gap-4 rounded-3xl bg-[#F3F1EA] p-6 text-[#0D1210] sm:p-8"
    >
      <div>
        <h3 className={cl(DISPLAY, "m-0 text-2xl font-semibold")}>Request your free audit</h3>
        <p className="m-0 mt-1 text-sm text-[#4F5753]">Takes about 60 seconds.</p>
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="v2-contact-time">Contact time</label>
        <input
          id="v2-contact-time"
          name="contact_time"
          type="text"
          value={contactTime}
          onChange={(event) => setContactTime(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className={LABEL}>
          Your name
          <input type="text" value={form.name} onChange={set("name")} placeholder="Alex Johnson" autoComplete="name" className={INPUT} />
        </label>
        <label className={LABEL}>
          Business name
          <input type="text" value={form.business} onChange={set("business")} placeholder="Johnson & Co." autoComplete="organization" className={INPUT} />
        </label>
        <label className={LABEL}>
          Email
          <input type="email" value={form.email} onChange={set("email")} placeholder="alex@company.com" autoComplete="email" inputMode="email" className={INPUT} />
        </label>
        <label className={LABEL}>
          Phone
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" autoComplete="tel" inputMode="tel" className={INPUT} />
        </label>
        <label className={LABEL}>
          Type of business
          <input type="text" value={form.businessType} onChange={set("businessType")} placeholder="Cleaning, detailing, gym…" className={INPUT} />
        </label>
        <label className={LABEL}>
          City or service area
          <input type="text" value={form.serviceArea} onChange={set("serviceArea")} placeholder="Austin, TX" autoComplete="address-level2" className={INPUT} />
        </label>
      </div>
      <label className={LABEL}>
        Website <span className="font-normal text-[#4F5753]">(optional)</span>
        <input type="url" value={form.website} onChange={set("website")} placeholder="https://yourcompany.com" autoComplete="url" inputMode="url" className={INPUT} />
      </label>
      <label className={LABEL}>
        Interested in
        <select value={form.interest} onChange={set("interest")} className={INPUT}>
          {INTEREST_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <PublicFormTurnstile key={securityAttempt} action="inbound_lead" onToken={setTurnstileToken} />

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cl(
          "mt-1 flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0D1210] p-4 text-base font-semibold text-[#F3F1EA] transition-opacity",
          status === "submitting" && "cursor-not-allowed opacity-60"
        )}
      >
        {status === "submitting" ? "Sending…" : failure?.kind === "service" ? "Try again" : "Request my free audit"}
      </button>

      {status === "error" && failure && (
        <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {failure.message}
          {failure.kind === "service" && (
            <a href={PHONE_HREF} className="mt-2 flex min-h-11 items-center font-semibold underline">
              Call {PHONE_DISPLAY}
            </a>
          )}
        </div>
      )}

      <p className="m-0 text-xs leading-normal text-[#4F5753]">
        By submitting, you agree to a follow-up about your audit. No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function HomeV2({ bookingHref }: { bookingHref: string }) {
  useEffect(() => {
    captureAttribution();
  }, []);

  const bookingIsPhone = bookingHref.startsWith("tel:");
  const onBookingClick = () => trackContactClick(bookingIsPhone ? "phone" : "booking");
  const onPhoneClick = () => trackContactClick("phone");

  return (
    <div className="w-full bg-[#F3F1EA] font-sans text-[#0D1210] antialiased">
      {/* ============ HERO ============ */}
      <section id="top" className="bg-[#0D1210] pb-24 text-[#F3F1EA]">
        <nav className={cl(WRAP, "flex flex-wrap items-center justify-between gap-6 py-[22px]")} aria-label="Main">
          <a href="#top" className="text-[#F3F1EA] no-underline">
            <Logo />
          </a>
          <div className="hidden gap-7 text-sm md:flex">
            <a href="#system" className="text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">System</a>
            <a href="#tracking" className="text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">Ads &amp; tracking</a>
            <a href="#results" className="text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">Results</a>
            <a href="#pricing" className="text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">Pricing</a>
            <a href="#faq" className="text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">FAQ</a>
          </div>
          <div className="flex items-center gap-[18px]">
            <a href={PHONE_HREF} onClick={onPhoneClick} className="hidden font-mono text-[13px] text-[#B7C0BA] no-underline sm:inline">
              {PHONE_DISPLAY}
            </a>
            <a href="#get-started" className="inline-flex min-h-11 items-center rounded-full bg-[#C2F26B] px-[18px] py-3 text-sm font-semibold text-[#0D1210] no-underline">
              Get my free audit
            </a>
          </div>
        </nav>

        <div className={cl(WRAP, "flex flex-wrap items-center gap-14 pt-10 sm:pt-14")}>
          <div className="min-w-0 flex-[1_1_480px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 py-[7px] pl-2 pr-3.5 text-[13px] text-[#C9D1CC]">
              <span className="rounded-full bg-[#C2F26B] px-[9px] py-[3px] text-xs font-semibold text-[#0D1210]">3 spots</span>
              Founding clients for local businesses
            </div>
            <h1 className={cl(DISPLAY, "m-0 mt-7 text-[clamp(44px,6.4vw,88px)] font-semibold leading-[0.95] tracking-[-0.04em]")}>
              Be the easiest business to find, trust and <span className="text-[#C2F26B]">book.</span>
            </h1>
            <p className="m-0 mt-7 max-w-[520px] text-[19px] leading-[1.55] text-[#B7C0BA]">
              When someone nearby needs what you do, they pick whoever shows up first, has the best reviews and answers fastest. Booked Out builds the website, reviews and follow-up that make that you.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#get-started" className="inline-flex min-h-11 items-center gap-2.5 rounded-full bg-[#C2F26B] px-6 py-4 text-base font-semibold text-[#0D1210] no-underline">
                Find my revenue leaks <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href={bookingHref} onClick={onBookingClick} className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/20 px-6 py-4 text-base font-medium text-[#F3F1EA] no-underline hover:border-white/50">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> {bookingIsPhone ? "Call to book" : "Book a call"}
              </a>
            </div>
            <ul className="m-0 mt-9 flex list-none flex-wrap gap-[22px] p-0 text-[13px] text-[#A3ADA7]">
              {["Month-to-month", "Audit before any pitch", "You keep your accounts"].map((item) => (
                <li key={item} className="flex items-center gap-[7px]"><Tick dark className="mt-0 h-3.5 w-3.5" />{item}</li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0 flex-[1_1_440px]">
            <div className="rounded-[22px] border border-white/10 bg-[#151C19] p-[22px] shadow-[0_40px_80px_rgba(0,0,0,0.45)] lg:pb-[84px]">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs tracking-[0.06em] text-[#A3ADA7]">LEAD DESK</div>
                <div className="flex items-center gap-[7px] text-xs text-[#C9D1CC]"><span className="h-[7px] w-[7px] rounded-full bg-[#C2F26B]" />Sample flow</div>
              </div>
              <div className="mt-[18px] rounded-[14px] border border-[#C2F26B]/35 bg-[#0D1210] p-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#C2F26B]">New quote request</div>
                    <div className="mt-1.5 text-[17px] font-semibold">Looking for availability this week</div>
                    <div className="mt-1 text-[13px] text-[#A3ADA7]">Jenna R. · Website form · Prefers text</div>
                  </div>
                  <div className="font-mono text-[26px] font-medium tracking-[-0.02em]">00:41</div>
                </div>
              </div>
              <ol className="m-0 mt-[18px] list-none p-0">
                {[
                  { t: "Reply sent to Jenna", time: "0:06", d: "“Thanks Jenna, we got it. We’ll reach out shortly.”", done: true },
                  { t: "Sent to the right person", time: "0:09", d: "Service, timing and contact details attached", done: true },
                  { t: "Callback booked", time: "today 2:15", d: "Added to the pipeline as “Estimate scheduled”", done: false },
                ].map((step, i, all) => (
                  <li key={step.t} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span className={cl("mt-[5px] h-2.5 w-2.5 rounded-full", step.done ? "bg-[#C2F26B]" : "border-2 border-[#C2F26B]")} />
                      {i < all.length - 1 && <span className="w-px flex-1 bg-white/15" />}
                    </div>
                    <div className={cl("flex-1", i < all.length - 1 && "pb-4")}>
                      <div className="flex justify-between text-sm"><span>{step.t}</span><span className="font-mono text-xs text-[#A3ADA7]">{step.time}</span></div>
                      <div className="mt-1 text-[13px] text-[#A3ADA7]">{step.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="absolute -bottom-[34px] -left-7 hidden w-[220px] rounded-2xl bg-[#F3F1EA] p-[14px_16px] text-[#0D1210] shadow-[0_20px_40px_rgba(0,0,0,0.35)] lg:block">
              <div className="flex gap-[3px] text-[#B45309]" aria-label="5 stars">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />)}
              </div>
              <div className="mt-2 text-[13px] font-semibold">Review request queued</div>
              <div className="mt-[3px] text-xs text-[#4F5753]">Neutral ask, sent after every visit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROOF STRIP ============ */}
      <section className="border-b border-[#D9D5C8] bg-[#E9E6DC]">
        <div className={cl(WRAP, "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
          {["One connected customer path", "No 12-month lock-in", "Built around your real operation", "Monthly proof of completed work"].map((item, i) => (
            <div key={item} className="flex items-center gap-2.5 py-[22px] text-sm">
              <span className="font-mono text-[#4F5753]">0{i + 1}</span>{item}
            </div>
          ))}
        </div>
      </section>

      {/* ============ FIVE STAGES ============ */}
      <section className="py-28">
        <div className={WRAP}>
          <div className="flex flex-wrap items-end justify-between gap-12">
            <div className="min-w-0 flex-[1_1_520px]">
              <div className={cl(EYEBROW, "text-[#4F5753]")}>ONE SYSTEM · FIVE STAGES</div>
              <h2 className={cl(H2, "mt-[18px]")}>From first search to happy repeat customer.</h2>
            </div>
            <p className="m-0 max-w-[420px] flex-[1_1_340px] text-[17px] leading-relaxed text-[#4F5753]">
              Every stage hands the customer to the next, so the work you’re already proud of turns into calls, bookings, five-star proof and customers who come back.
            </p>
          </div>
          <StagesExplorer />
        </div>
      </section>

      {/* ============ SYSTEM ============ */}
      <section id="system" className="pb-28">
        <div className={WRAP}>
          <div className={cl(EYEBROW, "text-[#4F5753]")}>THE SYSTEM</div>
          <h2 className={cl(H2, "mt-[18px] max-w-[760px]")}>Four pieces that power every stage.</h2>

          <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-[22px] rounded-[22px] border border-[#DEDACE] bg-white p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#4F5753]">01 · GET FOUND</span>
                <Smartphone className="h-[22px] w-[22px]" aria-hidden="true" />
              </div>
              <div>
                <h3 className={cl(DISPLAY, "m-0 text-[28px] font-semibold tracking-[-0.02em]")}>A website built to make people call</h3>
                <p className="m-0 mt-2.5 text-[15px] leading-normal text-[#4F5753]">Fast mobile pages, clear service areas, tap-to-call above the fold, and your licenses, warranties and reviews where buyers look.</p>
              </div>
              <div className="flex items-center gap-3.5 rounded-[14px] bg-[#F3F1EA] p-[18px]">
                <div className="flex w-[92px] flex-none flex-col gap-1.5 rounded-xl bg-[#0D1210] px-2 py-2.5" aria-hidden="true">
                  <span className="h-1.5 w-[70%] rounded bg-[#F3F1EA]" />
                  <span className="h-1 w-[90%] rounded bg-[#4F5753]" />
                  <span className="h-1 w-[60%] rounded bg-[#4F5753]" />
                  <span className="mt-1.5 h-[18px] rounded-md bg-[#C2F26B]" />
                </div>
                <div className="flex flex-col gap-2 text-[13px]">
                  <span>Up to 7 core pages</span>
                  <span>Hosting + monthly upkeep</span>
                  <span>One conversion fix every month</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[22px] rounded-[22px] border border-[#DEDACE] bg-white p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#4F5753]">02 · GET TRUSTED</span>
                <Star className="h-[22px] w-[22px]" aria-hidden="true" />
              </div>
              <div>
                <h3 className={cl(DISPLAY, "m-0 text-[28px] font-semibold tracking-[-0.02em]")}>A reputation worth finding</h3>
                <p className="m-0 mt-2.5 text-[15px] leading-normal text-[#4F5753]">Google Business Profile cleanup plus neutral review requests to every eligible customer. No gating, no incentives, just a steady flow of honest proof.</p>
              </div>
              <div className="rounded-[14px] bg-[#F3F1EA] p-[18px] text-sm leading-normal">
                <div className="font-mono text-[11px] tracking-[0.06em] text-[#4F5753]">SAMPLE REQUEST</div>
                <div className="mt-2">Thanks for choosing our team. You’re welcome to share an honest Google review of your experience.</div>
                <div className="mt-3 inline-block rounded-lg bg-[#0D1210] px-3 py-2 text-[13px] text-[#F3F1EA]">Leave a review</div>
              </div>
            </div>

            <div className="flex flex-col gap-[22px] rounded-[22px] border border-[#DEDACE] bg-white p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#4F5753]">03 · GET ANSWERED</span>
                <Clock className="h-[22px] w-[22px]" aria-hidden="true" />
              </div>
              <div>
                <h3 className={cl(DISPLAY, "m-0 text-[28px] font-semibold tracking-[-0.02em]")}>Follow-up that doesn’t slip</h3>
                <p className="m-0 mt-2.5 text-[15px] leading-normal text-[#4F5753]">Every inquiry gets an instant acknowledgment and lands with the right person, with the service, urgency and location already captured.</p>
              </div>
              <div className="flex flex-col gap-2.5 rounded-[14px] bg-[#F3F1EA] p-[18px] text-[13px]">
                {[["Form received", "0:00"], ["Customer acknowledged", "0:06"], ["Team notified with details", "0:09"]].map(([label, time]) => (
                  <div key={label} className="flex justify-between"><span>{label}</span><span className="font-mono text-[#4F5753]">{time}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-10 rounded-[22px] bg-[#0D1210] p-8 text-[#F3F1EA] sm:p-10">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#C2F26B]">04 · RUN IT</span>
                <span className="rounded-full bg-[#C2F26B] px-[9px] py-[3px] text-[11px] font-semibold text-[#0D1210]">New</span>
                <LayoutGrid className="ml-auto h-[22px] w-[22px] text-[#C2F26B]" aria-hidden="true" />
              </div>
              <div>
                <h3 className={cl(DISPLAY, "m-0 text-4xl font-semibold leading-[1.05] tracking-[-0.03em]")}>One home for every lead</h3>
                <p className="m-0 mt-3.5 text-base leading-relaxed text-[#B7C0BA]">The Booked Out CRM puts contacts, pipeline, calendar and a unified inbox for calls, texts and email in one place your whole team can use.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[13px]">
                {["Contacts", "Pipeline", "Calendar", "Unified inbox", "Automations"].map((chip) => (
                  <span key={chip} className="rounded-full border border-white/20 px-3 py-[7px]">{chip}</span>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 flex-[1.3_1_460px] grid-cols-3 gap-2.5 text-[13px]" aria-label="Example pipeline">
              {[
                { col: "New", cards: [["Sarah M.", "Deep clean"], ["Leo T.", "Window quote"]] },
                { col: "Contacted", cards: [["David R.", "Detail package"]] },
                { col: "Booked", cards: [["Jordan P.", "Lawn plan · Thu 2:15"]], hot: true },
              ].map((column) => (
                <div key={column.col} className="flex flex-col gap-2 rounded-[14px] bg-[#151C19] p-3.5">
                  <span className="flex justify-between text-[#A3ADA7]">{column.col}<span className="font-mono">{column.cards.length}</span></span>
                  {column.cards.map(([person, job]) => (
                    <span key={person} className={cl("rounded-[10px] px-3 py-2.5", column.hot ? "bg-[#C2F26B] text-[#0D1210]" : "bg-[#1E2723]")}>
                      <span className="block font-semibold">{person}</span>
                      <span className={column.hot ? "" : "text-[#A3ADA7]"}>{job}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ADS & TRACKING ============ */}
      <section id="tracking" className="pb-28">
        <div className={WRAP}>
          <div className="flex flex-wrap items-end justify-between gap-12">
            <div className="min-w-0 flex-[1_1_560px]">
              <div className={cl(EYEBROW, "text-[#4F5753]")}>WHY BOOKED OUT</div>
              <h2 className={cl(H2, "mt-[18px]")}>E-commerce-grade ads and tracking, built for local businesses.</h2>
            </div>
            <p className="m-0 max-w-[440px] flex-[1_1_340px] text-[17px] leading-relaxed text-[#4F5753]">
              We come from years of direct-to-consumer and lead gen, where every ad dollar has to prove itself. We run your Meta and Google ads with that same discipline, tracked from the first click to the paid invoice.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 border-y border-[#CFCABB] sm:grid-cols-3">
            {FOUNDER_STATS.map((stat) => (
              <div key={stat.label} className="py-6 pr-6">
                <div className={cl(DISPLAY, "text-[44px] font-semibold leading-none tracking-[-0.03em]")}>{stat.value}</div>
                <div className="mt-2 text-sm text-[#4F5753]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[22px] bg-[#0D1210] p-8 text-[#F3F1EA] sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className={cl(DISPLAY, "text-[26px] font-semibold tracking-[-0.02em]")}>Tracked from first click to paid invoice</div>
              <div className="font-mono text-xs text-[#C2F26B]">META · GOOGLE</div>
            </div>
            <ol className="m-0 mt-8 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Ad click", "Meta or Google ad sends a new visitor"],
                ["Website", "Click ID and UTMs captured, not lost"],
                ["CRM lead", "Source, campaign and ad saved on the contact"],
                ["Booked", "Appointment set in the pipeline"],
                ["Paid customer", "Revenue tied back to the ad that earned it"],
              ].map(([title, desc], i) => (
                <li key={title} className={cl("rounded-[14px] p-[18px]", i === 4 ? "bg-[#C2F26B] text-[#0D1210]" : "border border-white/10 bg-[#151C19]")}>
                  <div className={cl("font-mono text-[11px]", i === 4 ? "" : "text-[#A3ADA7]")}>0{i + 1}</div>
                  <div className="mt-2 text-base font-semibold">{title}</div>
                  <div className={cl("mt-1.5 text-[13px] leading-[1.45]", i === 4 ? "" : "text-[#A3ADA7]")}>{desc}</div>
                </li>
              ))}
            </ol>
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#C2F26B]/55 px-[18px] py-4">
              <div className="flex items-center gap-3 text-[15px]">
                <span aria-hidden="true" className="text-xl text-[#C2F26B]">↩</span>
                <span>Booked and paid events are sent back to Meta and Google, with their value</span>
              </div>
              <div className="text-sm text-[#A3ADA7]">So the ads learn who actually becomes a customer</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOUNDER ============ */}
      <section id="about" className="pb-28">
        <div className={cl(WRAP, "grid grid-cols-1 items-center gap-14 md:grid-cols-[5fr_7fr]")}>
          <Image
            src="/images/diego-campos.jpg"
            alt="Diego Campos, founder of Booked Out"
            width={900}
            height={1125}
            sizes="(min-width: 768px) 460px, 100vw"
            className="aspect-[4/5] h-auto w-full rounded-[22px] bg-[#E9E6DC] object-cover"
          />
          <div>
            <div className={cl(EYEBROW, "text-[#4F5753]")}>WHO’S BEHIND BOOKED OUT</div>
            <h2 className={cl(DISPLAY, "m-0 mt-[18px] text-[clamp(34px,4.2vw,56px)] font-semibold leading-none tracking-[-0.035em]")}>
              Built by someone who’s had to make every ad dollar pay.
            </h2>
            <div className="mt-6 flex flex-col gap-4 text-[17px] leading-relaxed text-[#2B3530]">
              <p className="m-0">I’m Diego. Before Booked Out, I spent 15+ years running direct-to-consumer and lead-gen campaigns, where an ad that couldn’t prove it made money got turned off by Friday.</p>
              <p className="m-0">I kept seeing the same thing with local businesses: great work, decent ads, and no idea which dollars turned into customers. Tracking was broken, leads sat in inboxes, and the agency reported clicks.</p>
              <p className="m-0">Booked Out is the system I wish they’d had: a site that converts, follow-up that doesn’t slip, and ads tracked from first click to paid invoice. You work with me directly.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
              <span className="rounded-full bg-[#0D1210] px-3.5 py-2 text-[#F3F1EA]">$7M+ managed on Meta</span>
            </div>
            <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#CFCABB] pt-5">
              <div><span className="font-semibold">Diego Campos</span><span className="text-[#4F5753]">, Founder</span></div>
              <div className="text-sm text-[#4F5753]">Dripping Springs, Texas</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CASE STUDY ============ */}
      <section id="results" className="pb-28">
        <div className={WRAP}>
          <div className={cl(EYEBROW, "text-[#4F5753]")}>RESULTS</div>
          <h2 className={cl(H2, "mt-[18px]")}>Real numbers from a real client.</h2>

          <div className="mt-12 flex flex-wrap gap-3 rounded-[22px] border border-[#DEDACE] bg-white p-3">
            <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[22px] rounded-2xl bg-[#0D1210] p-8 text-[#F3F1EA]">
              <div className="flex items-center gap-3.5">
                <Image
                  src={CASE_STUDY.photo}
                  alt={CASE_STUDY.photoAlt}
                  width={128}
                  height={128}
                  className="h-16 w-16 flex-none rounded-full border-2 border-white/20 object-cover object-[center_20%]"
                />
                <div>
                  <div className={cl(DISPLAY, "text-[22px] font-semibold")}>{CASE_STUDY.client}</div>
                  <div className="mt-1.5 text-sm text-[#A3ADA7]">{CASE_STUDY.meta}</div>
                  <a href={CASE_STUDY.website} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#C2F26B] no-underline">
                    {CASE_STUDY.websiteLabel} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div>
                <div className="font-mono text-[11px] tracking-[0.06em] text-[#C2F26B]">THE PROBLEM</div>
                <p className="m-0 mt-2 text-[15px] leading-normal text-[#C9D1CC]">{CASE_STUDY.problem}</p>
              </div>
              <div>
                <div className="font-mono text-[11px] tracking-[0.06em] text-[#C2F26B]">WHAT WE DID</div>
                <ul className="m-0 mt-2.5 flex list-none flex-col gap-2.5 p-0 text-[15px]">
                  {CASE_STUDY.work.map((item) => (
                    <li key={item} className="flex gap-2.5"><span aria-hidden="true" className="text-[#C2F26B]">→</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex min-w-0 flex-[1.2_1_440px] flex-col justify-center gap-7 p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {CASE_STUDY.metrics.map((m) => (
                  <div key={m.label} className="rounded-[14px] bg-[#F3F1EA] p-[18px]">
                    <div className="text-[13px] text-[#4F5753]">{m.label}</div>
                    <div className={cl(DISPLAY, "mt-2 text-[34px] font-semibold tracking-[-0.03em]")}>{m.value}</div>
                    <div className="mt-1.5 text-[13px] text-[#4F5753]">{m.note}</div>
                  </div>
                ))}
              </div>
              {CASE_STUDY.quoteApproved && (
                <figure className="m-0 border-t border-[#DEDACE] pt-6">
                  <blockquote className={cl(DISPLAY, "m-0 text-[22px] leading-[1.35] tracking-[-0.01em]")}>“{CASE_STUDY.quote}”</blockquote>
                  <figcaption className="mt-3.5 text-sm text-[#4F5753]">{CASE_STUDY.quoteAttribution}</figcaption>
                </figure>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DEDACE] pt-6 text-sm">
                <span className="text-[#4F5753]">Plan used: <span className="font-semibold text-[#0D1210]">Growth + Ads</span></span>
                <a href="#pricing" className="inline-flex items-center gap-1.5 font-semibold text-[#0D1210]">See pricing <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ AUDIT ============ */}
      <section id="audit" className="bg-[#0D1210] py-28 text-[#F3F1EA]">
        <div className={cl(WRAP, "flex flex-wrap items-center gap-16")}>
          <div className="min-w-0 flex-[1_1_420px]">
            <div className={cl(EYEBROW, "text-[#C2F26B]")}>FREE REVENUE LEAK SNAPSHOT</div>
            <h2 className={cl(H2, "mt-[18px]")}>We show the leak before we sell the fix.</h2>
            <p className="m-0 mt-6 text-[17px] leading-relaxed text-[#B7C0BA]">
              Your website, Google profile, reviews and response speed, measured against the three businesses already winning the customers you want. Delivered within 48 hours, before any sales call.
            </p>
            <ul className="m-0 mt-8 flex list-none flex-col gap-3.5 p-0 text-[15px]">
              {["Yours to keep even if we’re not a fit", "Fixes ranked by impact, biggest first", "If we can’t show a clear path to more calls, don’t buy"].map((item) => (
                <li key={item} className="flex gap-3"><span aria-hidden="true" className="font-mono text-[#C2F26B]">→</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 flex-[1_1_520px] rounded-[22px] bg-[#F3F1EA] p-6 text-[#0D1210] sm:p-8">
            <div className="font-mono text-[11px] tracking-[0.06em] text-[#4F5753]">SAMPLE SNAPSHOT</div>
            <div className={cl(DISPLAY, "mt-1.5 text-[22px] font-semibold")}>Bright Space Cleaning vs. top 3 local competitors</div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "Mobile speed", value: "41", unit: "/100", note: "Slow on phones" },
                { label: "Review gap", value: "−38", unit: "", note: "Competitors look fresher" },
                { label: "Call-to-action", value: "C−", unit: "", note: "Phone buried below the fold" },
                { label: "Lead response", value: "20+", unit: " min", note: "Slow replies lose customers" },
              ].map((s) => (
                <div key={s.label} className="rounded-[14px] bg-white p-[18px]">
                  <div className="text-[13px] text-[#4F5753]">{s.label}</div>
                  <div className={cl(DISPLAY, "mt-1 text-[40px] font-semibold tracking-[-0.03em]")}>
                    {s.value}<span className="text-lg text-[#4F5753]">{s.unit}</span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#B03A0A]">{s.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[14px] bg-[#0D1210] p-[18px] text-[#F3F1EA]">
              <div className="font-mono text-[11px] tracking-[0.06em] text-[#C2F26B]">BIGGEST FIX FIRST</div>
              <div className="mt-2 text-[15px] leading-normal">Rebuild the first mobile screen around one clear way to book, real reviews and your service area before spending another dollar on ads.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="py-28">
        <div className={WRAP}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className={cl(EYEBROW, "text-[#4F5753]")}>HOW IT WORKS</div>
              <h2 className={cl(H2, "mt-[18px]")}>We build the system.<br />You run the business.</h2>
            </div>
            <p className="m-0 max-w-[380px] text-base leading-relaxed text-[#4F5753]">One kickoff, your logins, consolidated approvals. Everything else is on us, finished within 30 days of getting what we need.</p>
          </div>
          <ol className="m-0 mt-14 grid list-none grid-cols-1 border-t-2 border-[#0D1210] p-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Find the leaks", "Your site, profile, reviews and response path compared with local competitors."],
              ["Fix the first impression", "Pages, tap-to-call, trust proof and Google profile corrections go live."],
              ["Connect the follow-up", "Routing, acknowledgments and review requests tested end to end."],
              ["Measure and improve", "A monthly evidence report and one prioritized conversion fix."],
            ].map(([title, desc], i) => (
              <li key={title} className="pr-6 pt-7">
                <div className={cl(DISPLAY, "text-[56px] font-semibold leading-none tracking-[-0.04em]")}>0{i + 1}</div>
                <div className="mt-[18px] text-[19px] font-semibold">{title}</div>
                <div className="mt-2 text-[15px] leading-[1.55] text-[#4F5753]">{desc}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ COMPARISON ============ */}
      <section className="pb-28">
        <div className={WRAP}>
          <div className={cl(EYEBROW, "text-[#4F5753]")}>WHY OWNERS SWITCH</div>
          <h2 className={cl(H2, "mt-[18px] max-w-[760px]")}>Not like your last agency.</h2>
          <div className="mt-12 overflow-hidden rounded-[22px] border border-[#DEDACE] bg-white" role="table" aria-label="Typical agency compared with Booked Out">
            <div role="row" className="grid grid-cols-2 bg-[#0D1210] font-mono text-xs tracking-[0.06em] text-[#F3F1EA] md:grid-cols-[220px_1fr_1fr]">
              <div role="columnheader" className="hidden px-6 py-4 md:block"><span className="sr-only">Topic</span></div>
              <div role="columnheader" className="px-6 py-4 text-[#A3ADA7]">TYPICAL AGENCY</div>
              <div role="columnheader" className="px-6 py-4 text-[#C2F26B]">BOOKED OUT</div>
            </div>
            {COMPARISON.map((row) => (
              <div key={row.label} role="row" className="grid grid-cols-2 border-t border-[#E7E3D7] text-[15px] leading-[1.45] md:grid-cols-[220px_1fr_1fr]">
                <div role="rowheader" className="col-span-2 px-6 pb-0 pt-5 font-semibold md:col-span-1 md:py-5">{row.label}</div>
                <div role="cell" className="flex gap-2.5 px-6 py-5 text-[#4F5753]"><span aria-hidden="true" className="flex-none text-[#7A817D]">×</span><span>{row.them}</span></div>
                <div role="cell" className="flex gap-2.5 bg-[#F6F9EC] px-6 py-5 font-medium"><Tick /><span>{row.us}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="pb-28">
        <div className={WRAP}>
          <div className="mx-auto max-w-[760px] text-center">
            <div className={cl(EYEBROW, "text-[#4F5753]")}>PRICING</div>
            <h2 className={cl(H2, "mt-[18px]")}>Pick where to start. Upgrade anytime.</h2>
            <p className="mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed text-[#4F5753]">Every plan is month-to-month, and everything we build is in your name from day one.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={cl(
                  "flex flex-col rounded-3xl p-8",
                  plan.featured ? "bg-[#0D1210] text-[#F3F1EA] shadow-[0_30px_60px_rgba(13,18,16,0.18)]" : "border border-[#DEDACE] bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className={cl("font-mono text-xs tracking-[0.06em]", plan.featured ? "text-[#C2F26B]" : "text-[#4F5753]")}>{plan.eyebrow}</div>
                  {plan.featured && <span className="rounded-full bg-[#C2F26B] px-2.5 py-[5px] text-xs font-semibold text-[#0D1210]">Most results</span>}
                </div>
                <div className={cl(DISPLAY, "mt-2.5 text-[28px] font-semibold")}>{plan.name}</div>
                <div className="mt-[22px] flex items-baseline gap-1.5">
                  <span className={cl(DISPLAY, "text-[56px] font-semibold leading-none tracking-[-0.04em]")}>{plan.price}</span>
                  <span className={plan.featured ? "text-[#B7C0BA]" : "text-[#4F5753]"}>/month</span>
                </div>
                <div className={cl("mt-2.5 min-h-[42px] text-sm", plan.featured ? "text-[#B7C0BA]" : "text-[#4F5753]")}>{plan.priceNote}</div>
                <a
                  href="#get-started"
                  className={cl(
                    "mt-[22px] rounded-full p-4 text-center font-semibold no-underline",
                    plan.featured ? "bg-[#C2F26B] text-[#0D1210]" : "bg-[#0D1210] text-[#F3F1EA]"
                  )}
                >
                  {plan.cta}
                </a>
                <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0 text-sm leading-[1.45]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5"><Tick dark={plan.featured} />{feature}</li>
                  ))}
                </ul>
                {plan.featured && (
                  <a href="#results" className="mt-auto pt-6 text-[13px] text-[#B7C0BA] no-underline hover:text-[#F3F1EA]">
                    The setup behind {CASE_STUDY.client}’s results <span className="text-[#C2F26B]">→</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-9 rounded-3xl bg-[#E9E6DC] p-8 sm:p-9">
            <div className="min-w-0 flex-[1_1_360px]">
              <div className="font-mono text-xs tracking-[0.06em] text-[#4F5753]">ONE-TIME · ALREADY RUNNING ADS?</div>
              <div className="mt-2.5 flex flex-wrap items-baseline gap-3.5">
                <div className={cl(DISPLAY, "text-[32px] font-semibold tracking-[-0.02em]")}>Tracking Fix</div>
                <div className={cl(DISPLAY, "text-[32px] font-semibold tracking-[-0.02em]")}>
                  {TRACKING_FIX.price} <span className="font-sans text-[15px] font-normal text-[#4F5753]">one-time</span>
                </div>
              </div>
              <p className="m-0 mt-3.5 text-base leading-relaxed text-[#2B3530]">Keep your current agency, or keep running ads yourself. We rebuild your tracking so Meta and Google learn who actually becomes a customer, then hand you proof it works.</p>
              <div className="mt-3.5 text-sm text-[#4F5753]">Full price credited toward setup if you move to Growth + Ads within 60 days.</div>
            </div>
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px] leading-[1.45]">
                {TRACKING_FIX.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5"><Tick />{feature}</li>
                ))}
              </ul>
              <a href="#get-started" className="self-start rounded-full bg-[#0D1210] px-[22px] py-[15px] font-semibold text-[#F3F1EA] no-underline">Fix my tracking</a>
            </div>
          </div>

          <p className="mx-auto mt-7 max-w-[800px] text-center text-xs leading-relaxed text-[#4F5753]">{PRICING_FINE_PRINT}</p>
        </div>
      </section>

      {/* ============ TRADES ============ */}
      <section className="border-y border-[#D9D5C8] py-12">
        <div className={cl(WRAP, "flex flex-wrap items-center gap-7")}>
          <div className="flex-[0_0_220px] text-[15px] font-semibold">Built for any business that runs on leads and appointments</div>
          <ul className="m-0 flex flex-[1_1_600px] list-none flex-wrap gap-2 p-0">
            {TRADES.map((trade) => (
              <li key={trade} className="rounded-full border border-[#CFCABB] bg-white px-3.5 py-2 text-sm">{trade}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="py-28">
        <div className={cl(WRAP, "flex flex-wrap gap-16")}>
          <div className="min-w-0 flex-[1_1_320px]">
            <div className={cl(EYEBROW, "text-[#4F5753]")}>GOOD QUESTIONS</div>
            <h2 className={cl(DISPLAY, "m-0 mt-[18px] text-[clamp(36px,4.2vw,56px)] font-semibold leading-none tracking-[-0.035em]")}>Know exactly what you’re getting.</h2>
            <p className="m-0 mt-5 text-base leading-relaxed text-[#4F5753]">
              Still unsure? Call <a href={PHONE_HREF} onClick={onPhoneClick} className="font-semibold text-[#0D1210]">{PHONE_DISPLAY}</a> and talk to the person who’d build it.
            </p>
          </div>
          <Faq />
        </div>
      </section>

      {/* ============ CTA + FORM ============ */}
      <section id="get-started" className="bg-[#0D1210] pb-24 pt-28 text-[#F3F1EA]">
        <div className={cl(WRAP, "flex flex-wrap items-start gap-16")}>
          <div className="min-w-0 flex-[1_1_420px]">
            <div className={cl(EYEBROW, "text-[#C2F26B]")}>48-HOUR TURNAROUND · NO OBLIGATION</div>
            <h2 className={cl(DISPLAY, "m-0 mt-[18px] text-[clamp(40px,5.6vw,80px)] font-semibold leading-[0.95] tracking-[-0.04em]")}>
              Find out what’s standing between you and the next call.
            </h2>
            <p className="m-0 mt-6 max-w-[480px] text-[17px] leading-relaxed text-[#B7C0BA]">A real audit of your specific business, not a generic report. If we’re not a fit, the audit is still yours.</p>
            <div className="mt-9 border-t border-white/15 pt-7">
              <div className="text-[15px] text-[#B7C0BA]">Rather talk it through?</div>
              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                <a href={bookingHref} onClick={onBookingClick} className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/30 px-[22px] py-[15px] text-base font-semibold text-[#F3F1EA] no-underline hover:border-white/60">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {bookingIsPhone ? "Call to book a 15-minute chat" : "Book a 15-minute call"}
                </a>
                {!bookingIsPhone && <span className="text-sm text-[#A3ADA7]">Pick a time. No form.</span>}
              </div>
              <div className="mt-[18px] text-[15px] text-[#B7C0BA]">
                Or call <a href={PHONE_HREF} onClick={onPhoneClick} className="font-semibold text-[#C2F26B] no-underline">{PHONE_DISPLAY}</a>
              </div>
            </div>
          </div>
          <AuditForm />
        </div>

        <footer className={cl(WRAP, "mt-24 flex flex-wrap justify-between gap-5 border-t border-white/15 pt-7 text-[13px] text-[#A3ADA7]")}>
          <div>
            <Logo />
            <div className="mt-2">Websites, reviews, follow-up and tracked ads for local businesses.<br />Booked Out is a brand of ICDC Ventures LLC.</div>
          </div>
          <div className="flex items-end gap-[22px]">
            <a href="/privacy" className="text-[#A3ADA7]">Privacy</a>
            <a href="/terms" className="text-[#A3ADA7]">Terms</a>
            <span>© 2026 Booked Out</span>
          </div>
        </footer>
      </section>
    </div>
  );
}

