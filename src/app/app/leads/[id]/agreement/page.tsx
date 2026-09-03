"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProspectWithAnalysis } from "@/types";

const scope = [
  "Managed mobile-first website and hosting, up to seven core pages",
  "Google Business Profile foundation audit and approved corrections",
  "Neutral review-request workflow by email, up to 100 eligible requests per month",
  "One primary lead form/inbox with routing and delivery tests",
  "Supported email acknowledgment and manual-first follow-up process, up to 50 inbound leads per month",
  "Two consolidated website revision rounds during implementation",
  "Monthly website maintenance within the approved scope",
  "One prioritized conversion improvement per month after launch",
  "Monthly evidence report and 30-minute Growth Desk review",
];

type AgreementSection = {
  title: string;
  items: string[];
  intro?: string;
  outro?: string;
};

const agreementSections: AgreementSection[] = [
  {
    title: "2. Scope and Launch",
    items: [
      "Company will provide the selected services using a written onboarding and launch plan.",
      "Launch timing begins only after Client provides the required content, approvals, account access, and legally usable customer data.",
      "Timing may depend on domain access, third-party platforms, carrier registration, messaging approval, and Client response time.",
      "Work outside the selected service requires written approval and may require a separate fee.",
      "No geographic or trade exclusivity is granted unless the Parties sign a separate written territory addendum.",
      "After Company receives the required access, accurate information, assets, and approvals, Company will complete the agreed core foundation within 30 calendar days.",
      "If a Company-caused delay prevents completion of the agreed core foundation within that period, Company will not charge the next recurring service month until the missing agreed foundation is complete.",
      "The 30-day commitment excludes delays caused by Client, missing or inaccurate information, slow approvals, domains, third-party platform review or enforcement, verification, outages, legal or policy restrictions, and material scope changes. It is a delivery commitment, not an outcome guarantee.",
    ],
  },
  {
    title: "3. Term, Renewal, and Cancellation",
    items: [
      "Service begins on the Effective Date and renews monthly until cancelled.",
      "Either Party may cancel before the next renewal date by written notice to hello@trybookedout.com. Client may also call (737) 260-5332, but written confirmation is required.",
      "Service continues through the current paid billing period. Except where required by law, partial months are not refunded.",
      "Company may suspend service for nonpayment, unlawful use, policy violations, security risks, or Client actions that prevent delivery.",
      "Sections intended by their nature to survive termination, including payment, ownership, confidentiality, warranty disclaimers, and liability limits, will survive.",
    ],
  },
  {
    title: "4. Fees and Payment",
    items: [
      "Monthly fee: $499, billed in advance through Company’s approved payment processor.",
      "Client authorizes recurring charges until cancellation takes effect.",
      "Standard hosting, reporting, and usage within the stated scope are included. Company will obtain Client’s written approval before charging for premium third-party software, paid media, domain purchases, extra locations, unusual volume, or out-of-scope work.",
      "Company may suspend services when an invoice is more than seven days past due.",
      "Taxes imposed on Client’s purchase are Client’s responsibility, excluding taxes on Company’s income.",
    ],
  },
  {
    title: "5. Client Responsibilities and Messaging Compliance",
    intro: "Client will:",
    items: [
      "Provide accurate business information, timely approvals, and required account access.",
      "Maintain ownership or lawful authorization for all logos, photos, copy, customer data, and other materials supplied to Company.",
      "Provide customer contact data only when Client has a lawful basis to use it for the selected communication channel.",
      "Do not provide customer phone numbers for automated messaging unless the Parties later sign an SMS addendum and Client maintains the required consent records.",
      "Do not request review gating, sentiment filtering, misleading reviews, purchased reviews, or other conduct prohibited by a review platform.",
      "Honor opt-outs and suppression requests and do not re-add suppressed recipients without a new lawful basis.",
      "Avoid altering or disabling Company-managed systems without coordination.",
    ],
    outro: "Company may refuse or stop any campaign or workflow that it reasonably believes violates law, carrier rules, platform policy, or this Agreement.",
  },
  {
    title: "6. Results and Third-Party Platforms",
    items: [
      "Company does not guarantee any specific number of calls, leads, reviews, rankings, jobs, sales, or revenue.",
      "Results vary by market, starting point, customer volume, competition, Client cooperation, and third-party platform behavior.",
      "Company will establish an available baseline and report separately: work completed; observable leading indicators such as email delivery, eligible review requests, new reviews, rating movement, form delivery, response handling, and website performance; and Client-reported or attribution-supported business outcomes.",
      "Google, telecommunications carriers, hosting providers, search engines, payment processors, and other third parties may change policies, availability, pricing, or algorithms outside Company’s control.",
    ],
  },
  {
    title: "7. Website, Content, and Intellectual Property",
    items: [
      "Client retains ownership of materials Client supplies.",
      "Company retains ownership of its pre-existing software, templates, processes, automations, integrations, libraries, and know-how.",
      "After three fully paid months, and provided the account is current, Client may request an export of Client-specific website content and core page files created under this Agreement.",
      "Hosting accounts, software integrations, automation logic, third-party licenses, and Company’s reusable systems are not transferred unless expressly agreed in writing.",
      "Before three paid months, the managed website remains part of the Booked Out service and no export is required.",
      "Company may display Client names, logos, quotations, results, or non-confidential work in a portfolio only with Client’s written permission.",
    ],
  },
  {
    title: "8. Confidentiality and Data",
    items: [
      "Each Party will protect the other Party’s non-public business information using reasonable care.",
      "Company may process Client and customer data only as needed to provide, secure, support, and document the services.",
      "Client will not send passwords by ordinary email or place secret credentials in public form fields.",
      "Each Party will promptly notify the other of a known incident materially affecting shared confidential information.",
    ],
  },
  {
    title: "9. Warranties and Disclaimers",
    items: [
      "Company warrants that it will perform the services in a professional and workmanlike manner.",
      "Client’s exclusive remedy for a proven breach of this warranty is re-performance of the affected service, if reasonably possible.",
      "Except for the express warranty above, services are provided “as is” and “as available” to the fullest extent permitted by law.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    intro: "To the fullest extent permitted by law:",
    items: [
      "Neither Party is liable for indirect, incidental, special, punitive, or consequential damages, or for lost profits or revenue.",
      "Company’s total liability arising from this Agreement will not exceed the fees Client paid Company during the three months immediately before the event giving rise to the claim.",
      "These limitations do not apply where prohibited by law or to fraud, willful misconduct, or obligations that cannot legally be limited.",
    ],
  },
  {
    title: "11. Disputes and Governing Law",
    items: [
      "The Parties will first provide written notice of a dispute and attempt in good faith to resolve it for at least 15 days.",
      "Unless prohibited by law, unresolved disputes will be decided by binding arbitration in Hays County, Texas, under the applicable rules of the American Arbitration Association.",
      "Texas law governs this Agreement without regard to conflict-of-law rules.",
    ],
  },
  {
    title: "12. General Terms",
    items: [
      "This Agreement and any signed statement of work or addendum are the entire agreement between the Parties concerning the services.",
      "Changes must be in writing and accepted by both Parties.",
      "Client may not assign this Agreement without Company’s written consent, except as part of a sale of substantially all of Client’s business.",
      "If one provision is unenforceable, the remaining provisions remain effective.",
      "Electronic signatures and counterparts are valid and enforceable to the extent permitted by law.",
    ],
  },
];

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function LeadAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<ProspectWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(localDate());
  const [legalName, setLegalName] = useState("");
  const [address, setAddress] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/prospects/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (!response.ok || !result.prospect) throw new Error(result.error || "Lead not found");
        const prospect = result.prospect as ProspectWithAnalysis;
        setLead(prospect);
        setLegalName(prospect.business_name || "");
        setAddress([prospect.address, prospect.city, prospect.state, prospect.zip].filter(Boolean).join(", "));
        setEmail(prospect.email || "");
        setPhone(prospect.phone || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load this lead");
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10 print:max-w-none print:space-y-0 print:p-0">
      <style jsx global>{`@media print { aside, header, nav, .agreement-toolbar, .agreement-fields { display: none !important; } main { margin: 0 !important; padding: 0 !important; } .agreement-document { border: 0 !important; box-shadow: none !important; } }`}</style>
      <div className="agreement-toolbar flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 sm:h-9 sm:w-9">
            <Link href={`/app/leads/${id}`} aria-label="Back to lead"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0"><h1 className="text-xl font-bold sm:text-2xl">Agreement</h1><p className="truncate text-sm text-muted-foreground">{lead?.business_name || "Lead"}</p></div>
        </div>
        <Button onClick={() => window.print()} className="min-h-11 shrink-0"><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button>
      </div>

      {error ? <Card className="border-red-200"><CardContent className="p-4 text-sm text-red-700 sm:p-6">{error}</CardContent></Card> : (
        <>
          <Card className="agreement-fields">
            <CardHeader className="p-4 sm:p-6"><CardTitle>Confirm client details</CardTitle><CardDescription>Lead data is prefilled. Confirm the client’s legal name and signer details before sending for signature.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0">
              <Field label="Effective date" value={effectiveDate} setValue={setEffectiveDate} type="date" />
              <Field label="Client legal name" value={legalName} setValue={setLegalName} />
              <div className="sm:col-span-2"><Field label="Client address" value={address} setValue={setAddress} /></div>
              <Field label="Signer name" value={signerName} setValue={setSignerName} />
              <Field label="Signer title" value={signerTitle} setValue={setSignerTitle} />
              <Field label="Signer email" value={email} setValue={setEmail} type="email" />
              <Field label="Signer phone" value={phone} setValue={setPhone} type="tel" />
            </CardContent>
          </Card>

          <article className="agreement-document rounded-xl border bg-white p-5 text-sm leading-6 shadow-sm sm:p-10 print:text-[10pt] print:leading-5">
            <h2 className="text-center text-2xl font-bold">Booked Out Client Service Agreement</h2>
            <p className="mt-6">This Service Agreement (the <strong>“Agreement”</strong>) is entered into as of <strong>{effectiveDate || "[EFFECTIVE DATE]"}</strong> between:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li><strong>ICDC Ventures LLC</strong>, doing business as <strong>Booked Out</strong>, with a mailing address at <strong>1309 Coffeen Avenue, Suite 1200, Sheridan, Wyoming 82801</strong> (“Company”); and</li>
              <li><strong>{legalName || "[CLIENT LEGAL NAME]"}</strong>, located at <strong>{address || "[CLIENT ADDRESS]"}</strong> (“Client”).</li>
            </ul>
            <p className="mt-3">The Company and Client are each a “Party” and together the “Parties.”</p>

            <Section title="1. Selected Service">
              <p className="font-semibold">Local Call System: 90-Day Booking Foundation, $499 per month</p>
              <p className="mt-2">For one business, one location, one domain, and one Google Business Profile:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">{scope.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-3"><strong>Founding-client setup fee:</strong> $0 for the first three accepted clients.</p>
              <p className="mt-2">Automated SMS, missed-call text-back, paid advertising, custom software, CRM replacement, multiple locations, unlimited content or revisions, and territory exclusivity are excluded unless added by a signed change order.</p>
            </Section>

            {agreementSections.map((section) => (
              <Section key={section.title} title={section.title}>
                {section.intro && <p className="mb-2">{section.intro}</p>}
                <ol className="list-decimal space-y-1 pl-6">{section.items.map((item) => <li key={item}>{item}</li>)}</ol>
                {section.outro && <p className="mt-3">{section.outro}</p>}
              </Section>
            ))}

            <Section title="Signatures">
              <div className="grid gap-8 sm:grid-cols-2 print:grid-cols-2">
                <SignatureBlock title="Booked Out" lines={["Name: Diego Campos", "Title: Founder", "Email: hello@trybookedout.com"]} />
                <SignatureBlock title="Client" lines={[`Legal name: ${legalName || "________________"}`, `Signer name: ${signerName || "________________"}`, `Title: ${signerTitle || "________________"}`, `Email: ${email || "________________"}`, `Phone: ${phone || "________________"}`]} />
              </div>
            </Section>
          </article>
          <p className="agreement-fields text-xs text-muted-foreground">Operational template, not legal advice. Texas counsel should review this template before the first client signs it.</p>
        </>
      )}
    </div>
  );
}

function Field({ label, value, setValue, type = "text" }: { label: string; value: string; setValue: (value: string) => void; type?: string }) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  return <div className="space-y-2"><Label htmlFor={inputId}>{label}</Label><Input id={inputId} type={type} value={value} onChange={(event) => setValue(event.target.value)} className="h-11 text-base" /></div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-7 break-inside-avoid"><h3 className="mb-2 text-lg font-bold">{title}</h3>{children}</section>;
}

function SignatureBlock({ title, lines }: { title: string; lines: string[] }) {
  return <div><h4 className="font-bold">{title}</h4><div className="mt-3 space-y-1">{lines.map((line) => <p key={line}>{line}</p>)}</div><p className="mt-6">Signature: __________________________</p><p className="mt-3">Date: __________________</p></div>;
}
