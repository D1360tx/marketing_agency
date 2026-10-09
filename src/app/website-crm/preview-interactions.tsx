"use client";
import { useEffect, useState } from "react";
import s from "./website-crm.module.css";

export function Navigation() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <button
        className={s.menuButton}
        aria-expanded={open}
        aria-controls="page-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Menu"}
        <span aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
      <nav
        id="page-nav"
        className={`${s.navigation} ${open ? s.navigationOpen : ""}`}
        aria-label="Page navigation"
      >
        <a href="#website" onClick={() => setOpen(false)}>
          The website
        </a>
        <a href="#crm" onClick={() => setOpen(false)}>
          The CRM
        </a>
        <a href="#scope" onClick={() => setOpen(false)}>
          The investment
        </a>
        <a className={s.navCTA} href="#plan" onClick={() => setOpen(false)}>
          Plan my setup <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </>
  );
}
const tabs = ["Pipeline", "Conversation", "Booking"] as const;
export function CRMPreview({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Pipeline");
  const id = compact ? "hero-demo" : "workflow-demo";
  return (
    <div className={`${s.crmMock} ${compact ? s.compact : ""}`}>
      <div className={s.crmTop}>
        <strong>
          <span className={s.miniMark}>↗</span> bookedout<span>.</span>
        </strong>
        <span>CRM / DEMO</span>
      </div>
      <div className={s.crmContext}>
        <span>FIELDWORK HOME SERVICES</span>
        <p>
          Every conversation.
          <br />
          <strong>A next step.</strong>
        </p>
      </div>
      <div
        className={s.demoTabs}
        role="tablist"
        aria-label="Illustrative CRM views"
      >
        {tabs.map((name, i) => (
          <button
            key={name}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={name === tab}
            aria-controls={`${id}-panel`}
            tabIndex={name === tab ? 0 : -1}
            onClick={() => setTab(name)}
            onKeyDown={(e) => {
              if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                setTab(tabs[next]);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${tabs.indexOf(tab)}`}
        className={s.demoPanel}
        tabIndex={0}
      >
        {tab === "Pipeline" && (
          <div className={s.pipeline}>
            {[
              [
                "New inquiry",
                "Alex Morgan",
                "AC repair",
                "Assign a team member",
              ],
              [
                "Estimate sent",
                "Sam Taylor",
                "Panel upgrade",
                "Review next action",
              ],
              [
                "Appointment",
                "Jordan Lee",
                "Maintenance",
                "Confirm appointment",
              ],
            ].map(([stage, name, service, action], i) => (
              <div className={s.pipelineColumn} key={stage}>
                <div className={s.stage}>
                  <i /> {stage}
                  <span>1</span>
                </div>
                <div className={s.contactCard}>
                  <span className={s.avatar}>
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <strong>{name}</strong>
                  <p>{service}</p>
                  <span className={s.cardRule} />
                  <small>
                    {i === 0 ? "Website inquiry" : "Sample opportunity"}
                  </small>
                  <span className={s.nextAction}>{action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "Conversation" && (
          <div className={s.conversation}>
            <div className={s.contactHeading}>
              <span className={s.avatar}>AM</span>
              <div>
                <strong>Alex Morgan</strong>
                <span>Sample website inquiry / AC repair</span>
              </div>
            </div>
            <div className={s.message}>
              Our AC is running but the house isn’t cooling. Do you serve North
              Austin?
            </div>
            <div className={s.replyDraft}>
              <span>EXAMPLE REPLY DRAFT / NOT SENT</span>
              <p>
                Hi Alex, thanks for the details. Our team can confirm service
                availability and the next appointment option.
              </p>
            </div>
            <p className={s.demoHint}>
              Keep the context with the contact.
              <br />
              Your team owns the reply.
            </p>
          </div>
        )}
        {tab === "Booking" && (
          <div className={s.booking}>
            <span className={s.tinyLabel}>SAMPLE APPOINTMENT</span>
            <div className={s.calendarIcon}>
              <span>ILLUSTRATION</span>
              <strong>Thu</strong>
            </div>
            <h4>Maintenance visit</h4>
            <p>Jordan Lee · Assigned team member</p>
            <div>
              <span>Next step</span>
              <strong>Confirm with the customer</strong>
            </div>
            <p className={s.demoHint}>
              Calendar rules and availability are configured
              <br />
              for your team. No appointment is booked here.
            </p>
          </div>
        )}
      </div>
      <div className={s.demoFooter}>
        <span className={s.demoDot} /> Illustrative interface. No live
        connection.
      </div>
    </div>
  );
}
export function SetupPlanner() {
  const [result, setResult] = useState<{ trade: string; focus: string } | null>(
    null,
  );
  return (
    <div className={s.planner}>
      <span className={s.label}>LOCAL PREVIEW PLANNER</span>
      <h3>Where do you want to start?</h3>
      <p>Explore a scope, not a sales submission.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setResult({
            trade: String(d.get("trade")),
            focus: String(d.get("focus")),
          });
        }}
      >
        <label htmlFor="trade">Your type of business</label>
        <select id="trade" name="trade" required defaultValue="">
          <option value="" disabled>
            Select your trade
          </option>
          {[
            "HVAC",
            "Plumbing",
            "Electrical",
            "Roofing",
            "Other home service",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <label htmlFor="focus">What needs attention first?</label>
        <select id="focus" name="focus" required defaultValue="">
          <option value="" disabled>
            Choose a starting point
          </option>
          <option>Website + CRM</option>
          <option>Website first</option>
          <option>CRM for my existing website</option>
        </select>
        <button type="submit" className={s.cta}>
          Preview my starting scope <span aria-hidden="true">↗</span>
        </button>
        <p className={s.fine}>
          Demo only. Nothing is transmitted, stored or booked.
        </p>
      </form>
      {result && (
        <div className={s.plannerResult} role="status">
          <strong>Your local plan: {result.focus}</strong>
          <p>
            For your {result.trade.toLowerCase()} business, start by reviewing{" "}
            {result.focus === "Website first"
              ? "your services, service area, current pages and contact path"
              : result.focus === "Website + CRM"
                ? "your website, inquiry delivery, pipeline and the team responsible for replies"
                : "your existing form, contact records, pipeline, calendars and response process"}
            .
          </p>
          <p>
            Next: discuss the scope with Diego. This is not a quote or a
            submitted request.
          </p>
          <a href="tel:+17372605332">
            Call (737) 260-5332 <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
