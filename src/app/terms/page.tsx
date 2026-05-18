import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Booked Out",
  description:
    "Basic terms for using the Booked Out website and requesting a free audit.",
  alternates: {
    canonical: "/terms",
  },
};

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
        <p className="mt-3 text-sm text-gray-500">Last updated May 18, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-950">Use of the site</h2>
            <p className="mt-3">
              This website provides information about Booked Out services and
              lets local service businesses request a free audit. You agree to
              provide accurate information when submitting a form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">
              Audit and service information
            </h2>
            <p className="mt-3">
              Audit results, examples, timelines, and recommendations are for
              business evaluation purposes. They are not guarantees of rankings,
              reviews, calls, revenue, or other outcomes. Specific services and
              pricing are governed by the agreement you sign with Booked Out.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">
              Third-party services
            </h2>
            <p className="mt-3">
              Booked Out may use third-party platforms for hosting, analytics,
              email, lead storage, audit research, review requests, and related
              workflows. Those providers may have their own terms and privacy
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-950">Contact</h2>
            <p className="mt-3">
              Questions about these terms can be sent to{" "}
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
