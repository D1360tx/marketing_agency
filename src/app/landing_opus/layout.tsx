import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://trybookedout.com/" },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
