import { GoogleGenAI } from "@google/genai";
import type { TemplateData } from "@/lib/templates";

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC LANDING PAGE SYSTEM — Industry-Specific Style Configurations
// ─────────────────────────────────────────────────────────────────────────────

interface StyleConfig {
  identity: string;
  palette: {
    primary: string;
    accent: string;
    background: string;
    dark: string;
    names: string;
  };
  typography: {
    heading: string;
    drama: string;
    data: string;
  };
  imageMood: string;
  heroPattern: string;
  sections: string;
  cardPatterns: string;
  philosophyPattern: string;
  ctaLabels: string[];
}

const STYLE_CONFIGS: Record<string, StyleConfig> = {
  // ── RESTAURANT & DINING ──────────────────────────────────────────────────
  restaurant: {
    identity:
      "A Michelin-starred tasting room meets a warm neighborhood gathering place. The design should make visitors taste the food through the screen — rich, sensory, and intimate. Think James Beard Award winner's web presence.",
    palette: {
      primary: "Espresso",
      accent: "Saffron Gold",
      background: "Warm Cream",
      dark: "Deep Charcoal",
      names: "Espresso `{primaryColor}` (Primary), Saffron Gold `#D4A847` (Accent), Warm Cream `#FAF6F0` (Background), Deep Charcoal `#1C1917` (Dark)",
    },
    typography: {
      heading: '"Plus Jakarta Sans" (tight tracking, bold weight)',
      drama: '"Cormorant Garamond" Italic (for dramatic statements and dish names)',
      data: '"IBM Plex Mono" (for hours, prices, reservation details)',
    },
    imageMood: "dark wood table, warm candlelight, artisan plating, fresh herbs, rustic elegance",
    heroPattern:
      '"[Cuisine noun] is" (Bold Sans) / "an experience." (Massive Serif Italic). Example: "Dining is / an art form."',
    sections: `
### HERO — "The First Course"
- Full-height section (min-height: 700px with generous padding). Full-bleed CSS gradient mimicking a dark, warm ambiance (deep primary → black with a warm amber glow overlay).
- Content pushed to bottom-left. Typography follows the hero line pattern.
- A subtle animated CSS grain/noise overlay at 0.03 opacity for texture.
- CTA: "Reserve a Table" button in accent color.

### MENU HIGHLIGHTS — "The Tasting Flight"
- Three elegant cards, each representing a cuisine category or signature dish grouping.
- Cards have a dark background with warm accent borders. Use the rounded-[2rem] system.
- Each card has: category name (heading font), a brief evocative description (drama italic font), and a decorative CSS divider element.
- Subtle hover: cards lift with translateY(-4px) and gain a warm glow shadow.

### PHILOSOPHY — "The Chef's Manifesto"
- Full-width dark section.
- "Most restaurants serve meals." (smaller, neutral) → "We craft memories." (massive drama serif italic, accent-colored word).
- Background: subtle CSS repeating gradient creating a linen-like texture.

### EXPERIENCE — "The Journey"
- 3 stacking sections describing the dining experience: "Source" (ingredients story), "Craft" (preparation philosophy), "Savor" (the moment).
- Each section: step number in monospace, title in heading font, 2-line poetic description.
- Decorative: animated CSS border that draws itself on scroll (use CSS animations with IntersectionObserver).

### HOURS & LOCATION — "The Invitation"
- Split layout: left side has hours in monospace font with accent-colored day names, right side has the address with a subtle CSS-drawn map pin icon.
- A large "Make a Reservation" CTA spanning the full width below.

### FOOTER — "The Closing"
- Deep dark background with rounded-t-[4rem].
- Brand name in drama italic font, social links, operating hours summary, legal.
- A subtle pulsing dot with "Now Serving" label in monospace.`,
    cardPatterns: `
Card 1 — "Seasonal Rotator": 3 overlapping cards cycling every 3.5s representing seasonal menu items. Each card has a category label and brief description. Spring animation on swap.
Card 2 — "Kitchen Live Feed": Monospace typewriter effect cycling through messages like "Preparing tonight's tasting menu...", "Fresh catch arrived from the coast...", "Sommelier's pick: [wine name]". Pulsing accent dot with "Kitchen Status" label.
Card 3 — "Reservation Slots": A weekly mini-calendar showing available time slots. An animated cursor enters, selects a day, highlights a time slot in accent color, then clicks "Book". Smooth, elegant motion.`,
    philosophyPattern:
      '"Most restaurants focus on: feeding you." → "We focus on: nourishing your soul." — accent-color the word "soul".',
    ctaLabels: ["Reserve a Table", "View Our Menu", "Private Events"],
  },

  // ── CONTRACTOR & HOME SERVICES ───────────────────────────────────────────
  contractor: {
    identity:
      "A precision engineering firm meets a trusted neighborhood craftsman. The design radiates competence, reliability, and strength — like a well-built structure itself. Think the digital equivalent of a firm handshake and a perfectly level foundation.",
    palette: {
      primary: "Steel Blue",
      accent: "Safety Orange",
      background: "Blueprint White",
      dark: "Iron Black",
      names: "Steel Blue `{primaryColor}` (Primary), Safety Orange `#E8630A` (Accent), Blueprint White `#F8FAFB` (Background), Iron Black `#111318` (Dark)",
    },
    typography: {
      heading: '"Space Grotesk" (tight tracking, bold weight)',
      drama: '"DM Serif Display" Italic (for trust statements and guarantees)',
      data: '"Space Mono" (for estimates, measurements, license numbers)',
    },
    imageMood: "construction blueprints, precision tools, concrete textures, steel beams, craftsman hands",
    heroPattern:
      '"[Service noun] done" (Bold Sans) / "right." (Massive Serif Italic). Example: "Quality built / to last."',
    sections: `
### HERO — "The Foundation"
- Full-height section (min-height: 700px with generous padding). CSS gradient from deep primary to black, with a subtle blueprint grid pattern overlay (CSS repeating-linear-gradient creating thin lines at low opacity).
- Content pushed to bottom-left. Bold, commanding typography.
- Trust badges row below the headline: "Licensed", "Insured", "20+ Years" — each in a pill-shaped container with monospace text.
- CTA: "Get Free Estimate" button in accent color.

### SERVICES — "The Toolbox"
- Three service category cards with a strong left-border accent (4px solid accent color).
- Each card: service icon (CSS-drawn geometric shapes — wrench, shield, house outline using borders/transforms), service title, brief description, and a "Learn More →" link.
- Cards have a light background with subtle shadow, rounded-[2rem].
- Hover: left border expands, card lifts slightly.

### TRUST — "The Guarantee"
- Full-width primary-colored section.
- "Other contractors make promises." (smaller, neutral) → "We build guarantees." (massive drama serif italic, accent word highlighted).
- Below: three trust metric counters: "500+ Projects", "15 Years", "100% Licensed" — large monospace numbers with labels.

### PROCESS — "The Blueprint"
- 3 stacking scroll sections showing the project process: "Assess" (initial consultation), "Execute" (the build), "Deliver" (final walkthrough).
- Each section: large step number in monospace (01, 02, 03), title in heading font, description.
- Decorative: animated CSS progress line connecting steps (draws as you scroll).

### SERVICE AREA & CONTACT — "The Coverage"
- Split layout: left has service area description with city/region names in accent color, right has contact form placeholder (phone number prominent with tel: link, email with mailto: link).
- "Licensed & Insured" badge prominently displayed with license number in monospace.

### FOOTER — "The Cornerstone"
- Deep dark background, rounded-t-[4rem].
- Brand name bold and prominent, service categories, contact info, license info in monospace.
- "Available 24/7 for Emergencies" with pulsing green dot.`,
    cardPatterns: `
Card 1 — "Project Rotator": 3 overlapping cards cycling every 3s showing project categories (e.g., "Kitchen Remodel", "New Construction", "Emergency Repair"). Each with an icon-like CSS shape and brief scope description.
Card 2 — "Job Status Feed": Monospace typewriter cycling through status updates: "Permit approved for 142 Oak St...", "Inspection passed — all clear...", "Materials delivered to site...". Pulsing accent dot with "Active Projects" label.
Card 3 — "Availability Scheduler": Weekly grid showing available slots. Animated cursor selects a day, picks a time, clicks "Request Quote". Bold, efficient motion.`,
    philosophyPattern:
      '"Most contractors focus on: getting the job done." → "We focus on: getting it done right." — accent-color the word "right".',
    ctaLabels: ["Get Free Estimate", "Call Now", "Emergency Service"],
  },

  // ── PROFESSIONAL SERVICES ────────────────────────────────────────────────
  professional: {
    identity:
      "A private advisory firm in a glass tower — the kind of place where billion-dollar decisions are made over quiet conversation. The design exudes authority, discretion, and deep expertise. Think white-shoe law firm meets McKinsey.",
    palette: {
      primary: "Oxford Navy",
      accent: "Verdant Emerald",
      background: "Parchment",
      dark: "Ink Black",
      names: "Oxford Navy `{primaryColor}` (Primary), Verdant Emerald `#0D9668` (Accent), Parchment `#FAFAF7` (Background), Ink Black `#0C0C0E` (Dark)",
    },
    typography: {
      heading: '"Inter" (tight tracking, semi-bold to bold)',
      drama: '"Playfair Display" Italic (for authority statements and credentials)',
      data: '"JetBrains Mono" (for case numbers, credentials, statistics)',
    },
    imageMood: "marble interiors, leather-bound books, architectural minimalism, boardroom, fountain pen",
    heroPattern:
      '"[Expertise noun] demands" (Bold Sans) / "precision." (Massive Serif Italic). Example: "Excellence demands / precision."',
    sections: `
### HERO — "The Opening Statement"
- Full-height section (min-height: 700px with generous padding). Clean, sophisticated CSS gradient: very subtle shift from background color to a slightly warm white, with a faint geometric pattern overlay (thin intersecting lines at 0.02 opacity).
- Content centered or bottom-left. Commanding but restrained typography — authority through understatement.
- Below headline: credentials strip — "Est. [Year]", "500+ Clients", "[Certification]" in monospace pill badges.
- CTA: "Schedule Consultation" button in accent color, refined rounded corners.

### PRACTICE AREAS — "The Expertise"
- Three elegant cards representing core service areas.
- Minimal design: white/light background, thin border, generous padding. The heading does the heavy lifting.
- Each card: practice area title (heading font), 2-line description, subtle "→" link in accent color.
- No visual noise. The sophistication IS the simplicity.
- Hover: subtle border color shift to accent, gentle lift.

### PHILOSOPHY — "The Counsel"
- Full-width dark (Ink Black) section with generous vertical padding.
- "Most firms offer advice." (smaller, neutral, off-white) → "We architect outcomes." (massive drama serif italic, accent-colored word "outcomes").
- Feels like reading a law review's opening paragraph — deliberate, weighty.

### APPROACH — "The Methodology"
- 3 scrolling sections: "Listen" (understanding the situation), "Strategize" (building the plan), "Execute" (delivering results).
- Clean step indicators in monospace. Minimal decorative elements — just typography and space.
- A thin accent-colored line connects the steps vertically.

### CREDENTIALS & TESTIMONIAL — "The Record"
- Split layout: left has firm credentials, certifications, and affiliations listed in clean rows with monospace detail text. Right has a single powerful testimonial quote in drama italic font with attribution.
- Background: very subtle primary color tint.

### FOOTER — "The Closing Brief"
- Dark background, rounded-t-[4rem].
- Brand name in drama italic, practice areas as nav links, contact info (phone, email, address), professional disclaimers in small monospace text.
- "Accepting New Clients" indicator with accent dot.`,
    cardPatterns: `
Card 1 — "Case Rotator": 3 overlapping cards cycling every 4s showing practice areas with brief case-type descriptions. Refined, slow transitions.
Card 2 — "Advisory Feed": Monospace typewriter cycling through messages: "Reviewing compliance framework...", "Strategic assessment complete...", "Client meeting — Thursday 2PM". Pulsing accent dot with "Active Matters" label.
Card 3 — "Consultation Scheduler": Clean weekly grid. Animated cursor selects a day, picks a time, clicks "Book Consultation". Deliberate, unhurried motion.`,
    philosophyPattern:
      '"Most professionals focus on: the transaction." → "We focus on: the relationship." — accent-color the word "relationship".',
    ctaLabels: [
      "Schedule Consultation",
      "Review Our Expertise",
      "Contact the Firm",
    ],
  },

  // ── SALON & SPA ──────────────────────────────────────────────────────────
  salon: {
    identity:
      "A Parisian atelier meets a serene Japanese onsen. The design should feel like stepping into a space where beauty is treated as a serious art form — luxurious, calming, and meticulously curated. Think Aesop meets Glossier.",
    palette: {
      primary: "Blush Mauve",
      accent: "Rose Gold",
      background: "Soft Ivory",
      dark: "Charcoal Plum",
      names: "Blush Mauve `{primaryColor}` (Primary), Rose Gold `#B76E79` (Accent), Soft Ivory `#FBF9F6` (Background), Charcoal Plum `#1E1820` (Dark)",
    },
    typography: {
      heading: '"Sora" (light to medium weight, generous tracking)',
      drama: '"Instrument Serif" Italic (for beauty statements and service names)',
      data: '"Fira Code" (for pricing, appointment times, product codes)',
    },
    imageMood: "botanical ingredients, soft light through gauze, marble surfaces, minimalist beauty products, eucalyptus",
    heroPattern:
      '"[Beauty noun] is" (Light Sans) / "ritual." (Massive Serif Italic). Example: "Beauty is / ritual."',
    sections: `
### HERO — "The First Impression"
- Full-height section (min-height: 700px with generous padding). Ethereal CSS gradient: soft primary → ivory with a delicate organic gradient overlay (subtle radial gradients in muted tones creating a soft, diffused light effect).
- Content centered. Typography is airy and elegant — lots of letter-spacing, lighter weights.
- Below headline: "Book Now" CTA in accent color with generous padding and rounded-full shape.
- A subtle CSS animation: soft pulsing glow behind the CTA button.

### SERVICES — "The Menu"
- Service list presented as elegant horizontal rows (not cards) with generous spacing.
- Each service: name in drama serif italic (left-aligned), brief description (center, smaller), price/duration in monospace (right-aligned).
- A thin accent-colored divider between each service.
- Hover: the row gains a very subtle background tint and the service name shifts slightly right.
- Feel: like reading a spa menu at a luxury resort.

### PHILOSOPHY — "The Ritual"
- Full-width section with charcoal plum background.
- "Most salons offer appointments." (smaller, neutral) → "We offer transformations." (massive drama serif italic, accent-colored word "transformations").
- Background: subtle CSS radial gradient creating a soft, warm glow from center.

### EXPERIENCE — "The Journey"
- 3 scrolling sections describing the experience: "Arrive" (the welcome), "Indulge" (the treatment), "Emerge" (the transformation).
- Each section: step label in uppercase monospace, title in drama italic, poetic 2-line description.
- Decorative: floating CSS circles/orbs that slowly drift (CSS keyframe animations) in accent color at very low opacity.

### TEAM / STYLISTS — "The Artists"
- Grid of stylist/specialist cards (use initials in large drama italic font as avatar placeholders — no images).
- Each card: name, title/specialty, brief bio line.
- Elegant, minimal cards with rounded-[2rem] and thin borders.

### BOOKING — "The Invitation"
- Centered section with large drama italic text: "Your transformation awaits."
- Prominent "Book Your Appointment" CTA button.
- Below: hours of operation in monospace, address, phone (clickable).

### FOOTER — "The Afterglow"
- Charcoal plum background, rounded-t-[4rem].
- Brand name in drama italic, service categories, social links (styled as minimal text links), hours.
- "Now Booking" indicator with soft pulsing accent dot.`,
    cardPatterns: `
Card 1 — "Treatment Rotator": 3 overlapping cards cycling every 3.5s showcasing signature treatments. Each card has the treatment name in drama italic and a brief sensory description. Soft, flowing transitions.
Card 2 — "Studio Feed": Monospace typewriter cycling through messages: "Fresh eucalyptus aromatherapy prepared...", "Stylist Maya — now available...", "New spring color palette arrived...". Pulsing accent dot with "Studio Status" label.
Card 3 — "Appointment Scheduler": Elegant weekly grid with soft accent highlights. Animated cursor gently selects a day, picks a time, clicks "Book". Motion is slow, deliberate, and graceful.`,
    philosophyPattern:
      '"Most salons focus on: the appointment." → "We focus on: the ritual." — accent-color the word "ritual".',
    ctaLabels: ["Book Appointment", "View Services", "Gift Cards"],
  },

  // ── RETAIL & LOCAL SHOP ──────────────────────────────────────────────────
  retail: {
    identity:
      "A curated concept store in a converted warehouse — every product has a story, every display is intentional. The design should feel like walking into a space that's both exciting and intimate. Think Margiela retail concept meets your favorite indie bookshop.",
    palette: {
      primary: "Terracotta",
      accent: "Electric Teal",
      background: "Warm White",
      dark: "Night Indigo",
      names: "Terracotta `{primaryColor}` (Primary), Electric Teal `#0EA5A0` (Accent), Warm White `#FDFCFA` (Background), Night Indigo `#0F1029` (Dark)",
    },
    typography: {
      heading: '"Outfit" (semi-bold, slightly condensed feel)',
      drama: '"Cormorant Garamond" Italic (for product stories and collection names)',
      data: '"IBM Plex Mono" (for prices, sizes, stock info)',
    },
    imageMood: "curated shelves, warm lighting, raw wood displays, craft packaging, artisan goods",
    heroPattern:
      '"[Shopping noun] should be" (Bold Sans) / "discovery." (Massive Serif Italic). Example: "Shopping should be / discovery."',
    sections: `
### HERO — "The Storefront"
- Full-height section (min-height: 700px with generous padding). Rich CSS gradient from primary to dark with a warm, inviting glow (radial gradient of accent color at very low opacity in the center).
- Content bottom-left. Bold, inviting typography.
- Below headline: "Shop Now" and "Visit Us" dual CTAs. Primary CTA in accent color, secondary outlined.
- A subtle CSS pattern overlay: small dots or a grid at 0.02 opacity for texture.

### COLLECTIONS — "The Curated Display"
- Three collection/category cards.
- Each card: large category name in heading font, evocative 2-line description in body text, "Explore →" link in accent color.
- Cards have warm backgrounds with generous padding, rounded-[2rem], subtle warm shadow.
- Hover: card scales very slightly (1.02), shadow deepens.
- Feel: like browsing a beautifully designed lookbook.

### PHILOSOPHY — "The Story"
- Full-width night indigo section.
- "Most stores sell products." (smaller, neutral) → "We tell stories." (massive drama serif italic, accent-colored word "stories").
- Background: subtle warm CSS texture (repeating gradient creating a canvas-like feel).

### FEATURED — "The Spotlight"
- 3 scrolling sections highlighting what makes the shop special: "Source" (where products come from), "Curate" (the selection process), "Experience" (the in-store feel).
- Each: step number in monospace, title in heading font, descriptive text.
- Decorative: accent-colored geometric accents (CSS triangles, circles) at section transitions.

### VISIT US — "The Destination"
- Split layout: left has store hours in clean monospace format with accent-colored days, right has address and a "Get Directions" CTA.
- Below: a banner — "Follow us @[brand]" with social handles.

### FOOTER — "The Tag"
- Night indigo background, rounded-t-[4rem].
- Brand name in drama italic, product categories, newsletter signup (email input + button), contact info.
- "Store Open" indicator with pulsing teal dot and hours.`,
    cardPatterns: `
Card 1 — "Collection Rotator": 3 overlapping cards cycling every 3s showing product collections/categories. Each card has the collection name in drama italic and a brief mood description. Playful, dynamic transitions.
Card 2 — "Shop Feed": Monospace typewriter cycling through messages: "New arrivals just unpacked...", "Artisan candle collection — limited stock...", "Weekend pop-up: local ceramics". Pulsing accent dot with "Shop Updates" label.
Card 3 — "Store Hours": Weekly grid showing open hours. An animated cursor enters, highlights today's hours in accent color, and a "Visit Today" label appears. Friendly, inviting motion.`,
    philosophyPattern:
      '"Most shops focus on: transactions." → "We focus on: connections." — accent-color the word "connections".',
    ctaLabels: ["Shop Now", "Visit Us", "New Arrivals"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE SYSTEM PROMPT — Shared cinematic design system
// ─────────────────────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a World-Class Senior Creative Technologist and Lead Frontend Engineer. You build high-fidelity, cinematic "1:1 Pixel Perfect" landing pages. Every site you produce should feel like a digital instrument — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns.

OUTPUT RULES:
- Output ONLY the HTML code. No explanations, no markdown, no code fences.
- The HTML must be a complete document starting with <!DOCTYPE html> and ending with </html>.
- The total output should be a single HTML file that works when opened directly in a browser.

TECHNICAL REQUIREMENTS:
- Load Google Fonts via <link> tags in <head> based on the specified typography.
- Load GSAP 3 + ScrollTrigger from CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js and https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
- All CSS in a <style> block. All JS in a <script> block at end of body.
- IMAGES: If image URLs are provided in the SCRAPED CONTENT section, use them as <img> tags or CSS background-image URLs. If no scraped images are available, use Unsplash Source URLs based on the business category (e.g., https://images.unsplash.com/photo-ID?w=1200&q=80). For CSS-only decorative elements, use gradients, patterns, and SVG shapes. Every hero section MUST have a visual — either a scraped image, an Unsplash photo, or a rich CSS gradient with texture.
- Fully responsive (mobile-first). Stack elements vertically on mobile. Reduce font sizes. Collapse navbar.
- IMPORTANT: Do NOT use viewport height units (100vh, 100dvh) for section heights. Use min-height with fixed pixel values (e.g., min-height: 700px) or auto height with generous padding instead. The site may be previewed inside an iframe where viewport units don't work correctly.
- Ensure ALL content (hero text, service names, phone, email, address) is visible and populated. Never leave sections empty or with placeholder text like "Lorem ipsum".

FIXED DESIGN SYSTEM (APPLY TO ALL SITES):

### Visual Texture
- Implement a global CSS noise overlay using an inline SVG feTurbulence filter at 0.05 opacity to eliminate flat digital gradients.
- Use rounded-[2rem] to rounded-[3rem] radius system for all containers. No sharp corners.

### Micro-Interactions
- All buttons: "magnetic" feel with subtle scale(1.03) on hover using cubic-bezier(0.25, 0.46, 0.45, 0.94) easing.
- Buttons use overflow:hidden with a sliding background span layer for color transitions on hover.
- Links and interactive elements get translateY(-1px) lift on hover.

### Animation Lifecycle
- Use gsap.registerPlugin(ScrollTrigger) at initialization.
- Default easing: power3.out for entrances, power2.inOut for morphs.
- Stagger value: 0.08 for text, 0.15 for cards/containers.
- Hero elements: staggered fade-up (y: 40 → 0, opacity: 0 → 1).
- Section headings: fade-up triggered by ScrollTrigger when entering viewport.

### Navbar — "The Floating Island"
- Fixed, pill-shaped container, horizontally centered, top of viewport.
- Morphing: transparent with light text at hero top. Transitions to frosted glass (background-color with 60% opacity + backdrop-filter: blur(20px)) with primary text and subtle border when scrolled past hero. Use IntersectionObserver.
- Contains: Logo (brand name as styled text), 3-4 nav links, CTA button (accent color).

### Footer
- Deep dark-colored background, border-radius on top corners (4rem).
- Grid layout: Brand name + tagline, navigation columns, contact info, legal links.
- "Status" indicator with pulsing dot (CSS animation) and monospace label.

EXECUTION DIRECTIVE: Do not build a website; build a digital instrument. Every scroll should feel intentional, every animation weighted and professional. Eradicate all generic AI patterns.`;

// ─────────────────────────────────────────────────────────────────────────────
// Curated Unsplash images per category (stable photo IDs, free to use)
// ─────────────────────────────────────────────────────────────────────────────

const STOCK_IMAGES: Record<string, string[]> = {
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80", // elegant restaurant interior
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80", // fine dining plate
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80", // restaurant ambiance
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80", // food on table
    "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=1200&q=80", // chef kitchen
  ],
  contractor: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80", // construction site
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80", // home renovation
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80", // contractor tools
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80", // architecture blueprints
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80", // modern home interior
  ],
  professional: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80", // modern office
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80", // handshake meeting
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80", // professional portrait
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80", // desk work
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80", // team discussion
  ],
  salon: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80", // salon interior
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80", // hair styling
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80", // spa treatment
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80", // beauty products
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&q=80", // styled hair
  ],
  retail: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80", // boutique shop
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80", // retail store
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80", // shopping bags
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80", // product display
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80", // curated shop
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Scraped content type
// ─────────────────────────────────────────────────────────────────────────────

interface ScrapedContent {
  aboutText?: string;
  testimonials?: string[];
  hours?: string;
  socialLinks?: Record<string, string>;
  images?: string[];
  teamMembers?: { name: string; role: string }[];
  headings?: string[];
  paragraphs?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the full prompt for a specific business
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(
  templateId: string,
  data: TemplateData,
  scraped?: ScrapedContent
): string {
  const config = STYLE_CONFIGS[templateId] || STYLE_CONFIGS.contractor;

  // Replace {primaryColor} placeholder with actual color
  const paletteNames = config.palette.names.replace(
    /\{primaryColor\}/g,
    data.primaryColor
  );

  return `Build a cinematic landing page for this business. Follow the design system and industry-specific architecture below precisely.

═══════════════════════════════════════════════
BUSINESS DETAILS
═══════════════════════════════════════════════
- Business Name: ${data.businessName}
- Tagline: ${data.tagline}
- Description: ${data.description}
- Phone: ${data.phone}
- Email: ${data.email}
- Address: ${data.address}
- Services: ${data.services.join(", ")}
- Brand Color: ${data.primaryColor}

═══════════════════════════════════════════════
IDENTITY
═══════════════════════════════════════════════
${config.identity}

═══════════════════════════════════════════════
AESTHETIC PRESET
═══════════════════════════════════════════════

PALETTE: ${paletteNames}
Use the Brand Color (${data.primaryColor}) as the primary. Derive harmonious accent, background, and dark tones.

TYPOGRAPHY:
- Headings: ${config.typography.heading}
- Drama/Display: ${config.typography.drama}
- Data/Monospace: ${config.typography.data}
Load all fonts via Google Fonts <link> tags.

IMAGE MOOD: ${config.imageMood}

HERO LINE PATTERN: ${config.heroPattern}

═══════════════════════════════════════════════
SECTION ARCHITECTURE
═══════════════════════════════════════════════
${config.sections}

═══════════════════════════════════════════════
INTERACTIVE FEATURE CARDS
═══════════════════════════════════════════════
The services/features section must include these 3 interactive micro-UI card patterns (adapt labels from the business's actual services):
${config.cardPatterns}

═══════════════════════════════════════════════
PHILOSOPHY SECTION
═══════════════════════════════════════════════
Follow this contrast pattern (adapt to the actual business):
${config.philosophyPattern}

═══════════════════════════════════════════════
CTA LABELS
═══════════════════════════════════════════════
Primary CTAs to use throughout: ${config.ctaLabels.join(", ")}

═══════════════════════════════════════════════
IMAGES TO USE
═══════════════════════════════════════════════
${buildImageSection(templateId, scraped?.images)}

${buildScrapedContentSection(scraped)}

Make phone numbers clickable (tel: links) and emails clickable (mailto: links).
Include the copyright year ${new Date().getFullYear()} in the footer.

Generate the complete HTML file now.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for building prompt sections
// ─────────────────────────────────────────────────────────────────────────────

function buildImageSection(
  templateId: string,
  scrapedImages?: string[]
): string {
  const lines: string[] = [];

  if (scrapedImages && scrapedImages.length > 0) {
    lines.push(
      "Use these REAL images from the business's website. Apply them as hero backgrounds, section backgrounds, or inline images:"
    );
    scrapedImages.forEach((url, i) => {
      lines.push(`  ${i + 1}. ${url}`);
    });
    lines.push("");
  }

  // Always include stock photos as fallback/supplement
  const stockPhotos = STOCK_IMAGES[templateId] || STOCK_IMAGES.contractor;
  lines.push(
    "Use these stock photos for any sections that need additional imagery (hero background, about section, process sections). Apply with object-fit: cover and appropriate overlay gradients:"
  );
  stockPhotos.forEach((url, i) => {
    lines.push(`  ${i + 1}. ${url}`);
  });

  lines.push("");
  lines.push(
    "IMPORTANT: Use <img> tags with these URLs directly. Set images as CSS background-image for hero/banner sections with a dark gradient overlay for text readability. Every major section should have visual richness — never leave large areas as flat solid colors."
  );

  return lines.join("\n");
}

function buildScrapedContentSection(scraped?: ScrapedContent): string {
  if (!scraped) return "";

  const sections: string[] = [];
  sections.push("═══════════════════════════════════════════════");
  sections.push("SCRAPED CONTENT FROM EXISTING WEBSITE");
  sections.push("═══════════════════════════════════════════════");
  sections.push(
    "Use this real content from the business's existing website to populate sections. Rewrite for better copy if needed, but keep the facts accurate."
  );
  sections.push("");

  if (scraped.aboutText) {
    sections.push("ABOUT THE BUSINESS:");
    sections.push(scraped.aboutText);
    sections.push("");
  }

  if (scraped.testimonials && scraped.testimonials.length > 0) {
    sections.push("TESTIMONIALS / REVIEWS:");
    scraped.testimonials.forEach((t, i) => {
      sections.push(`  ${i + 1}. "${t}"`);
    });
    sections.push("");
  }

  if (scraped.hours) {
    sections.push("HOURS OF OPERATION:");
    sections.push(scraped.hours);
    sections.push("");
  }

  if (scraped.teamMembers && scraped.teamMembers.length > 0) {
    sections.push("TEAM MEMBERS:");
    scraped.teamMembers.forEach((m) => {
      sections.push(`  - ${m.name}${m.role ? ` — ${m.role}` : ""}`);
    });
    sections.push("");
  }

  if (scraped.socialLinks && Object.keys(scraped.socialLinks).length > 0) {
    sections.push("SOCIAL MEDIA:");
    for (const [platform, url] of Object.entries(scraped.socialLinks)) {
      sections.push(`  - ${platform}: ${url}`);
    }
    sections.push("");
  }

  if (scraped.headings && scraped.headings.length > 0) {
    sections.push("KEY HEADINGS FROM THEIR SITE (use as content inspiration):");
    scraped.headings.slice(0, 15).forEach((h) => {
      sections.push(`  - ${h}`);
    });
    sections.push("");
  }

  if (scraped.paragraphs && scraped.paragraphs.length > 0) {
    sections.push("KEY PARAGRAPHS FROM THEIR SITE (rewrite and improve):");
    scraped.paragraphs.slice(0, 6).forEach((p, i) => {
      sections.push(`  ${i + 1}. ${p}`);
    });
    sections.push("");
  }

  return sections.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWebsite(
  apiKey: string,
  templateId: string,
  data: TemplateData,
  scrapedContent?: ScrapedContent
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = buildPrompt(templateId, data, scrapedContent);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: userPrompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 64000,
      systemInstruction: BASE_SYSTEM_PROMPT,
    },
  });

  let html = response.text || "";

  // Strip markdown code fences if present
  html = html.replace(/^```html?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  html = html.trim();

  // Validate it looks like HTML
  if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<html")) {
    const htmlMatch = html.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i);
    if (htmlMatch) {
      html = htmlMatch[1];
    }
  }

  return html;
}
