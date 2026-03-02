import Link from "next/link";

export const metadata = {
  title: "Modern Websites for Local Businesses | AgencyFlow",
  description:
    "Your website is losing you customers. We build fast, modern, mobile-friendly websites that turn visitors into calls. Free website audit included.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                AgencyFlow
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-gray-600 hover:text-gray-900">
                Services
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                How It Works
              </a>
              <a href="#results" className="text-sm text-gray-600 hover:text-gray-900">
                Results
              </a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <a
                href="#contact"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Free Audit
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Free Website Audit — Limited Spots
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your website is{" "}
              <span className="text-red-500">losing you</span>{" "}
              customers
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
              Most local business websites are slow, outdated, and impossible to
              use on a phone. We build modern, lightning-fast websites that turn
              visitors into paying customers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#contact"
                className="bg-blue-600 text-white text-center font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/20 text-lg"
              >
                Get Your Free Website Audit →
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-gray-200 text-gray-700 text-center font-semibold px-8 py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors text-lg"
              >
                See How It Works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Results in 48 hours
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Pain Points */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Is your website costing you money?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              88% of customers won&apos;t return to a website after a bad experience.
              Here&apos;s what a bad website looks like:
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🐌",
                title: "Slow loading",
                description:
                  "Takes more than 3 seconds to load? 53% of visitors will leave before it even finishes.",
                stat: "53%",
                statLabel: "bounce rate",
              },
              {
                emoji: "📱",
                title: "Not mobile-friendly",
                description:
                  "Over 60% of searches are on phones. If your site doesn't work on mobile, you're invisible.",
                stat: "60%",
                statLabel: "mobile searches",
              },
              {
                emoji: "😬",
                title: "Looks outdated",
                description:
                  "First impressions take 0.05 seconds. An old-looking website tells customers you don't care.",
                stat: "0.05s",
                statLabel: "to judge",
              },
            ].map((pain) => (
              <div
                key={pain.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{pain.emoji}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {pain.title}
                </h3>
                <p className="text-gray-600 mb-4">{pain.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-500">
                    {pain.stat}
                  </span>
                  <span className="text-sm text-gray-500">
                    {pain.statLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything your business needs online
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We handle everything — from design to deployment. You focus on
              running your business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎨",
                title: "Custom Website Design",
                description:
                  "Modern, professional design tailored to your industry. Built to impress from the first click.",
              },
              {
                icon: "📱",
                title: "Mobile Optimized",
                description:
                  "Looks perfect on every device — phones, tablets, and desktops. No pinching or zooming required.",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                description:
                  "Pages load in under 2 seconds. Fast sites rank higher on Google and keep visitors engaged.",
              },
              {
                icon: "🔍",
                title: "SEO Built-In",
                description:
                  "Optimized for Google from day one. Show up when customers search for your services.",
              },
              {
                icon: "📞",
                title: "Click-to-Call & Contact Forms",
                description:
                  "Make it dead simple for customers to reach you. One tap to call, one form to fill.",
              },
              {
                icon: "📊",
                title: "Google Reviews Integration",
                description:
                  "Showcase your best reviews right on your website. Social proof that converts visitors.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              New website in 3 simple steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No lengthy meetings, no complicated processes. We move fast.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Free Website Audit",
                description:
                  "We analyze your current website and show you exactly what's hurting your business. Scores, speed, mobile issues — everything.",
                color: "bg-blue-600",
              },
              {
                step: "02",
                title: "See Your New Design",
                description:
                  "Within 48 hours, we build a custom preview of your new website. No commitment — just see what's possible.",
                color: "bg-indigo-600",
              },
              {
                step: "03",
                title: "Go Live & Grow",
                description:
                  "Love it? We deploy your new site and handle everything — hosting, updates, support. You start getting more customers.",
                color: "bg-violet-600",
              },
            ].map((step) => (
              <div key={step.step} className="relative">
                <div
                  className={`${step.color} text-white text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center mb-6`}
                >
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results / Social Proof */}
      <section id="results" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Real results for real businesses
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { value: "2x", label: "More phone calls" },
              { value: "<2s", label: "Page load time" },
              { value: "95+", label: "Google PageSpeed score" },
              { value: "48hr", label: "Turnaround time" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-blue-600">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial placeholders */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote:
                  "Our old website was embarrassing. Within a week we had a modern site that actually gets us calls. Best investment we've made.",
                name: "Local Plumbing Company",
                role: "Austin, TX",
              },
              {
                quote:
                  "I didn't realize how much business our website was costing us until I saw the audit. The new site pays for itself every month.",
                name: "HVAC Service Provider",
                role: "Dallas, TX",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to stop losing customers?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Get a free audit of your current website. We&apos;ll show you exactly
            what&apos;s wrong and how to fix it. No strings attached.
          </p>
          <div className="mt-10 max-w-md mx-auto">
            <form
              action="https://formspree.io/f/placeholder"
              method="POST"
              className="space-y-4"
            >
              <input
                type="text"
                name="business_name"
                placeholder="Business Name"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                type="text"
                name="website"
                placeholder="Current Website URL (if you have one)"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="w-full bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg"
              >
                Get My Free Website Audit →
              </button>
            </form>
            <p className="mt-4 text-sm text-blue-200">
              We&apos;ll review your site and get back to you within 24 hours.
              100% free, no obligation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">AgencyFlow</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                Process
              </a>
              <a href="#results" className="hover:text-white transition-colors">
                Results
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} AgencyFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
