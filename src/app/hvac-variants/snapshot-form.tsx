"use client";

import { useRef, useState, type FormEvent } from "react";
import { PublicFormTurnstile } from "@/components/public-form-turnstile";
import s from "./variants.module.css";

export function SnapshotForm({ variant }: { variant: "system" | "snapshot" }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [token, setToken] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() && !token) {
      setStatus("error"); setMessage("Please complete the security check, then try again."); return;
    }
    busy.current = true;
    setStatus("sending"); setMessage("");
    const fields = new FormData(form);
    const value = (key: string) => String(fields.get(key) || "").trim();
    try {
      const response = await fetch("/api/leads/inbound", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: value("business"), email: value("email"),
          website: value("website"), businessType: "HVAC", source: `hvac-variants/${variant}`,
          smsConsent: false, turnstileToken: token, contact_time: value("contact_time") }),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error("Request not confirmed");
      setStatus("success");
      setMessage("Your request is received. We’ll follow up by email to confirm your business details and arrange your Snapshot review. No meeting or paid service has been booked.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("We couldn’t confirm your request. Your details are still here. Please try again in a moment.");
    } finally {
      busy.current = false; setToken(""); setChallengeKey((key) => key + 1);
    }
  }
  return <form className={s.form} action="/api/leads/inbound" method="post" onSubmit={submit} aria-label="Request your Revenue Leak Snapshot" aria-busy={status === "sending"}>
    <label htmlFor={`${variant}-business`}>HVAC business name<input id={`${variant}-business`} name="business" autoComplete="organization" required maxLength={160} pattern=".*\S.*" placeholder="Your company" /></label>
    <label htmlFor={`${variant}-email`}>Work email<input id={`${variant}-email`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@yourcompany.com" /></label>
    <label htmlFor={`${variant}-website`}>Website <span>(optional)</span><input id={`${variant}-website`} name="website" type="url" pattern="https?://.*" autoComplete="url" maxLength={2048} placeholder="https://yourcompany.com" /><small>Include https://. No website yet? Leave this blank.</small></label>
    <div className={s.trap} aria-hidden="true"><label>Leave this empty<input name="contact_time" tabIndex={-1} autoComplete="off" /></label></div>
    <noscript>Please enable JavaScript to send this request securely.</noscript>
    <PublicFormTurnstile key={challengeKey} action="inbound_lead" onToken={setToken} />
    <button className={s.cta} disabled={status === "sending" || status === "success"} type="submit">{status === "sending" ? "Sending your request…" : status === "success" ? "Snapshot requested" : "Get My Revenue Leak Snapshot"}<span aria-hidden="true">↗</span></button>
    <p className={s.fine}>Free Snapshot. No card required. By requesting it, you agree to email follow-up about your request and Booked Out services. No SMS. <a href="/privacy">Privacy policy</a>.</p>
    <p className={status === "error" ? s.error : s.success} role={status === "error" ? "alert" : "status"} aria-live="polite">{message}</p>
  </form>;
}
