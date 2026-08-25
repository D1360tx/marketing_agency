import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const contactEmail = "hello@trybookedout.com";
const mailingAddress =
  "1309 Coffeen Avenue, Suite 1200, Sheridan, Wyoming 82801";

export const metadata: Metadata = {
  title: "Privacy Policy - Booked Out",
  description:
    "How Booked Out collects, uses, protects, and shares information submitted through trybookedout.com.",
  alternates: {
    canonical: "/privacy",
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-orange-600">
          Booked Out
        </Link>
        <h1 className="mt-8 text-4xl font-black tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated August 25, 2026</p>

        <div className="mt-10 space-y-9 text-base leading-7 text-gray-700 [text-wrap:pretty]">
          <Section title="Overview">
            <p>
              Booked Out is a brand operated by ICDC Ventures LLC. This Privacy
              Policy explains how we collect, use, and protect information when
              you visit trybookedout.com, request a free audit, call us, or
              otherwise communicate with us.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>
              We collect information you choose to provide, including your name,
              email address, phone number, business name, website, Google
              Business Profile link, trade or business type, city, service area,
              and any other details you send through a form, call, or email.
            </p>
            <p>
              We may also collect basic technical information automatically, such
              as browser type, device type, pages visited, approximate location,
              referral source, and interaction data. This helps us understand
              how visitors use the site and improve the experience.
            </p>
          </Section>

          <Section title="How we use information">
            <p>We use collected information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Prepare and deliver audit findings.</li>
              <li>Respond to your form submission, call, or email.</li>
              <li>Evaluate your website, reviews, Google profile, and market.</li>
              <li>Operate, secure, and improve Booked Out services.</li>
              <li>Send service-related messages and follow-up communications.</li>
              <li>Measure site performance, lead quality, and campaign results.</li>
              <li>Comply with legal, security, and operational obligations.</li>
            </ul>
          </Section>

          <Section title="Calls and email">
            <p>
              If you provide your phone number or email address, we may contact
              you about your audit request, service options, scheduling, and
              related follow-up. You can ask us to stop marketing follow-up at
              any time.
            </p>
          </Section>

          <Section title="Cookies and analytics">
            <p>
              We may use cookies, pixels, analytics tools, and similar
              technologies to understand site traffic, improve pages, measure
              campaigns, and protect the site from misuse. You can control
              cookies through your browser settings, though some features may not
              work as intended if cookies are disabled.
            </p>
          </Section>

          <Section title="Service providers">
            <p>
              We use third-party service providers to run our business, such as
              hosting, database, email, analytics, lead management, audit
              research, and automation providers. These providers may process
              information on our behalf only as needed to provide their services
              to us.
            </p>
          </Section>

          <Section title="Sharing information">
            <p>
              We do not sell personal information. We may share information with
              service providers, professional advisors, legal authorities when
              required, or another organization if Booked Out is involved in a
              merger, acquisition, financing, or sale of assets.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep information for as long as reasonably needed to respond to
              requests, provide services, maintain business records, improve our
              systems, resolve disputes, and meet legal obligations. Retention
              periods may vary based on the type of information and how it is
              used.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We use reasonable administrative, technical, and organizational
              safeguards designed to protect information. No method of
              transmission or storage is completely secure, so we cannot
              guarantee absolute security.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You may ask us to update, delete, or provide information
              associated with you, subject to legal and operational limits. You
              may also ask us to stop marketing follow-up.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Booked Out is intended for business users and is not directed to
              children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The updated
              version will be posted on this page with a revised update date.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions or requests about this Privacy Policy can be sent to{" "}
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
