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
  title: "Booked Out - Websites, Reviews, and Fast Lead Follow-Up",
  description:
    "Fast local websites, compliant review requests, and speed-to-lead follow-up for service businesses that want more calls from Google.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Booked Out - Get Found, Trusted, and Answered",
    description:
      "See what is holding your business back online with a free audit of your website, reviews, Google profile, competitors, and follow-up speed.",
    url: "https://trybookedout.com/",
    siteName: "Booked Out",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Booked Out local growth audit preview",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booked Out - Get More Calls From Google",
    description:
      "Website, reviews, and speed-to-lead follow-up for serious local service businesses.",
    images: ["/twitter-image.png"],
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
