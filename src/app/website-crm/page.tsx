import type { Metadata } from "next";
import { Navigation, CRMPreview, SetupPlanner } from "./preview-interactions";
import s from "./website-crm.module.css";

const title = "Your website. Your next conversation. | Booked Out";
const description =
  "A website that earns the inquiry. Booked Out CRM to help your team handle what comes next. A proposed direction for established home-service businesses.";
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/website-crm" },
  openGraph: { title, description, url: "/website-crm", images: [] },
  twitter: { card: "summary", title, description, images: [] },
};
export function Brand() {
  return (
    <a href="#main" className={s.brand} aria-label="Booked Out, back to top">
      <svg viewBox="0 0 38 38" aria-hidden="true">
        <rect width="38" height="38" rx="2" fill="currentColor" />
        <path
          d="M10 27 27 10M12 10h15v15"
          stroke="#f6d84e"
          strokeWidth="3.5"
          fill="none"
        />
      </svg>
      <span>
        booked<span className={s.brandOut}>out</span>
        <span className={s.brandDot}>.</span>
      </span>
    </a>
  );
}
function CTA({
  children = "Plan my website + CRM",
}: {
  children?: React.ReactNode;
}) {
  return (
    <a className={s.cta} href="#plan">
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className={s.label}>{children}</p>;
}
function HouseArt() {
  return (
    <svg viewBox="0 0 360 260" aria-hidden="true" className={s.houseArt}>
      <defs>
        <pattern id="roof" width="12" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 7h12" stroke="#65695f" strokeWidth="1" />
        </pattern>
      </defs>
      <circle cx="284" cy="63" r="32" fill="#d9bd65" />
      <path d="M0 233h360v27H0Z" fill="#b6b9a8" />
      <path d="m26 146 140-98 147 98Z" fill="#52584e" />
      <path d="m26 146 140-98 147 98Z" fill="url(#roof)" />
      <path d="M49 145h241v92H49Z" fill="#e6e1cc" />
      <path d="m166 61 126 88v88H166Z" fill="#d3d0bd" />
      <path d="M160 135h44v102h-44Z" fill="#3e4b42" />
      <path
        d="M73 157h61v49H73ZM227 157h41v49h-41Z"
        fill="#7d968c"
        stroke="#f7f2dd"
        strokeWidth="7"
      />
      <path
        d="M103 154v54m-33-29h67m109-25v54m-23-29h49"
        stroke="#f7f2dd"
        strokeWidth="4"
      />
      <path d="M154 237h55l14 23h-83Z" fill="#a7a99b" />
      <path
        d="M30 223c-22-46 8-65 18-22 12-44 40-38 25 22M266 231c-16-39 5-60 19-30 12-45 43-31 28 30"
        fill="#717e65"
      />
      <path
        d="M335 235V112m0 49-23-27m23 49 20-27"
        stroke="#717e65"
        strokeWidth="9"
      />
      <path
        d="M42 147 165 60l128 87"
        stroke="#f0ebd7"
        strokeWidth="5"
        fill="none"
      />
    </svg>
  );
}
function WebsitePreview() {
  return (
    <div className={s.websiteMock}>
      <div className={s.windowBar}>
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>YOUR WEBSITE / FIRST IMPRESSION</span>
      </div>
      <div className={s.siteNav}>
        <strong>
          FIELDWORK<span>HOME SERVICES</span>
        </strong>
        <span>Austin & surrounding areas</span>
      </div>
      <div className={s.siteHero}>
        <span className={s.tinyLabel}>GOOD HOMES. GOOD HANDS.</span>
        <p>
          A home worth
          <br />
          taking care of.
        </p>
        <span>
          Repairs, maintenance and the next project.
          <br />
          Tell us what your home needs.
        </span>
        <span className={s.mockCTA}>
          Request an estimate <b>↗</b>
        </span>
        <HouseArt />
      </div>
      <div className={s.siteFoot}>
        <span>Your services.</span>
        <span>Your service area.</span>
        <span>Your real work.</span>
      </div>
    </div>
  );
}
const faqs = [
  [
    "Can I start with just the website?",
    "Yes. A website is a standalone project. CRM, care and marketing are separate decisions. We can review your existing website and CRM first rather than replacing something that already works.",
  ],
  [
    "What exactly is Booked Out CRM?",
    "It is our branded version of the HighLevel platform, not custom-built proprietary software. It can bring contacts, pipeline stages, conversations, calendars and configured follow-up into one workspace. Available features depend on the subscription and setup we agree.",
  ],
  [
    "Does the subscription mean you handle everything?",
    "No. Platform access, initial configuration and ongoing managed work are distinct. We define your forms, pipeline, calendars, users, approved workflows and training in the setup quote. Additional integrations, campaigns, daily lead handling and continuing management require a separate scope.",
  ],
  [
    "Can it text customers or follow up automatically?",
    "The platform supports configured email and SMS workflows, but they are not automatically enabled or included. SMS requires appropriate consent, A2P registration where applicable, opt-out handling and provider approval. Email sending also needs configuration and consent as appropriate. Messaging, phone and other usage charges are itemized separately. We agree what can be activated before any messages are sent.",
  ],
  [
    "How much does it cost, and what do I keep?",
    "The website receives a fixed project quote: 50% to begin and the balance before launch. CRM subscription, setup, hosting, licenses and any usage costs are quoted separately. Account access, website handover, data export and cancellation terms are documented before payment. This preview is not a finalized price list or agreement.",
  ],
  [
    "Will this guarantee more jobs?",
    "No. A clearer website and a defined response process address the customer path, not market demand or your team's availability. We do not guarantee calls, leads, rankings, bookings or revenue. We test what we build and distinguish contact activity from completed jobs.",
  ],
];
export default function WebsiteCRMPage() {
  return (
    <div className={s.page}>
      <a href="#main" className={s.skip}>
        Skip to content
      </a>
      <div className={s.previewNotice}>
        <span>DESIGN PREVIEW</span> Proposed website + CRM offer. Not the active
        price list.
      </div>
      <header className={`${s.wrap} ${s.header}`}>
        <Brand />
        <Navigation />
      </header>
      <main id="main">
        <section className={`${s.wrap} ${s.hero}`}>
          <Label>FOR ESTABLISHED HOME-SERVICE BUSINESSES</Label>
          <div className={s.heroGrid}>
            <h1>
              A better <span className={s.keep}>first impression.</span>
              <br />
              <span className={s.muted}>
                A clearer <span className={s.keep}>next step.</span>
              </span>
            </h1>
            <div className={s.heroAside}>
              <p className={s.deck}>
                Your website earns the inquiry.
                <br />
                Your CRM helps you follow through.
              </p>
              <p>
                We build the site homeowners check before they call, then set up
                Booked Out CRM around the way your team handles contacts,
                estimates and appointments.
              </p>
              <CTA />
              <p className={s.fine}>
                Start with your website. Add the CRM when it fits.
              </p>
            </div>
          </div>
          <figure className={s.storyBoard}>
            <div className={s.boardHeading}>
              <span>ONE CUSTOMER PATH. TWO CONNECTED PARTS.</span>
              <span>Illustrative demo · fictional business and records</span>
            </div>
            <div className={s.boardGrid}>
              <div className={s.websiteSide}>
                <div className={s.boardLabel}>
                  <span>01 / EARN THE INQUIRY</span>
                  <strong>The website</strong>
                </div>
                <WebsitePreview />
              </div>
              <div className={s.connection} aria-hidden="true">
                <span>→</span>
              </div>
              <div className={s.crmSide}>
                <div className={s.boardLabel}>
                  <span>02 / HANDLE WHAT COMES NEXT</span>
                  <strong>Booked Out CRM</strong>
                </div>
                <CRMPreview compact />
              </div>
            </div>
            <figcaption>
              <span>
                Clear services. Real proof. An obvious way to reach you.
              </span>
              <span>
                One place to see the conversation and the next action.
              </span>
            </figcaption>
          </figure>
        </section>
        <div className={s.tradeStrip}>
          <div className={s.wrap}>
            <span>BUILT AROUND THE WAY LOCAL TEAMS WORK</span>
            <p>
              HVAC <i>/</i> Plumbing <i>/</i> Electrical <i>/</i> Roofing{" "}
              <i>/</i> Home services
            </p>
          </div>
        </div>
        <section className={`${s.wrap} ${s.websiteSection}`} id="website">
          <div className={s.sectionRail}>
            <span>01</span>
            <Label>MAKE THE FIRST LOOK COUNT</Label>
          </div>
          <div className={s.editorialGrid}>
            <div>
              <h2>
                Good work deserves
                <br />a <span className={s.keep}>better introduction.</span>
              </h2>
              <p className={s.deck}>
                A referral still checks your website.
                <br />
                Give them a reason to stay.
              </p>
              <p>
                Show the services you actually provide, the places you serve and
                the work you can stand behind. Then make the call or inquiry
                easy, especially on a phone.
              </p>
              <a className={s.textLink} href="#plan">
                Start with the website direction{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className={s.deliverables}>
              {[
                [
                  "A direction before the deposit",
                  "We confirm fit, then show a homepage concept, recommended page map and fixed quote. A proposal you can judge, not a finished free website.",
                ],
                [
                  "A site built for your business",
                  "Service-specific copy, mobile-first pages and approved customer proof. The page count, content, revisions and technical needs are agreed in writing.",
                ],
                [
                  "A tested path to your team",
                  "Clear call links and an inquiry form. We verify the agreed delivery path and define who takes the next step. Tracking records contact actions, not invented bookings.",
                ],
              ].map(([h, p], i) => (
                <article key={h}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{h}</h3>
                    <p>{p}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className={s.crmSection} id="crm">
          <div className={s.wrap}>
            <div className={s.sectionRail}>
              <span>02</span>
              <Label>GIVE EVERY INQUIRY A NEXT STEP</Label>
            </div>
            <div className={s.crmIntro}>
              <h2>
                The call comes in.
                <br />
                What <span className={s.keep}>comes next?</span>
              </h2>
              <div>
                <p className={s.deck}>
                  Less hunting through inboxes.
                  <br />
                  More clarity on who needs a reply.
                </p>
                <p>
                  Booked Out CRM brings contacts, conversations, pipeline stages
                  and booking into one workspace. We configure the parts your
                  team needs, instead of handing you a login and a pile of
                  features.
                </p>
                <p className={s.platformNote}>
                  Powered by HighLevel. Branded and configured by Booked Out.
                </p>
              </div>
            </div>
            <div className={s.crmWalkthrough}>
              <CRMPreview />
              <div className={s.crmNotes}>
                <Label>FROM INQUIRY TO NEXT ACTION</Label>
                <h3>
                  A workflow your
                  <br />
                  team can actually use.
                </h3>
                <dl>
                  <div>
                    <dt>Know the person</dt>
                    <dd>Contact details and conversation history together.</dd>
                  </div>
                  <div>
                    <dt>Know the stage</dt>
                    <dd>
                      A pipeline that reflects your estimate and booking
                      process.
                    </dd>
                  </div>
                  <div>
                    <dt>Know the next step</dt>
                    <dd>
                      A responsible team member, appointment or approved
                      follow-up.
                    </dd>
                  </div>
                </dl>
                <p className={s.fine}>
                  Explore the demo tabs. These are sample records, not a
                  connected account or live customer data.
                </p>
              </div>
            </div>
            <div className={s.scopeBar}>
              <strong>
                Software is the platform.
                <br />
                Setup makes it yours.
              </strong>
              <p>
                Your quote defines configuration, training and any approved
                workflows. Ongoing lead handling, managed campaigns and custom
                integrations are separate. SMS is only activated after consent,
                registration and provider requirements are met. Messaging and
                other usage charges are separate.
              </p>
            </div>
          </div>
        </section>
        <section className={`${s.wrap} ${s.commercial}`} id="scope">
          <div className={s.sectionRail}>
            <span>03</span>
            <Label>THE INVESTMENT, WITHOUT THE GUESSWORK</Label>
          </div>
          <div className={s.commercialIntro}>
            <h2>
              One starting point.
              <br />
              Not <span className={s.keep}>one bundled bill.</span>
            </h2>
            <p>
              You can commission the website, add CRM, or ask us to handle more
              after launch. Every part has its own scope and costs.
            </p>
          </div>
          <div className={s.offerRows}>
            <article>
              <span>BUILD</span>
              <div>
                <h3>Your website</h3>
                <p>
                  Homepage direction, agreed pages, build, launch checks and
                  documented handover.
                </p>
              </div>
              <div>
                <strong>A fixed project quote</strong>
                <p>
                  50% to begin.
                  <br />
                  Balance before launch.
                </p>
              </div>
            </article>
            <article>
              <span>ORGANIZE</span>
              <div>
                <h3>Booked Out CRM</h3>
                <p>
                  Monthly platform access plus the setup your team needs. Scope
                  and training agreed first.
                </p>
              </div>
              <div>
                <strong>Quoted with your setup</strong>
                <p>
                  Subscription and setup separated.
                  <br />
                  Usage charges itemized.
                </p>
              </div>
            </article>
            <article>
              <span>EXPAND</span>
              <div>
                <h3>Support when you need it</h3>
                <p>
                  Optional website care, managed follow-up, local search or paid
                  ads. Start with the problem worth solving.
                </p>
              </div>
              <div>
                <strong>Separately scoped</strong>
                <p>
                  No automatic marketing retainer.
                  <br />
                  Ad spend is separate.
                </p>
              </div>
            </article>
          </div>
          <p className={s.fine}>
            Hosting, licenses, access, export and cancellation terms are
            documented before payment. No preset launch deadline or outcome
            guarantee.
          </p>
        </section>
        <section className={s.founderSection}>
          <div className={`${s.wrap} ${s.founderGrid}`}>
            <div>
              <Label>DIRECT, FOUNDER-LED WORK</Label>
              <h2>
                Talk to the person
                <br />
                behind <span className={s.keep}>the plan.</span>
              </h2>
            </div>
            <div>
              <p className={s.deck}>I’m Diego Campos, founder of Booked Out.</p>
              <p>
                We start by looking at your website and how your team handles
                inquiries today. If what you already have works, we build around
                it. If it doesn’t, we’ll define what needs to change before you
                pay.
              </p>
              <div className={s.founderSignature}>
                <span className={s.initials}>DC</span>
                <div>
                  <strong>Diego Campos</strong>
                  <span>Founder / Booked Out</span>
                </div>
                <a href="tel:+17372605332">
                  (737) 260-5332 <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        <section className={`${s.wrap} ${s.faqSection}`} id="questions">
          <div>
            <Label>A FEW THINGS WORTH ASKING</Label>
            <h2>
              Before we
              <br />
              <span className={s.keep}>get to work.</span>
            </h2>
          </div>
          <div>
            {faqs.map(([q, a]) => (
              <details className={s.faq} key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={`${s.wrap} ${s.planSection}`} id="plan">
          <div>
            <Label>START WITH YOUR BUSINESS</Label>
            <h2>
              Your next chapter.
              <br />
              <span className={s.muted}>
                A <span className={s.keep}>clearer plan.</span>
              </span>
            </h2>
            <p className={s.deck}>
              Website first. CRM where it helps.
              <br />
              More marketing when you’re ready.
            </p>
            <p>
              Use this local preview planner to explore a starting scope. To
              discuss a real project, call Diego. No information from this
              planner is sent or saved.
            </p>
            <a className={s.textLink} href="tel:+17372605332">
              Talk to Diego: (737) 260-5332 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <SetupPlanner />
        </section>
      </main>
      <footer className={`${s.wrap} ${s.footer}`}>
        <Brand />
        <p>
          ICDC Ventures LLC, doing business as Booked Out.
          <br />
          Website + CRM design preview. No live integrations.
        </p>
        <nav aria-label="Legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
