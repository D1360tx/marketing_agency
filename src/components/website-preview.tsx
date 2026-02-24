"use client";

import type { TemplateData } from "@/lib/templates";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  ChevronRight,
} from "lucide-react";

interface WebsitePreviewProps {
  templateId: string;
  data: TemplateData;
}

export function WebsitePreview({ templateId, data }: WebsitePreviewProps) {
  switch (templateId) {
    case "restaurant":
      return <RestaurantTemplate data={data} />;
    case "contractor":
      return <ContractorTemplate data={data} />;
    case "professional":
      return <ProfessionalTemplate data={data} />;
    case "salon":
      return <SalonTemplate data={data} />;
    case "retail":
      return <RetailTemplate data={data} />;
    default:
      return <ContractorTemplate data={data} />;
  }
}

function RestaurantTemplate({ data }: { data: TemplateData }) {
  return (
    <div className="font-sans text-gray-900" style={{ fontSize: "11px" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: data.primaryColor }}>
        <span className="text-sm font-bold text-white">{data.businessName}</span>
        <div className="flex gap-4 text-white/90">
          <span>Menu</span><span>About</span><span>Contact</span>
        </div>
      </nav>
      {/* Hero */}
      <div className="relative px-6 py-12 text-center text-white" style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.primaryColor}dd)` }}>
        <h1 className="text-2xl font-bold">{data.businessName}</h1>
        <p className="mt-1 text-white/80">{data.tagline}</p>
        <p className="mx-auto mt-3 max-w-md text-white/70">{data.description}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="rounded-full bg-white px-4 py-1.5 text-xs font-medium" style={{ color: data.primaryColor }}>View Menu</button>
          <button className="rounded-full border border-white/40 px-4 py-1.5 text-xs font-medium text-white">Reserve a Table</button>
        </div>
      </div>
      {/* Services */}
      <div className="px-6 py-6">
        <h2 className="mb-3 text-center text-sm font-bold">What We Offer</h2>
        <div className="grid grid-cols-2 gap-2">
          {data.services.map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-lg border p-2">
              <Star className="h-3 w-3" style={{ color: data.primaryColor }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <TemplateFooter data={data} />
    </div>
  );
}

function ContractorTemplate({ data }: { data: TemplateData }) {
  return (
    <div className="font-sans text-gray-900" style={{ fontSize: "11px" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2 text-white" style={{ backgroundColor: data.primaryColor }}>
        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{data.phone}</span>
        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{data.email}</span>
      </div>
      {/* Nav */}
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-bold">{data.businessName}</span>
        <div className="flex gap-4 text-gray-600">
          <span>Services</span><span>About</span><span>Contact</span>
        </div>
      </nav>
      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(135deg, ${data.primaryColor}11, ${data.primaryColor}22)` }}>
        <h1 className="text-2xl font-bold">{data.businessName}</h1>
        <p className="mt-1 font-medium" style={{ color: data.primaryColor }}>{data.tagline}</p>
        <p className="mt-2 max-w-md text-gray-600">{data.description}</p>
        <div className="mt-4 flex gap-2">
          <button className="rounded px-4 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: data.primaryColor }}>Get Free Quote</button>
          <button className="rounded border px-4 py-1.5 text-xs font-medium" style={{ borderColor: data.primaryColor, color: data.primaryColor }}>Call Now</button>
        </div>
      </div>
      {/* Services grid */}
      <div className="px-6 py-6">
        <h2 className="mb-3 text-sm font-bold">Our Services</h2>
        <div className="grid grid-cols-2 gap-2">
          {data.services.map((s) => (
            <div key={s} className="flex items-center gap-2 rounded border-l-2 bg-gray-50 p-3" style={{ borderColor: data.primaryColor }}>
              <ChevronRight className="h-3 w-3" style={{ color: data.primaryColor }} />
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Trust */}
      <div className="mx-6 rounded-lg p-4 text-center text-white" style={{ backgroundColor: data.primaryColor }}>
        <p className="text-sm font-bold">Licensed & Insured</p>
        <p className="text-white/80">Free estimates on all projects</p>
      </div>
      <TemplateFooter data={data} />
    </div>
  );
}

function ProfessionalTemplate({ data }: { data: TemplateData }) {
  return (
    <div className="font-sans text-gray-900" style={{ fontSize: "11px" }}>
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-bold" style={{ color: data.primaryColor }}>{data.businessName}</span>
        <div className="flex gap-4 text-gray-600">
          <span>Services</span><span>Team</span><span>Contact</span>
        </div>
      </nav>
      {/* Hero */}
      <div className="px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">{data.businessName}</h1>
        <p className="mt-1 text-gray-500">{data.tagline}</p>
        <p className="mx-auto mt-3 max-w-md text-gray-600">{data.description}</p>
        <button className="mt-4 rounded px-5 py-2 text-xs font-medium text-white" style={{ backgroundColor: data.primaryColor }}>Schedule Consultation</button>
      </div>
      {/* Services */}
      <div className="border-t px-6 py-6" style={{ backgroundColor: `${data.primaryColor}08` }}>
        <h2 className="mb-4 text-center text-sm font-bold">Our Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {data.services.map((s) => (
            <div key={s} className="rounded-lg border bg-white p-3 text-center shadow-sm">
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <TemplateFooter data={data} />
    </div>
  );
}

function SalonTemplate({ data }: { data: TemplateData }) {
  return (
    <div className="font-sans text-gray-900" style={{ fontSize: "11px" }}>
      <nav className="flex items-center justify-between px-6 py-3">
        <span className="text-sm font-bold tracking-wide" style={{ color: data.primaryColor }}>{data.businessName}</span>
        <button className="rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: data.primaryColor }}>Book Now</button>
      </nav>
      {/* Hero */}
      <div className="px-6 py-12 text-center" style={{ background: `linear-gradient(to bottom, ${data.primaryColor}15, white)` }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: data.primaryColor }}>Welcome to</p>
        <h1 className="mt-1 text-2xl font-bold">{data.businessName}</h1>
        <p className="mt-1 text-gray-500 italic">{data.tagline}</p>
        <p className="mx-auto mt-3 max-w-md text-gray-600">{data.description}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="rounded-full px-5 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: data.primaryColor }}>Book Appointment</button>
          <button className="rounded-full border px-5 py-1.5 text-xs font-medium" style={{ borderColor: data.primaryColor, color: data.primaryColor }}>View Services</button>
        </div>
      </div>
      {/* Services */}
      <div className="px-6 py-6">
        <h2 className="mb-4 text-center text-sm font-bold">Our Services</h2>
        <div className="space-y-2">
          {data.services.map((s) => (
            <div key={s} className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">{s}</span>
              <span className="text-xs" style={{ color: data.primaryColor }}>Learn more &rarr;</span>
            </div>
          ))}
        </div>
      </div>
      <TemplateFooter data={data} />
    </div>
  );
}

function RetailTemplate({ data }: { data: TemplateData }) {
  return (
    <div className="font-sans text-gray-900" style={{ fontSize: "11px" }}>
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-bold">{data.businessName}</span>
        <div className="flex gap-4 text-gray-600">
          <span>Shop</span><span>About</span><span>Visit</span>
        </div>
      </nav>
      {/* Hero */}
      <div className="px-6 py-12 text-center text-white" style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.primaryColor}cc)` }}>
        <h1 className="text-2xl font-bold">{data.businessName}</h1>
        <p className="mt-1 text-white/80">{data.tagline}</p>
        <p className="mx-auto mt-3 max-w-md text-white/70">{data.description}</p>
        <button className="mt-4 rounded-full bg-white px-5 py-1.5 text-xs font-medium" style={{ color: data.primaryColor }}>Shop Now</button>
      </div>
      {/* Services */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-2">
          {data.services.map((s) => (
            <div key={s} className="rounded-lg border p-3 text-center">
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Hours banner */}
      <div className="mx-6 flex items-center justify-center gap-2 rounded-lg border p-3">
        <Clock className="h-3.5 w-3.5" style={{ color: data.primaryColor }} />
        <span className="font-medium">Open 7 Days a Week</span>
      </div>
      <TemplateFooter data={data} />
    </div>
  );
}

function TemplateFooter({ data }: { data: TemplateData }) {
  return (
    <footer className="mt-6 border-t bg-gray-50 px-6 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-bold">{data.businessName}</p>
          <div className="mt-1 space-y-1 text-gray-500">
            <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{data.phone}</p>
            <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{data.email}</p>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-1 text-gray-500"><MapPin className="h-3 w-3" />{data.address}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-gray-400">&copy; {new Date().getFullYear()} {data.businessName}. All rights reserved.</p>
    </footer>
  );
}
