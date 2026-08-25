import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const contactEmail = "hello@trybookedout.com";
const mailingAddress =
  "1309 Coffeen Avenue, Suite 1200, Sheridan, Wyoming 82801";

export const metadata: Metadata = {
  title: "Terms of Service - Booked Out",
  description:
    "Terms for using trybookedout.com, requesting an audit, and working with Booked Out.",
  alternates: {
    canonical: "/terms",
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-orange-600">
          Booked Out
        </Link>
        <h1 className="mt-8 text-4xl font-black tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated August 25, 2026</p>

        <div className="mt-10 space-y-9 text-base leading-7 text-gray-700 [text-wrap:pretty]">
          <Section title="Agreement to these terms">
            <p>
              Booked Out is a brand operated by ICDC Ventures LLC. These Terms
              of Service govern your use of trybookedout.com and your
              interactions with Booked Out through the website, forms, calls,
              emails, and related services. By using the site or submitting
              information, you agree to these terms.
            </p>
          </Section>

          <Section title="What Booked Out does">
            <p>
              Booked Out provides managed revenue-capture services for local
              businesses, including website strategy and buildout, neutral review
              requests by email, local-search foundation work, lead-routing and
              follow-up processes, reporting, and related consulting. Specific
              deliverables, pricing, billing, and cancellation terms are controlled
              by the written agreement or order form you accept with Booked Out.
            </p>
          </Section>

          <Section title="Audit requests">
            <p>
              Free audits are provided for business evaluation and sales
              discussion purposes. Audit findings may rely on public information,
              third-party tools, automated checks, and manual review. Audit
              timing, availability, and scope may vary.
            </p>
            <p>
              By submitting an audit request, you confirm that the information
              you provide is accurate and that you are authorized to request an
              audit for the business listed.
            </p>
          </Section>

          <Section title="No guaranteed outcomes">
            <p>
              Marketing performance depends on many factors outside our control,
              including competition, budget, market demand, customer service,
              pricing, seasonality, Google changes, and response speed. We do
              not guarantee rankings, reviews, calls, leads, booked jobs,
              revenue, or specific timelines unless expressly stated in a signed
              agreement.
            </p>
          </Section>

          <Section title="Your responsibilities">
            <p>When working with Booked Out, you agree to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide accurate business and contact information.</li>
              <li>Respond to reasonable requests needed to perform services.</li>
              <li>Maintain any required licenses, insurance, and permissions.</li>
              <li>Use review requests and communications lawfully.</li>
              <li>Not submit unlawful, misleading, infringing, or harmful content.</li>
            </ul>
          </Section>

          <Section title="Review requests and communications">
            <p>
              Review request workflows are intended to request honest customer
              feedback in a compliant way. You are responsible for ensuring your
              customer lists, consent practices, and business communications
              comply with applicable laws, platform rules, and industry
              requirements.
            </p>
          </Section>

          <Section title="Payments and cancellation">
            <p>
              Public pricing is informational and may change. If you purchase
              services, payment timing, included work, ownership, hosting,
              support, cancellation, and renewal terms will be described in the
              agreement you accept. Unless otherwise stated in writing, fees
              already paid are not refundable.
            </p>
          </Section>

          <Section title="Website ownership and content">
            <p>
              Any ownership, license, export, transfer, hosting, or cancellation
              terms for websites and related assets are governed by your written
              agreement with Booked Out. You represent that any materials you
              provide to us, such as logos, photos, copy, reviews, or business
              information, may be used for the services.
            </p>
          </Section>

          <Section title="Third-party platforms">
            <p>
              Services may depend on third-party platforms such as Google,
              hosting providers, email providers, analytics
              tools, CRM systems, review platforms, and payment processors. We
              are not responsible for outages, policy changes, account actions,
              or data issues caused by third-party platforms.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              You may not use the site or services to violate laws, interfere
              with security, scrape or misuse systems, send spam, impersonate
              others, infringe intellectual property, or submit malicious code or
              false information.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              The Booked Out name, website, designs, copy, systems, processes,
              and materials are owned by Booked Out or its licensors unless
              otherwise stated. You may not copy, resell, or reuse them outside
              the permitted use of the site or your written agreement.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the fullest extent allowed by law, Booked Out will not be
              liable for indirect, incidental, consequential, special, punitive,
              or lost-profit damages arising from your use of the site or
              services. Our total liability for any claim is limited to the
              amount you paid to Booked Out for the service giving rise to the
              claim during the three months before the claim arose.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these Terms from time to time. The updated version
              will be posted on this page with a revised update date. Your
              continued use of the site after changes are posted means you
              accept the updated terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these Terms can be sent to{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-semibold text-orange-600"
              >
                {contactEmail}
              </a>
              . Our mailing address is {mailingAddress}.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
