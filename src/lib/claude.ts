import Anthropic from "@anthropic-ai/sdk";
import type { TemplateData } from "@/lib/templates";

// Reuse the same prompt-building logic from gemini.ts
// but export a Claude-specific generator

const BASE_SYSTEM_PROMPT = `You are a World-Class Senior Creative Technologist and Lead Frontend Engineer. You build high-fidelity, cinematic "1:1 Pixel Perfect" landing pages. Every site you produce should feel like a digital instrument — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns.

OUTPUT RULES:
- Output ONLY the HTML code. No explanations, no markdown, no code fences.
- The HTML must be a complete document starting with <!DOCTYPE html> and ending with </html>.
- The total output should be a single HTML file that works when opened directly in a browser.

TECHNICAL REQUIREMENTS:
- Load Google Fonts via <link> tags in <head> based on the specified typography.
- Load GSAP 3 + ScrollTrigger from CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js and https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
- All CSS in a <style> block. All JS in a <script> block at end of body.
- IMAGES: If image URLs are provided in the SCRAPED CONTENT section, use them as <img> tags or CSS background-image URLs. If no scraped images are available, use Unsplash Source URLs based on the business category. For CSS-only decorative elements, use gradients, patterns, and SVG shapes. Every hero section MUST have a visual — either a scraped image, an Unsplash photo, or a rich CSS gradient with texture.
- Fully responsive (mobile-first). Stack elements vertically on mobile. Reduce font sizes. Collapse navbar.
- IMPORTANT: Do NOT use viewport height units (100vh, 100dvh) for section heights. Use min-height with fixed pixel values (e.g., min-height: 700px) or auto height with generous padding instead.
- Ensure ALL content (hero text, service names, phone, email, address) is visible and populated. Never leave sections empty or with placeholder text.

FIXED DESIGN SYSTEM:

### Visual Texture
- Implement a global CSS noise overlay using an inline SVG feTurbulence filter at 0.05 opacity.
- Use rounded-[2rem] to rounded-[3rem] radius system for all containers.

### Micro-Interactions
- All buttons: "magnetic" feel with subtle scale(1.03) on hover using cubic-bezier(0.25, 0.46, 0.45, 0.94).
- Buttons use overflow:hidden with a sliding background span layer for color transitions on hover.
- Links and interactive elements get translateY(-1px) lift on hover.

### Animation Lifecycle
- Use gsap.registerPlugin(ScrollTrigger) at initialization.
- Default easing: power3.out for entrances, power2.inOut for morphs.
- Stagger value: 0.08 for text, 0.15 for cards/containers.
- Hero elements: staggered fade-up (y: 40 → 0, opacity: 0 → 1).
- Section headings: fade-up triggered by ScrollTrigger.

### Navbar — "The Floating Island"
- Fixed, pill-shaped container, horizontally centered, top of viewport.
- Transparent at top, frosted glass when scrolled (backdrop-filter: blur(20px)).
- Contains: Logo, 3-4 nav links, CTA button.

### Footer
- Deep dark-colored background, border-radius on top corners (4rem).
- Grid layout: Brand name + tagline, navigation columns, contact info, legal links.

EXECUTION DIRECTIVE: Build a digital instrument, not just a website. Every scroll intentional, every animation weighted and professional.`;

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

function buildClaudePrompt(
  templateId: string,
  data: TemplateData,
  scraped?: ScrapedContent
): string {
  const stockImages: Record<string, string[]> = {
    restaurant: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    ],
    contractor: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80",
    ],
    professional: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    ],
    salon: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80",
    ],
    retail: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80",
    ],
  };

  const images = scraped?.images?.length
    ? scraped.images
    : stockImages[templateId] || stockImages.contractor;

  let scrapedSection = "";
  if (scraped) {
    const parts: string[] = [];
    if (scraped.aboutText) parts.push(`About: ${scraped.aboutText}`);
    if (scraped.testimonials?.length)
      parts.push(`Testimonials: ${scraped.testimonials.join(" | ")}`);
    if (scraped.hours) parts.push(`Hours: ${scraped.hours}`);
    if (scraped.teamMembers?.length)
      parts.push(
        `Team: ${scraped.teamMembers.map((m) => `${m.name} (${m.role})`).join(", ")}`
      );
    if (parts.length) {
      scrapedSection = `\n\nSCRAPED CONTENT FROM EXISTING WEBSITE:\n${parts.join("\n")}`;
    }
  }

  return `Build a cinematic, world-class landing page for this business.

BUSINESS DETAILS:
- Name: ${data.businessName}
- Tagline: ${data.tagline}
- Description: ${data.description}
- Phone: ${data.phone}
- Email: ${data.email}
- Address: ${data.address}
- Services: ${data.services.join(", ")}
- Brand Color: ${data.primaryColor}
- Industry/Template: ${templateId}

IMAGES TO USE (as hero backgrounds with dark gradient overlays, section images, etc.):
${images.map((url, i) => `${i + 1}. ${url}`).join("\n")}
${scrapedSection}

REQUIREMENTS:
- Build sections: Hero (full-height with gradient + image background), Services/Features (interactive cards), Philosophy/Trust (contrast statement), Process (3 steps), Contact/CTA, Footer
- Make phone numbers tel: links, emails mailto: links
- Include copyright year ${new Date().getFullYear()}
- Use the brand color ${data.primaryColor} as primary, derive accent/background/dark tones
- Load appropriate Google Fonts for the ${templateId} industry aesthetic
- Every section must have real content from the business details above — no placeholder text

Generate the complete HTML file now.`;
}

export async function generateWebsiteWithClaude(
  apiKey: string,
  templateId: string,
  data: TemplateData,
  scrapedContent?: ScrapedContent
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const userPrompt = buildClaudePrompt(templateId, data, scrapedContent);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 64000,
    system: BASE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let html = "";
  for (const block of response.content) {
    if (block.type === "text") {
      html += block.text;
    }
  }

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
