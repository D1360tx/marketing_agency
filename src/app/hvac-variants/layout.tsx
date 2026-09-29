import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HVAC landing-page lab | Booked Out",
  description: "Two HVAC-specific approaches to the Booked Out Revenue Leak Snapshot.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: {
    title: "Booked Out HVAC landing-page concepts",
    description: "Private review concepts for the Booked Out Revenue Leak Snapshot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booked Out HVAC landing-page concepts",
    description: "Private review concepts for the Booked Out Revenue Leak Snapshot.",
  },
};

export default function HVACLayout({ children }: { children: React.ReactNode }) {
  return children;
}
