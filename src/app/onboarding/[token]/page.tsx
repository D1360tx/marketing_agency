"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const SERVICE_OPTIONS = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Pest Control",
  "Cleaning",
  "Other",
];

type Prefill = {
  business_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  existing_website?: string | null;
  primary_contact_email?: string | null;
};

type FormData = {
  business_name: string;
  owner_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  service_areas: string;
  services_offered: string[];
  has_google_my_business: boolean;
  google_my_business_url: string;
  existing_website: string;
  brand_colors: string;
  style_notes: string;
  logo_url: string;
  photo_urls: string[];
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  preferred_contact_method: string;
  review_process_notes: string;
  additional_notes: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
    />
  );
}

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "invalid" | "submitted" | "form">("loading");
  const [form, setForm] = useState<FormData>({
    business_name: "",
    owner_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    service_areas: "",
    services_offered: [],
    has_google_my_business: false,
    google_my_business_url: "",
    existing_website: "",
    brand_colors: "",
    style_notes: "",
    logo_url: "",
    photo_urls: [],
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    preferred_contact_method: "Phone Call",
    review_process_notes: "",
    additional_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [photosUploading, setPhotosUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    fetch(`/api/onboarding/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          setStatus("invalid");
        } else if (data.submitted) {
          setStatus("submitted");
        } else {
          // Pre-fill from linked prospect
          const p: Prefill = data.prefill || {};
          setForm((f) => ({
            ...f,
            business_name: p.business_name || "",
            owner_name: p.owner_name || "",
            phone: p.phone || "",
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            zip: p.zip || "",
            existing_website: p.existing_website || "",
            primary_contact_email: p.primary_contact_email || "",
          }));
          setStatus("form");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleService(service: string) {
    setForm((f) => ({
      ...f,
      services_offered: f.services_offered.includes(service)
        ? f.services_offered.filter((s) => s !== service)
        : [...f.services_offered, service],
    }));
  }

  async function uploadLogo(file: File) {
    if (!token) return;
    setLogoUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${token}/logo.${ext}`;
      const { error } = await supabase.storage
        .from("onboarding-assets")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(path);
      set("logo_url", urlData.publicUrl);
    } catch (err) {
      console.error("Logo upload failed:", err);
      alert("Logo upload failed. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function uploadPhotos(files: FileList) {
    if (!token) return;
    setPhotosUploading(true);
    const uploaded: string[] = [];
    try {
      const supabase = createClient();
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        const path = `${token}/photos/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("onboarding-assets")
          .upload(path, file, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage
            .from("onboarding-assets")
            .getPublicUrl(path);
          uploaded.push(urlData.publicUrl);
        }
      }
      set("photo_urls", [...form.photo_urls, ...uploaded]);
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert("Photo upload failed. Please try again.");
    } finally {
      setPhotosUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("submitted");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="text-sm">Loading your form...</span>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Link Not Found</h1>
          <p className="text-gray-500 text-sm">
            This onboarding link is invalid or has expired. Please contact your account manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Thanks! We&apos;ve got your info.</h1>
          <p className="text-gray-500 text-sm">
            Your onboarding intake has been submitted. Our team will review everything and be in touch shortly to get started on your project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tell us about your business so we can build the perfect website for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Section 1: Your Business */}
          <Section title="1. Your Business">
            <div>
              <Label required>Business Name</Label>
              <Input
                value={form.business_name}
                onChange={(v) => set("business_name", v)}
                placeholder="Austin HVAC Pros"
              />
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input
                value={form.owner_name}
                onChange={(v) => set("owner_name", v)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(v) => set("phone", v)}
                placeholder="(512) 555-0100"
                type="tel"
              />
            </div>
            <div>
              <Label>Street Address</Label>
              <Input
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(v) => set("city", v)}
                  placeholder="Austin"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(v) => set("state", v)}
                  placeholder="TX"
                />
              </div>
            </div>
            <div className="max-w-[140px]">
              <Label>ZIP Code</Label>
              <Input
                value={form.zip}
                onChange={(v) => set("zip", v)}
                placeholder="78701"
              />
            </div>
          </Section>

          {/* Section 2: Your Services */}
          <Section title="2. Your Services">
            <div>
              <Label>Service Areas</Label>
              <Input
                value={form.service_areas}
                onChange={(v) => set("service_areas", v)}
                placeholder="Austin, Round Rock, Cedar Park, Georgetown"
              />
              <p className="text-xs text-gray-400 mt-1">Cities or regions you serve</p>
            </div>
            <div>
              <Label>Services Offered</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SERVICE_OPTIONS.map((service) => (
                  <label
                    key={service}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.services_offered.includes(service)}
                      onChange={() => toggleService(service)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* Section 3: Online Presence */}
          <Section title="3. Online Presence">
            <div>
              <Label>Google Business Profile</Label>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => set("has_google_my_business", true)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.has_google_my_business
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Yes, I have one
                </button>
                <button
                  type="button"
                  onClick={() => set("has_google_my_business", false)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    !form.has_google_my_business
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  No, I don&apos;t
                </button>
              </div>
            </div>
            {form.has_google_my_business && (
              <div>
                <Label>Google Business Profile URL</Label>
                <Input
                  value={form.google_my_business_url}
                  onChange={(v) => set("google_my_business_url", v)}
                  placeholder="https://maps.google.com/..."
                  type="url"
                />
              </div>
            )}
            <div>
              <Label>Existing Website</Label>
              <Input
                value={form.existing_website}
                onChange={(v) => set("existing_website", v)}
                placeholder="https://yoursite.com"
                type="url"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if you don&apos;t have one</p>
            </div>
          </Section>

          {/* Section 4: Brand & Style */}
          <Section title="4. Brand &amp; Style">
            <div>
              <Label>Brand Colors</Label>
              <Input
                value={form.brand_colors}
                onChange={(v) => set("brand_colors", v)}
                placeholder="Blue and white, or #1E40AF and #FFFFFF"
              />
              <p className="text-xs text-gray-400 mt-1">Tell us your brand colors (names, hex codes, or describe them)</p>
            </div>
            <div>
              <Label>Style Notes</Label>
              <Textarea
                value={form.style_notes}
                onChange={(v) => set("style_notes", v)}
                placeholder="Modern and clean. I like the look of Apple's website. No bright colors — keep it professional."
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">Any websites you like, vibe you&apos;re going for, or things to avoid</p>
            </div>
            <div>
              <Label>Logo Upload</Label>
              <div
                className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onClick={() => logoRef.current?.click()}
              >
                {form.logo_url ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logo_url} alt="Logo" className="h-16 object-contain mx-auto" />
                    <p className="text-xs text-green-600 font-medium">Logo uploaded</p>
                  </div>
                ) : logoUploading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg className="mx-auto h-8 w-8 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload your logo</p>
                    <p className="text-xs text-gray-400">PNG, JPG, SVG up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
              />
            </div>
            <div>
              <Label>Photos of Your Work</Label>
              <div
                className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onClick={() => photosRef.current?.click()}
              >
                {photosUploading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                    <span className="text-sm">Uploading photos...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg className="mx-auto h-8 w-8 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Click to upload photos
                      {form.photo_urls.length > 0 && ` (${form.photo_urls.length} uploaded)`}
                    </p>
                    <p className="text-xs text-gray-400">Up to 10 photos, PNG or JPG</p>
                  </div>
                )}
              </div>
              {form.photo_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {form.photo_urls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-16 w-full object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
              <input
                ref={photosRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) uploadPhotos(files);
                }}
              />
            </div>
          </Section>

          {/* Section 5: Contact & Communication */}
          <Section title="5. Contact &amp; Communication">
            <div>
              <Label>Primary Contact Name</Label>
              <Input
                value={form.primary_contact_name}
                onChange={(v) => set("primary_contact_name", v)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                value={form.primary_contact_email}
                onChange={(v) => set("primary_contact_email", v)}
                placeholder="john@austinhvacpros.com"
                type="email"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={form.primary_contact_phone}
                onChange={(v) => set("primary_contact_phone", v)}
                placeholder="(512) 555-0100"
                type="tel"
              />
            </div>
            <div>
              <Label>Preferred Contact Method</Label>
              <div className="flex gap-3 mt-1">
                {["Phone Call", "Email", "Text"].map((method) => (
                  <label
                    key={method}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                      form.preferred_contact_method === method
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preferred_contact_method"
                      value={method}
                      checked={form.preferred_contact_method === method}
                      onChange={() => set("preferred_contact_method", method)}
                      className="sr-only"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* Section 6: Reviews */}
          <Section title="6. Reviews &amp; Final Notes">
            <div>
              <Label>How do you currently handle reviews?</Label>
              <Textarea
                value={form.review_process_notes}
                onChange={(v) => set("review_process_notes", v)}
                placeholder="We ask customers to leave a Google review after the job. We usually text them a link..."
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">Optional — just helps us understand your process</p>
            </div>
            <div>
              <Label>Anything else we should know?</Label>
              <Textarea
                value={form.additional_notes}
                onChange={(v) => set("additional_notes", v)}
                placeholder="We have a second location opening in March. We'd also like a careers page eventually..."
                rows={3}
              />
            </div>
          </Section>

          {/* Submit */}
          {submitError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || logoUploading || photosUploading}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting...
              </span>
            ) : (
              "Submit Onboarding Form"
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Your information is secure and will only be used to build your website.
          </p>
        </form>
      </div>
    </div>
  );
}
