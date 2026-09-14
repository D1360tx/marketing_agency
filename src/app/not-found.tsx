import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16 text-gray-900">
      <div className="w-full max-w-xl">
        <Link href="/" className="inline-flex min-h-11 items-center text-xl font-bold">Booked Out</Link>
        <p className="mt-12 text-sm font-semibold uppercase tracking-widest text-orange-700">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Let’s get you back on track.</h1>
        <p className="mt-5 text-lg text-gray-600">This page may have moved, or the link may be incorrect. Explore our services or request a free audit from the homepage.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white">Back to home</Link>
          <a href="tel:+17372605332" className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-5 py-3 font-semibold">Call (737) 260-5332</a>
        </div>
        <nav aria-label="Legal" className="mt-12 flex gap-6 text-sm text-gray-600">
          <Link href="/privacy" className="inline-flex min-h-11 items-center underline">Privacy</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center underline">Terms</Link>
        </nav>
      </div>
    </main>
  );
}
