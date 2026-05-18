import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Booked Out",
  description:
    "How Booked Out collects and uses information submitted through the free audit form.",
  alternates: {
    canonical: "/privacy",
  },
};

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
        <p className="mt-3 text-sm text-gray-500">Last updated May 18, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-950">
              Information we collect
            </h2>
            <p className="mt-3">
              When you request an audit, we collect the business and contact
              details you submit, including your name, email address, phone
              number, business name, website, Google profile, service area, and
              business type.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">
              How we use information
            </h2>
            <p className="mt-3">
              We use submitted information to review your online presence,
              prepare audit notes, contact you about your request, and improve
              Booked Out services. We may use third-party tools for lead
              storage, email notifications, analytics, and audit research.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">
              Sharing and retention
            </h2>
            <p className="mt-3">
              We do not sell your personal information. We share information
              only with service providers needed to operate the site, respond to
              your audit request, or comply with legal obligations. We retain
              information as long as reasonably needed for those purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Your choices</h2>
            <p className="mt-3">
              You can ask us to update or delete your information, or stop
              follow-up communications, by contacting us at{" "}
              <a
                href="mailto:diego@trybookedout.com"
                className="font-semibold text-orange-600"
              >
                diego@trybookedout.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
