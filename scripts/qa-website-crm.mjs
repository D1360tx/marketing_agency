const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const out = "artifacts/website-crm";
mkdirSync(out, { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:3359/website-crm";
const browser = await chromium.launch({ headless: true });
const report = { url: base, widths: [], mutations: [], errors: [], checks: [] };
try {
  for (const width of [390, 768, 1280, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (e) => report.errors.push(String(e)));
    await page.route("**/*", (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (!["GET", "HEAD"].includes(req.method())) {
        report.mutations.push(req.method() + " " + url.pathname);
        return route.abort();
      }
      if (!["127.0.0.1", "localhost"].includes(url.hostname))
        return route.abort();
      return route.continue();
    });
    const response = await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.match(response.headers()["x-robots-tag"], /noindex/);
    assert.match(
      await page.locator("meta[name=robots]").getAttribute("content"),
      /noindex/,
    );
    const geometry = await page.evaluate(() => {
      const headings = [...document.querySelectorAll("main h1,main h2")].map(
        (el) => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const lines = [];
          let node;
          while ((node = walker.nextNode())) {
            for (const match of node.textContent.matchAll(/\S+/g)) {
              const r = document.createRange();
              r.setStart(node, match.index);
              r.setEnd(node, match.index + match[0].length);
              const b = r.getBoundingClientRect();
              if (b.width) {
                let line = lines.find((x) => Math.abs(x.y - b.y) < 4);
                if (!line) {
                  line = { y: b.y, words: [] };
                  lines.push(line);
                }
                line.words.push(match[0]);
              }
            }
          }
          return {
            text: el.innerText,
            lines: lines.map((l) => l.words.join(" ")),
            orphans: lines
              .filter((l) => l.words.length === 1)
              .map((l) => l.words[0]),
          };
        },
      );
      const controls = [...document.querySelectorAll("a,button,select,summary")]
        .filter((el) => el.getClientRects().length)
        .map((el) => ({
          text: el.textContent.trim(),
          height: el.getBoundingClientRect().height,
          width: el.getBoundingClientRect().width,
        }));
      return {
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        headings,
        shortControls: controls.filter((c) => c.height < 44 || c.width < 44),
      };
    });
    report.widths.push({ width, ...geometry });
    await page.screenshot({
      path: `${out}/${width}-full.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.screenshot({
      path: `${out}/${width}-hero.png`,
      animations: "disabled",
    });
    assert.equal(geometry.scrollWidth, width, `overflow ${width}`);
    assert.deepEqual(geometry.shortControls, [], `small controls ${width}`);
    // Both demo instances: click, keyboard arrows, independent state.
    await page.locator("#hero-demo-tab-1").click();
    assert.match(
      await page.locator("#hero-demo-panel").innerText(),
      /NOT SENT/,
    );
    await page.locator("#hero-demo-tab-1").press("ArrowRight");
    assert.equal(
      await page.locator("#hero-demo-tab-2").getAttribute("aria-selected"),
      "true",
    );
    assert.match(
      await page.locator("#hero-demo-panel").innerText(),
      /No appointment is booked/,
    );
    assert.equal(
      await page.locator("#workflow-demo-tab-0").getAttribute("aria-selected"),
      "true",
    );
    await page.locator("#workflow-demo-tab-0").press("End");
    assert.equal(
      await page.locator("#workflow-demo-tab-2").getAttribute("aria-selected"),
      "true",
    );
    await page.locator("#workflow-demo-tab-2").press("Home");
    assert.equal(
      await page.locator("#workflow-demo-tab-0").getAttribute("aria-selected"),
      "true",
    );
    const faq = page.locator("details").first();
    await faq.locator("summary").focus();
    await faq.locator("summary").press("Enter");
    assert.equal(await faq.getAttribute("open"), "");
    await faq.locator("summary").press("Enter");
    assert.equal(await faq.getAttribute("open"), null);
    if (width === 390) {
      const menu = page.locator('button[aria-controls="page-nav"]');
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      await menu.click();
      await page
        .locator("#page-nav")
        .getByRole("link", { name: "The CRM", exact: true })
        .click();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      assert.match(page.url(), /#crm$/);
    }
    await page
      .getByRole("link", { name: "Plan my website + CRM", exact: true })
      .click();
    assert.match(page.url(), /#plan$/);
    const submit = page.getByRole("button", {
      name: "Preview my starting scope",
    });
    await submit.click();
    assert.equal(await page.getByRole("status").count(), 0);
    assert.equal(
      await page.locator("#trade").evaluate((el) => el.validity.valueMissing),
      true,
    );
    await page.locator("#trade").selectOption("HVAC");
    await page.locator("#focus").selectOption("Website + CRM");
    await submit.click();
    assert.match(
      await page.getByRole("status").innerText(),
      /Your local plan: Website \+ CRM/,
    );
    await page.locator("#focus").selectOption("Website first");
    await submit.click();
    assert.match(
      await page.getByRole("status").innerText(),
      /Your local plan: Website first/,
    );
    assert.equal(await page.locator("#trade").inputValue(), "HVAC");
    await page
      .locator("#plan")
      .screenshot({
        path: `${out}/${width}-planner.png`,
        animations: "disabled",
      });
    report.checks.push({ width, interactions: "passed" });
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.mutations, []);
  assert.deepEqual(
    report.widths.flatMap((w) =>
      w.headings
        .filter((h) => h.orphans.length)
        .map((h) => ({ width: w.width, ...h })),
    ),
    [],
    "single-word heading lines",
  );
  writeFileSync(`${out}/qa.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  writeFileSync(`${out}/qa.json`, JSON.stringify(report, null, 2));
}
