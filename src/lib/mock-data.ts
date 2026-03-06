import type { Prospect, WebsiteAnalysis, WebsiteGrade } from "@/types";

function randomId() {
  return crypto.randomUUID();
}

const userId = "00000000-0000-0000-0000-000000000000"; // placeholder

function gradeFromScore(avg: number): WebsiteGrade {
  if (avg >= 90) return "A";
  if (avg >= 70) return "B";
  if (avg >= 50) return "C";
  if (avg >= 30) return "D";
  return "F";
}

export const mockProspects: Prospect[] = [
  {
    id: randomId(),
    user_id: userId,
    business_name: "Joe's Plumbing & Repair",
    address: "1234 Oak Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
    phone: "(512) 555-0101",
    email: "joe@joesplumbing.com",
    website_url: "http://joesplumbing-austin.com",
    google_maps_url: "https://maps.google.com/?cid=12345",
    rating: 4.2,
    review_count: 87,
    business_type: "Plumber",
    search_query: "plumber in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Sunrise Dental Clinic",
    address: "567 Elm Avenue",
    city: "Austin",
    state: "TX",
    zip: "78702",
    phone: "(512) 555-0202",
    email: null,
    website_url: "https://sunrisedental.com",
    google_maps_url: "https://maps.google.com/?cid=23456",
    rating: 4.8,
    review_count: 234,
    business_type: "Dentist",
    search_query: "dentist in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Maria's Mexican Restaurant",
    address: "890 Main St",
    city: "Austin",
    state: "TX",
    zip: "78703",
    phone: "(512) 555-0303",
    email: "maria@mariasmexican.com",
    website_url: null,
    google_maps_url: "https://maps.google.com/?cid=34567",
    rating: 4.5,
    review_count: 412,
    business_type: "Restaurant",
    search_query: "restaurant in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Quick Fix Auto Shop",
    address: "2345 Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78704",
    phone: "(512) 555-0404",
    email: null,
    website_url: "http://quickfixauto.weebly.com",
    google_maps_url: "https://maps.google.com/?cid=45678",
    rating: 3.2,
    review_count: 28,
    business_type: "Auto Repair",
    search_query: "auto repair in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Elegant Nails & Spa",
    address: "678 Lamar Blvd",
    city: "Austin",
    state: "TX",
    zip: "78705",
    phone: "(512) 555-0505",
    email: "info@elegantnails.com",
    website_url: "http://elegantnails-austin.com",
    google_maps_url: "https://maps.google.com/?cid=56789",
    rating: 4.0,
    review_count: 156,
    business_type: "Nail Salon",
    search_query: "nail salon in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Tom's Lawn Care",
    address: "910 Barton Springs Rd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    phone: "(512) 555-0606",
    email: null,
    website_url: null,
    google_maps_url: "https://maps.google.com/?cid=67890",
    rating: 4.7,
    review_count: 63,
    business_type: "Landscaping",
    search_query: "landscaping in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Downtown Chiropractic",
    address: "1100 5th Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
    phone: "(512) 555-0707",
    email: "office@downtownchiro.com",
    website_url: "https://downtownchiropractic-atx.com",
    google_maps_url: "https://maps.google.com/?cid=78901",
    rating: 3.8,
    review_count: 42,
    business_type: "Chiropractor",
    search_query: "chiropractor in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
  {
    id: randomId(),
    user_id: userId,
    business_name: "Pet Paradise Grooming",
    address: "456 S 1st Street",
    city: "Austin",
    state: "TX",
    zip: "78704",
    phone: "(512) 555-0808",
    email: "hello@petparadise.com",
    website_url: "http://petparadisegrooming.wixsite.com/austin",
    google_maps_url: "https://maps.google.com/?cid=89012",
    rating: 4.6,
    review_count: 198,
    business_type: "Pet Grooming",
    search_query: "pet grooming in Austin TX",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    follow_up_date: null,
    source: null,
    last_contacted_at: null,
    tags: [],
  },
];

export function getMockAnalysis(prospectId: string, websiteUrl: string | null): WebsiteAnalysis | null {
  if (!websiteUrl) return null;

  // Simulate different quality levels based on URL patterns
  let performance: number;
  let accessibility: number;
  let bestPractices: number;
  let seo: number;
  let hasSsl: boolean;
  let isMobileFriendly: boolean;
  let loadTime: number;

  if (websiteUrl.includes("weebly") || websiteUrl.includes("wixsite")) {
    // Free builder sites - mediocre
    performance = 35 + Math.floor(Math.random() * 20);
    accessibility = 40 + Math.floor(Math.random() * 20);
    bestPractices = 45 + Math.floor(Math.random() * 15);
    seo = 30 + Math.floor(Math.random() * 25);
    hasSsl = websiteUrl.startsWith("https");
    isMobileFriendly = Math.random() > 0.5;
    loadTime = 3000 + Math.floor(Math.random() * 4000);
  } else if (websiteUrl.startsWith("http://")) {
    // No SSL - poor
    performance = 20 + Math.floor(Math.random() * 30);
    accessibility = 30 + Math.floor(Math.random() * 25);
    bestPractices = 25 + Math.floor(Math.random() * 20);
    seo = 25 + Math.floor(Math.random() * 20);
    hasSsl = false;
    isMobileFriendly = Math.random() > 0.6;
    loadTime = 4000 + Math.floor(Math.random() * 5000);
  } else {
    // HTTPS - decent to good
    performance = 55 + Math.floor(Math.random() * 40);
    accessibility = 60 + Math.floor(Math.random() * 35);
    bestPractices = 65 + Math.floor(Math.random() * 30);
    seo = 55 + Math.floor(Math.random() * 40);
    hasSsl = true;
    isMobileFriendly = Math.random() > 0.3;
    loadTime = 1000 + Math.floor(Math.random() * 3000);
  }

  const avg = Math.round((performance + accessibility + bestPractices + seo) / 4);

  return {
    id: randomId(),
    prospect_id: prospectId,
    performance_score: performance,
    accessibility_score: accessibility,
    best_practices_score: bestPractices,
    seo_score: seo,
    has_ssl: hasSsl,
    is_mobile_friendly: isMobileFriendly,
    load_time_ms: loadTime,
    has_viewport_meta: isMobileFriendly,
    technology_stack: null,
    overall_grade: gradeFromScore(avg),
    raw_data: null,
    analyzed_at: new Date().toISOString(),
  };
}

export function searchMockProspects(query: string, location: string): Prospect[] {
  // Simulate filtering - in reality this returns from Outscraper API
  return mockProspects.map((p) => ({
    ...p,
    id: randomId(),
    search_query: `${query} in ${location}`,
    city: location.split(",")[0]?.trim() || p.city,
    state: location.split(",")[1]?.trim() || p.state,
  }));
}
