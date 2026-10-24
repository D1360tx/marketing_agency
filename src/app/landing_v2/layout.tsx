import type { Metadata } from "next";
import { MarketingTags } from "@/components/marketing-tags";
import { hanken } from "./fonts";

export const metadata: Metadata = {
  title: "Booked Out | Be the easiest business to find, trust and book",
  description:
    "Websites, reviews, instant follow-up and Meta and Google ads tracked from first click to paid invoice, for local businesses. Start with a free audit.",
  alternates: {
    canonical: "https://trybookedout.com/",
    languages: { en: "https://trybookedout.com/", es: "https://trybookedout.com/es", "x-default": "https://trybookedout.com/" },
  },
};

export default function LandingV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={hanken.variable}>
      <MarketingTags />
      {children}
    </div>
  );
}
