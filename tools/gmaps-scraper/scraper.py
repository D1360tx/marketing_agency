"""
Google Maps Scraper
Replaces Apify Google Maps scraper - zero cost, Playwright-based.

Extracts: name, category, address, phone, website, rating, review count,
          hours, owner name, plus optional website enrichment (email, socials).
"""

import re
import time
import json
import logging
from typing import Optional
from urllib.parse import urlparse, urljoin
from dataclasses import dataclass, field, asdict

from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeout

logger = logging.getLogger(__name__)

SOCIAL_DOMAINS = {
    "facebook.com": "facebook",
    "instagram.com": "instagram",
    "linkedin.com": "linkedin",
    "twitter.com": "twitter",
    "x.com": "twitter",
    "yelp.com": "yelp",
    "tiktok.com": "tiktok",
}

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE
)

SKIP_EMAIL_DOMAINS = {
    "sentry.io", "wix.com", "example.com", "wordpress.com",
    "squarespace.com", "godaddy.com", "wixpress.com", "schema.org",
    "w3.org", "google.com", "placeholder.com",
}


@dataclass
class Business:
    name: str = ""
    category: str = ""
    address: str = ""
    phone: str = ""
    website: str = ""
    rating: str = ""
    review_count: str = ""
    hours: str = ""
    owner_name: str = ""
    # Enriched fields
    email: str = ""
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""
    yelp: str = ""
    tiktok: str = ""
    maps_url: str = ""

    def to_dict(self):
        return asdict(self)


class GoogleMapsScraper:
    def __init__(self, headless: bool = True, slow_mo: int = 0):
        self.headless = headless
        self.slow_mo = slow_mo
        self._playwright = None
        self._browser = None
        self._context = None

    def __enter__(self):
        self._playwright = sync_playwright().start()
        # Use system Chromium if available (avoids needing playwright install-deps)
        import shutil
        system_chrome = (
            shutil.which("chromium-browser")
            or shutil.which("chromium")
            or shutil.which("google-chrome")
        )
        launch_kwargs = dict(
            headless=self.headless,
            slow_mo=self.slow_mo,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ],
        )
        if system_chrome:
            launch_kwargs["executable_path"] = system_chrome
        self._browser = self._playwright.chromium.launch(**launch_kwargs)
        self._context = self._browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        return self

    def __exit__(self, *args):
        # Playwright's Node.js driver can throw EPIPE when the pipe closes
        # mid-dispose. Catch everything here so crashes don't propagate.
        try:
            if self._context:
                self._context.close()
        except Exception as e:
            logger.debug(f"Context close error (safe to ignore): {e}")
        try:
            if self._browser:
                self._browser.close()
        except Exception as e:
            logger.debug(f"Browser close error (safe to ignore): {e}")
        try:
            if self._playwright:
                self._playwright.stop()
        except Exception as e:
            logger.debug(f"Playwright stop error (safe to ignore): {e}")

    def scrape(self, query: str, limit: int = 60, enrich: bool = False) -> list[Business]:
        """Main entry point. Scrape Google Maps for a query."""
        logger.info(f"Scraping: '{query}' | limit={limit} | enrich={enrich}")
        page = self._context.new_page()
        businesses = []

        try:
            businesses = self._scrape_maps(page, query, limit)
            logger.info(f"Found {len(businesses)} businesses from Maps")
        finally:
            page.close()

        if enrich and businesses:
            logger.info("Enriching with website data (email + socials)...")
            businesses = self._enrich_batch(businesses)

        return businesses

    def _scrape_maps(self, page: Page, query: str, limit: int) -> list[Business]:
        """Navigate Maps, scroll results, extract business cards."""
        url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)

        # Handle consent dialogs
        self._dismiss_dialogs(page)

        businesses = []
        seen_names = set()

        # Scroll the results panel to load more listings
        results_panel = None
        for selector in [
            'div[role="feed"]',
            'div.m6QErb[aria-label]',
            'div[jsaction*="pane"]',
        ]:
            try:
                results_panel = page.wait_for_selector(selector, timeout=8000)
                if results_panel:
                    break
            except PlaywrightTimeout:
                continue

        if not results_panel:
            logger.warning("Could not find results panel")
            return businesses

        scroll_attempts = 0
        max_scrolls = max(limit // 5, 20)

        while len(businesses) < limit and scroll_attempts < max_scrolls:
            # Collect all result items currently visible
            items = page.query_selector_all('a.hfpxzc')
            
            for item in items:
                if len(businesses) >= limit:
                    break
                try:
                    name = item.get_attribute("aria-label") or ""
                    if not name or name in seen_names:
                        continue
                    seen_names.add(name)

                    # Click to open the details panel
                    item.click()
                    time.sleep(1.5)

                    biz = self._extract_details(page, name)
                    if biz:
                        businesses.append(biz)
                        logger.info(f"  [{len(businesses)}] {biz.name}")

                except Exception as e:
                    logger.debug(f"Error on item: {e}")
                    continue

            # Scroll down to load more
            try:
                page.evaluate(
                    "document.querySelector('div[role=\"feed\"]').scrollBy(0, 1200)"
                )
            except Exception:
                try:
                    page.keyboard.press("End")
                except Exception:
                    pass
            time.sleep(1.5)
            scroll_attempts += 1

            # Check if we've reached the end
            end_marker = page.query_selector('span.HlvSq')
            if end_marker:
                logger.info("Reached end of results")
                break

        return businesses

    def _extract_details(self, page: Page, fallback_name: str) -> Optional[Business]:
        """Extract all fields from the open details panel."""
        biz = Business()

        try:
            # Wait for details pane heading to confirm panel switched
            page.wait_for_selector('h1', timeout=6000)
            time.sleep(0.5)
        except PlaywrightTimeout:
            pass

        try:
            # --- Name ---
            # Google Maps has 3 h1s: "Results" heading, empty, then business name
            name_el = page.query_selector('h1.DUwDvf')
            biz.name = name_el.inner_text().strip() if name_el else fallback_name

            # --- Category ---
            cat_el = page.query_selector('button.DkEaL')
            biz.category = cat_el.inner_text().strip() if cat_el else ""

            # --- Rating ---
            rating_el = page.query_selector('div.F7nice span[aria-hidden="true"]')
            biz.rating = rating_el.inner_text().strip() if rating_el else ""

            # --- Review count ---
            review_el = page.query_selector('div.F7nice [aria-label]')
            if review_el:
                label = review_el.get_attribute("aria-label") or ""
                nums = re.findall(r"[\d,]+", label)
                biz.review_count = nums[0] if nums else ""

            # --- Address ---
            # data-item-id="address" is the reliable selector
            addr_el = page.query_selector('[data-item-id="address"]')
            if addr_el:
                # Strip leading icon character (unicode)
                raw = addr_el.inner_text().strip()
                # Remove leading non-ASCII icon chars
                biz.address = re.sub(r"^[^\w\d(]+", "", raw).strip()

            # --- Phone ---
            # data-item-id starts with "phone:tel:"
            phone_el = page.query_selector('[data-item-id^="phone:tel:"]')
            if phone_el:
                raw = phone_el.inner_text().strip()
                biz.phone = re.sub(r"^[^\w\d(+]+", "", raw).strip()

            # --- Website ---
            # data-item-id="authority" is an <a> with a Google redirect href
            # Real URL is in the ?q= param. E.g.: google.com/url?q=https://example.com/...
            web_el = page.query_selector('[data-item-id="authority"]')
            if not web_el:
                web_el = page.query_selector('[data-tooltip="Open website"]')
            if web_el:
                href = web_el.get_attribute("href") or ""
                if href:
                    from urllib.parse import urlparse, parse_qs, unquote
                    if "google.com/url" in href:
                        qs = parse_qs(urlparse(href).query)
                        real = qs.get("q", [None])[0]
                        biz.website = unquote(real) if real else href
                    elif href.startswith("http"):
                        biz.website = href
                else:
                    # Fallback: extract domain text from aria-label
                    label = web_el.get_attribute("aria-label") or ""
                    match = re.search(r"Website:\s*(\S+)", label, re.I)
                    if match:
                        domain = match.group(1).strip().rstrip(".")
                        biz.website = "https://" + domain if not domain.startswith("http") else domain

            # --- Hours ---
            hours_el = page.query_selector('[data-item-id="oh"]')
            if not hours_el:
                hours_el = page.query_selector('[data-tooltip="Copy open hours"]')
            if hours_el:
                raw = hours_el.inner_text().strip()
                biz.hours = re.sub(r"^[^\w]+", "", raw).strip()[:200]

            # --- Owner name ---
            owner_el = page.query_selector('[aria-label*="owner" i]')
            if owner_el:
                biz.owner_name = owner_el.inner_text().strip()

            # Maps URL
            biz.maps_url = page.url

        except Exception as e:
            logger.debug(f"Detail extraction error for {fallback_name}: {e}")

        return biz if biz.name else None

    def _enrich_batch(self, businesses: list[Business], page_recycle_every: int = 15) -> list[Business]:
        """Visit each business website to extract email + social links."""
        enrich_page = self._context.new_page()
        try:
            for i, biz in enumerate(businesses):
                if not biz.website:
                    continue
                logger.info(f"  Enriching [{i+1}/{len(businesses)}] {biz.name}")
                # Recycle browser page periodically to prevent Chromium memory crash
                if i > 0 and i % page_recycle_every == 0:
                    try:
                        enrich_page.close()
                    except Exception:
                        pass
                    enrich_page = self._context.new_page()
                    logger.debug(f"  [browser page recycled at {i+1}]")
                try:
                    self._enrich_from_website(enrich_page, biz)
                    time.sleep(1)
                except Exception as e:
                    logger.debug(f"Enrich failed for {biz.name}: {e}")
        finally:
            try:
                enrich_page.close()
            except Exception:
                pass
        return businesses

    def _enrich_from_website(self, page: Page, biz: Business):
        """Extract email + social links from business website."""
        website = biz.website
        if not website.startswith("http"):
            website = "https://" + website

        try:
            page.goto(website, wait_until="domcontentloaded", timeout=15000)
            time.sleep(1)
        except Exception:
            return

        html = page.content()
        base_url = website

        # Extract emails
        emails = self._extract_emails(html, page)
        if emails:
            biz.email = emails[0]

        # Extract social links
        links = page.query_selector_all("a[href]")
        for link in links:
            try:
                href = link.get_attribute("href") or ""
                if not href:
                    continue
                href = href.strip().rstrip("/")
                for domain, key in SOCIAL_DOMAINS.items():
                    if domain in href and not getattr(biz, key):
                        # Make sure the href actually contains the social domain as a host
                        # (not just a path reference on the business site)
                        try:
                            parsed = urlparse(href)
                            if domain in (parsed.netloc or ""):
                                setattr(biz, key, href)
                        except Exception:
                            pass
            except Exception:
                continue

        # If no email found on homepage, try /contact page
        if not biz.email:
            contact_urls = [
                urljoin(base_url, "/contact"),
                urljoin(base_url, "/contact-us"),
                urljoin(base_url, "/about"),
            ]
            for curl in contact_urls:
                try:
                    page.goto(curl, wait_until="domcontentloaded", timeout=10000)
                    time.sleep(0.8)
                    html2 = page.content()
                    emails2 = self._extract_emails(html2, page)
                    if emails2:
                        biz.email = emails2[0]
                        break
                except Exception:
                    continue

    def _extract_emails(self, html: str, page: Page) -> list[str]:
        """Extract valid emails from page HTML + mailto links."""
        found = set()

        # mailto links
        try:
            mailto_links = page.query_selector_all('a[href^="mailto:"]')
            for el in mailto_links:
                href = el.get_attribute("href") or ""
                email = href.replace("mailto:", "").split("?")[0].strip()
                if self._is_valid_email(email):
                    found.add(email.lower())
        except Exception:
            pass

        # Regex scan HTML
        for match in EMAIL_REGEX.findall(html):
            if self._is_valid_email(match):
                found.add(match.lower())

        return sorted(found)

    def _is_valid_email(self, email: str) -> bool:
        if not email or "@" not in email:
            return False
        domain = email.split("@")[-1].lower()
        if domain in SKIP_EMAIL_DOMAINS:
            return False
        if any(skip in domain for skip in ["sentry", "wix", "placeholder", "example"]):
            return False
        # Skip image/asset filenames that match email regex
        if any(email.endswith(ext) for ext in [".png", ".jpg", ".gif", ".svg", ".css", ".js"]):
            return False
        return True

    def _dismiss_dialogs(self, page: Page):
        """Dismiss cookie/consent popups."""
        for selector in [
            'button[aria-label*="Accept" i]',
            'button[aria-label*="Agree" i]',
            'form[action*="consent"] button',
        ]:
            try:
                btn = page.query_selector(selector)
                if btn:
                    btn.click()
                    time.sleep(0.5)
                    break
            except Exception:
                continue
