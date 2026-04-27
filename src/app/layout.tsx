import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trybookedout.com"),
  title: "Booked Out — Get More Customers With a Website That Works",
  description:
    "Fast local websites and compliant review automation for service businesses that want more calls from Google. Free audit, no setup fee, no contracts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Booked Out — Websites + Review Automation for Local Service Businesses",
    description:
      "See what is holding your business back online with a free audit of your website, reviews, Google profile, and competitors.",
    url: "https://trybookedout.com/",
    siteName: "Booked Out",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booked Out — Get More Calls From Google",
    description:
      "Fast local websites, compliant review requests, and clear reporting for service businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
