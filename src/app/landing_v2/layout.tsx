import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { MarketingTags } from "@/components/marketing-tags";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Booked Out | Be the easiest business to find, trust and book",
  description:
    "Websites, reviews, instant follow-up and Meta and Google ads tracked from first click to paid invoice, for local businesses. Start with a free audit.",
  alternates: { canonical: "https://trybookedout.com/" },
};

export default function LandingV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={hanken.variable}>
      <MarketingTags />
      {children}
    </div>
  );
}
