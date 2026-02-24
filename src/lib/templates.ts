export interface TemplateData {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  services: string[];
  primaryColor: string;
  description: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export const templates: TemplateInfo[] = [
  {
    id: "restaurant",
    name: "Restaurant & Dining",
    category: "Food & Beverage",
    description: "Perfect for restaurants, cafes, and food businesses",
    icon: "UtensilsCrossed",
  },
  {
    id: "contractor",
    name: "Contractor & Home Services",
    category: "Home Services",
    description: "For plumbers, electricians, HVAC, and contractors",
    icon: "Wrench",
  },
  {
    id: "professional",
    name: "Professional Services",
    category: "Professional",
    description: "For lawyers, accountants, consultants, and clinics",
    icon: "Briefcase",
  },
  {
    id: "salon",
    name: "Salon & Spa",
    category: "Beauty & Wellness",
    description: "For hair salons, spas, nail studios, and barbers",
    icon: "Sparkles",
  },
  {
    id: "retail",
    name: "Retail & Local Shop",
    category: "Retail",
    description: "For shops, boutiques, and local retail stores",
    icon: "Store",
  },
];

export const defaultData: Record<string, TemplateData> = {
  restaurant: {
    businessName: "The Golden Fork",
    tagline: "Fresh flavors, warm hospitality",
    phone: "(512) 555-0101",
    email: "hello@goldenfork.com",
    address: "123 Main Street, Austin, TX 78701",
    services: ["Dine-In", "Takeout", "Catering", "Private Events"],
    primaryColor: "#b45309",
    description:
      "Experience unforgettable dining with locally sourced ingredients and handcrafted dishes that celebrate the best of our community.",
  },
  contractor: {
    businessName: "Pro Build Solutions",
    tagline: "Quality work you can trust",
    phone: "(512) 555-0202",
    email: "info@probuildsolutions.com",
    address: "456 Oak Avenue, Austin, TX 78702",
    services: ["Plumbing", "Electrical", "HVAC", "Remodeling"],
    primaryColor: "#1d4ed8",
    description:
      "Licensed and insured professionals with 20+ years of experience. We handle residential and commercial projects of any size.",
  },
  professional: {
    businessName: "Summit Advisory Group",
    tagline: "Expert guidance for your success",
    phone: "(512) 555-0303",
    email: "contact@summitadvisory.com",
    address: "789 Congress Ave, Suite 200, Austin, TX 78701",
    services: ["Consulting", "Tax Preparation", "Financial Planning", "Legal Services"],
    primaryColor: "#0f766e",
    description:
      "Trusted advisors helping businesses and individuals achieve their goals with personalized strategies and proven expertise.",
  },
  salon: {
    businessName: "Luxe Beauty Studio",
    tagline: "Where beauty meets artistry",
    phone: "(512) 555-0404",
    email: "book@luxebeauty.com",
    address: "321 Lamar Blvd, Austin, TX 78705",
    services: ["Haircuts & Styling", "Color & Highlights", "Facials", "Nail Services"],
    primaryColor: "#be185d",
    description:
      "A modern salon experience dedicated to making you look and feel your absolute best. Walk-ins welcome.",
  },
  retail: {
    businessName: "Urban Finds",
    tagline: "Unique treasures, local charm",
    phone: "(512) 555-0505",
    email: "shop@urbanfinds.com",
    address: "654 South 1st Street, Austin, TX 78704",
    services: ["In-Store Shopping", "Online Orders", "Gift Wrapping", "Personal Shopping"],
    primaryColor: "#7c3aed",
    description:
      "Discover a curated collection of unique goods from local artisans and independent makers. Something special for everyone.",
  },
};
