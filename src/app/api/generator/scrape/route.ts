import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const BLACKLIST_EMAIL_PATTERNS = [
  /@example\./,
  /@test\./,
  /@localhost/,
  /@sentry\./,
  /@wixpress\./,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.css$/,
  /\.js$/,
];

const BLACKLIST_IMAGE_PATTERNS = [
  /logo/i,
  /icon/i,
  /favicon/i,
  /sprite/i,
  /pixel/i,
  /tracking/i,
  /badge/i,
  /widget/i,
  /button/i,
  /arrow/i,
  /spacer/i,
  /1x1/,
  /transparent/i,
  /data:image/,
  /\.svg$/i,
  /\.gif$/i,
  /gravatar/i,
  /wp-includes/i,
  /wp-content\/plugins/i,
  /facebook\.com/i,
  /google\.com\/ads/i,
  /doubleclick/i,
  /analytics/i,
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }
    const baseUrl = targetUrl.replace(/\/$/, "");

    // Fetch multiple pages in parallel for comprehensive scraping
    const pagesToFetch = [
      { url: baseUrl, label: "homepage" },
      { url: `${baseUrl}/about`, label: "about" },
      { url: `${baseUrl}/about-us`, label: "about" },
      { url: `${baseUrl}/contact`, label: "contact" },
      { url: `${baseUrl}/contact-us`, label: "contact" },
      { url: `${baseUrl}/services`, label: "services" },
      { url: `${baseUrl}/menu`, label: "menu" },
      { url: `${baseUrl}/our-team`, label: "team" },
      { url: `${baseUrl}/team`, label: "team" },
      { url: `${baseUrl}/gallery`, label: "gallery" },
      { url: `${baseUrl}/testimonials`, label: "testimonials" },
      { url: `${baseUrl}/reviews`, label: "testimonials" },
    ];

    const results = await Promise.allSettled(
      pagesToFetch.map(async (page) => {
        const res = await fetch(page.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; AgencyFlow/1.0; +https://agencyflow.app)",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return { label: page.label, html: "", url: page.url };
        const html = await res.text();
        return { label: page.label, html, url: page.url };
      })
    );

    // Organize by page type
    const pages: Record<string, string> = {};
    const allHTML: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.html) {
        const { label, html } = result.value;
        if (!pages[label]) pages[label] = html;
        allHTML.push(html);
      }
    }

    const combinedHTML = allHTML.join("\n");

    // Extract everything
    const data = extractFullContent(combinedHTML, pages, baseUrl);

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to scrape website" },
      { status: 500 }
    );
  }
}

function extractFullContent(
  allHTML: string,
  pages: Record<string, string>,
  baseUrl: string
) {
  const homepage = pages.homepage || allHTML;

  // ── Clean text helper ──
  function htmlToText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const allText = htmlToText(allHTML);
  const homepageText = htmlToText(homepage);

  // ── Business Name ──
  const titleMatch = homepage.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = homepage.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  let businessName = "";
  if (ogTitleMatch) {
    businessName = ogTitleMatch[1].split(/[|\-–—]/)[0].trim();
  } else if (titleMatch) {
    businessName = titleMatch[1].split(/[|\-–—]/)[0].trim();
  }

  // ── Description / Tagline ──
  const metaDescMatch =
    homepage.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    homepage.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );
  const ogDescMatch =
    homepage.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    homepage.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i
    );

  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : "";

  // Find hero text — look for h1, large h2s
  const h1Match = homepage.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const heroH1 = h1Match ? htmlToText(h1Match[1]) : "";

  const h2Matches = homepage.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const heroH2s = h2Matches.slice(0, 3).map((h) => htmlToText(h)).filter((t) => t.length > 3 && t.length < 120);

  let tagline = "";
  let description = metaDescription || ogDescription;

  if (heroH2s.length > 0 && heroH2s[0].length < 80) {
    tagline = heroH2s[0];
  } else if (heroH1 && heroH1 !== businessName && heroH1.length < 80) {
    tagline = heroH1;
  }
  if (!tagline && description && description.length < 80) {
    tagline = description;
    description = "";
  }

  // ── Phone Numbers ──
  const phones = new Set<string>();
  const telMatches = allHTML.match(/href=["']tel:([^"']+)["']/gi);
  if (telMatches) {
    for (const match of telMatches) {
      const phone = match.replace(/href=["']tel:/i, "").replace(/["']/g, "");
      if (phone.replace(/\D/g, "").length >= 10) {
        phones.add(phone);
      }
    }
  }
  const phoneMatches = allText.match(PHONE_REGEX);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      if (match.replace(/\D/g, "").length >= 10) {
        phones.add(match.trim());
      }
    }
  }

  // ── Emails ──
  const emails = new Set<string>();
  const mailtoMatches = allHTML.match(
    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  );
  if (mailtoMatches) {
    for (const match of mailtoMatches) {
      const email = match.replace(/^mailto:/i, "").toLowerCase();
      if (!BLACKLIST_EMAIL_PATTERNS.some((p) => p.test(email))) {
        emails.add(email);
      }
    }
  }
  const emailMatches = allText.match(EMAIL_REGEX);
  if (emailMatches) {
    for (const match of emailMatches) {
      const email = match.toLowerCase();
      if (
        !BLACKLIST_EMAIL_PATTERNS.some((p) => p.test(email)) &&
        email.length < 60
      ) {
        emails.add(email);
      }
    }
  }

  // ── Address ──
  let address = "";
  const addressPatterns = [
    /(\d{1,5}\s+[A-Za-z0-9\s.]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Suite|Ste)[.,]?\s*(?:#?\s*\d+[A-Za-z]?\s*,?\s*)?[A-Za-z\s]+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)/gi,
    /(\d{1,5}\s+[A-Za-z0-9\s.]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)[.,]?\s+[A-Za-z\s]+,?\s+[A-Z]{2})/gi,
  ];
  for (const pattern of addressPatterns) {
    const match = allText.match(pattern);
    if (match) {
      address = match[0].trim();
      break;
    }
  }

  // ── Services ──
  const services: string[] = [];

  // Try dedicated services page first
  const servicesHTML = pages.services || pages.menu || "";
  if (servicesHTML) {
    // Look for <li>, <h3>, <h4> in services page
    const liMatches = servicesHTML.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    for (const li of liMatches) {
      const text = htmlToText(li);
      if (text.length > 2 && text.length < 80 && !text.includes("http")) {
        services.push(text);
      }
    }
    if (services.length === 0) {
      const headings =
        servicesHTML.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi) || [];
      for (const h of headings) {
        const text = htmlToText(h);
        if (text.length > 2 && text.length < 60) {
          services.push(text);
        }
      }
    }
  }

  // Fall back to homepage
  if (services.length === 0) {
    // Look for service sections by class/id
    const sectionRegex =
      /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:service|offering|what-we-do|our-work|feature|specialt)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi;
    let sectionMatch;
    while ((sectionMatch = sectionRegex.exec(homepage)) !== null) {
      const sectionHTML = sectionMatch[1];
      const items = sectionHTML.match(/<(?:li|h[34])[^>]*>([\s\S]*?)<\/(?:li|h[34])>/gi) || [];
      for (const item of items) {
        const text = htmlToText(item);
        if (text.length > 2 && text.length < 80) {
          services.push(text);
        }
      }
    }
  }

  // Last resort: h3 tags on homepage
  if (services.length === 0) {
    const headingMatches = homepage.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi) || [];
    const skip = ["contact", "about", "home", "menu", "copyright", "footer", "header", "nav", "blog", "news"];
    for (const h of headingMatches.slice(0, 12)) {
      const text = htmlToText(h);
      if (
        text.length > 2 &&
        text.length < 60 &&
        !skip.some((s) => text.toLowerCase().includes(s))
      ) {
        services.push(text);
      }
    }
  }

  // ── About / Story Text ──
  let aboutText = "";
  if (pages.about) {
    const aboutBody = pages.about
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "");
    const paragraphs = aboutBody.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    aboutText = paragraphs
      .map((p) => htmlToText(p))
      .filter((p) => p.length > 30 && p.length < 500)
      .slice(0, 5)
      .join(" ");
  }
  // Also grab paragraphs from homepage for description
  if (!description) {
    const homeParagraphs = homepage.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    description = homeParagraphs
      .map((p) => htmlToText(p))
      .filter((p) => p.length > 40 && p.length < 300)
      .slice(0, 2)
      .join(" ");
  }

  // ── Testimonials ──
  const testimonials: string[] = [];
  const testimonialHTML = pages.testimonials || allHTML;
  // Look for blockquotes
  const blockquotes = testimonialHTML.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi) || [];
  for (const bq of blockquotes.slice(0, 4)) {
    const text = htmlToText(bq);
    if (text.length > 20 && text.length < 400) {
      testimonials.push(text);
    }
  }
  // Look for review/testimonial sections
  if (testimonials.length === 0) {
    const reviewRegex =
      /<(?:div|article)[^>]*(?:class|id)=["'][^"']*(?:testimonial|review|quote)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article)>/gi;
    let reviewMatch;
    while ((reviewMatch = reviewRegex.exec(testimonialHTML)) !== null && testimonials.length < 4) {
      const text = htmlToText(reviewMatch[1]);
      if (text.length > 20 && text.length < 400) {
        testimonials.push(text);
      }
    }
  }

  // ── Hours of Operation ──
  let hours = "";
  const hoursRegex =
    /<(?:div|section|table|ul)[^>]*(?:class|id)=["'][^"']*(?:hour|schedule|time|open)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|table|ul)>/gi;
  const hoursMatch = hoursRegex.exec(allHTML);
  if (hoursMatch) {
    hours = htmlToText(hoursMatch[1]).slice(0, 300);
  }
  // Simple pattern match for hours
  if (!hours) {
    const hoursTextMatch = allText.match(
      /(?:hours|schedule|open)[:\s]*((?:mon|tue|wed|thu|fri|sat|sun|daily|weekday|weekend)[\s\S]{5,200})/i
    );
    if (hoursTextMatch) {
      hours = hoursTextMatch[1].slice(0, 300).trim();
    }
  }

  // ── Social Media Links ──
  const socialLinks: Record<string, string> = {};
  const socialPatterns: [string, RegExp][] = [
    ["facebook", /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s]+)["']/i],
    ["instagram", /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s]+)["']/i],
    ["twitter", /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s]+)["']/i],
    ["linkedin", /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s]+)["']/i],
    ["yelp", /href=["'](https?:\/\/(?:www\.)?yelp\.com\/[^"'\s]+)["']/i],
    ["youtube", /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"'\s]+)["']/i],
    ["tiktok", /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s]+)["']/i],
  ];
  for (const [name, pattern] of socialPatterns) {
    const match = allHTML.match(pattern);
    if (match) {
      socialLinks[name] = match[1];
    }
  }

  // ── Images ──
  const images: string[] = [];
  const imgMatches = allHTML.match(/<img[^>]+src=["']([^"']+)["'][^>]*/gi) || [];
  const ogImageMatch = homepage.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );

  // OG image first (usually the best hero image)
  if (ogImageMatch) {
    const ogImg = resolveUrl(ogImageMatch[1], baseUrl);
    if (ogImg && isGoodImage(ogImg)) {
      images.push(ogImg);
    }
  }

  // Then scrape img tags
  for (const imgTag of imgMatches) {
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const src = resolveUrl(srcMatch[1], baseUrl);
    if (!src || !isGoodImage(src)) continue;

    // Try to get dimensions to filter tiny images
    const widthMatch = imgTag.match(/width=["']?(\d+)/i);
    const heightMatch = imgTag.match(/height=["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 100) continue;
    if (heightMatch && parseInt(heightMatch[1]) < 100) continue;

    if (!images.includes(src)) {
      images.push(src);
    }
    if (images.length >= 10) break;
  }

  // Also check CSS background images
  const bgMatches = allHTML.match(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi) || [];
  for (const bgMatch of bgMatches) {
    const urlMatch = bgMatch.match(/url\(["']?([^"')]+)["']?\)/i);
    if (urlMatch) {
      const src = resolveUrl(urlMatch[1], baseUrl);
      if (src && isGoodImage(src) && !images.includes(src)) {
        images.push(src);
      }
    }
    if (images.length >= 10) break;
  }

  // ── Team Members ──
  const teamMembers: { name: string; role: string }[] = [];
  if (pages.team) {
    const teamCards =
      pages.team.match(
        /<(?:div|article|li)[^>]*(?:class|id)=["'][^"']*(?:team|staff|member|employee|person)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi
      ) || [];
    for (const card of teamCards.slice(0, 6)) {
      const nameMatch = card.match(/<h[23456][^>]*>([\s\S]*?)<\/h[23456]>/i);
      const roleMatch =
        card.match(/<(?:p|span)[^>]*(?:class|id)=["'][^"']*(?:title|role|position|job)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|span)>/i) ||
        card.match(/<(?:p|span)[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
      if (nameMatch) {
        const name = htmlToText(nameMatch[1]);
        const role = roleMatch ? htmlToText(roleMatch[1]) : "";
        if (name.length > 1 && name.length < 60) {
          teamMembers.push({ name, role: role.slice(0, 80) });
        }
      }
    }
  }

  // ── All heading content for context ──
  const allHeadings = (allHTML.match(/<h[1234][^>]*>([\s\S]*?)<\/h[1234]>/gi) || [])
    .map((h) => htmlToText(h))
    .filter((t) => t.length > 2 && t.length < 100);

  // ── All paragraph content ──
  const allParagraphs = (allHTML.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [])
    .map((p) => htmlToText(p))
    .filter((p) => p.length > 30 && p.length < 500);

  return {
    businessName,
    tagline,
    description,
    phone: Array.from(phones)[0] || "",
    email: Array.from(emails)[0] || "",
    address,
    services: [...new Set(services)].slice(0, 12),
    aboutText: aboutText.slice(0, 1000),
    testimonials: testimonials.slice(0, 4),
    hours,
    socialLinks,
    images: images.slice(0, 10),
    teamMembers: teamMembers.slice(0, 6),
    headings: [...new Set(allHeadings)].slice(0, 20),
    paragraphs: allParagraphs.slice(0, 10),
  };
}

function resolveUrl(src: string, baseUrl: string): string {
  if (!src || src.startsWith("data:")) return "";
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return `${new URL(baseUrl).origin}${src}`;
  return `${baseUrl}/${src}`;
}

function isGoodImage(url: string): boolean {
  if (BLACKLIST_IMAGE_PATTERNS.some((p) => p.test(url))) return false;
  // Must be a common image format
  if (!/\.(jpg|jpeg|png|webp)/i.test(url) && !url.includes("image") && !url.includes("photo") && !url.includes("unsplash")) {
    // Check if it might be a dynamic image URL (no extension but valid)
    if (url.includes("wp-content/uploads") || url.includes("cloudinary") || url.includes("imgix")) {
      return true;
    }
    return false;
  }
  return true;
}
