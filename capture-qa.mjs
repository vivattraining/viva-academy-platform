/**
 * QA Screenshot Capture — verifies fixes for issues 1, 2, 3, 6, 7
 * Run: node capture-qa.mjs
 * Output: ./qa-screenshots/
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = "./qa-screenshots";
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, clip) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, clip, fullPage: !clip });
  console.log(`  ✓  ${file}`);
}

async function scrollTo(page, selector) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "start" });
  }, selector);
  await new Promise((r) => setTimeout(r, 400));
}

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: null,
});

try {
  // ─── Issue 1: Navbar single line at 14" laptop (1093×768) ──────────────────
  console.log("\n[Issue 1] Navbar at 1093px (14″ laptop @ 100% zoom, 125% DPI)");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1093, height: 768 });
    await page.goto(BASE, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const nav = await page.$("nav");
    const box = await nav.boundingBox();
    await shot(page, "01-navbar-1093px", {
      x: 0, y: 0, width: 1093, height: Math.ceil(box.height + box.y + 2),
    });
    // Also capture at mobile (390px) to show hamburger menu
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));
    const navMob = await page.$("nav");
    const boxMob = await navMob.boundingBox();
    await shot(page, "01-navbar-390px-closed", {
      x: 0, y: 0, width: 390, height: Math.ceil(boxMob.height + boxMob.y + 4),
    });
    // Open the hamburger menu
    const hamburger = await page.$("button[aria-label='Open menu']");
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 400));
      await shot(page, "01-navbar-390px-menu-open", { x: 0, y: 0, width: 390, height: 600 });
    }
    await page.close();
  }

  // ─── Issue 2: Programs grid — duration/format/cohort/fee rows ──────────────
  console.log("\n[Issue 2] Programs grid — meta rows");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle2" });
    await scrollTo(page, "#programs");
    await shot(page, "02-programs-desktop", null);
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle2" });
    await scrollTo(page, "#programs");
    await shot(page, "02-programs-mobile", null);
    await page.close();
  }

  // ─── Issue 3: Faculty section ───────────────────────────────────────────────
  console.log("\n[Issue 3] Faculty section UI");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle2" });
    await scrollTo(page, "#faculty");
    await shot(page, "03-faculty-desktop", null);
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle2" });
    await scrollTo(page, "#faculty");
    await shot(page, "03-faculty-mobile", null);
    await page.close();
  }

  // ─── Issue 6: Registration form — button disabled after stage 1 ─────────────
  console.log("\n[Issue 6] Registration form — stage 1 button state");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/apply`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await shot(page, "06-apply-initial", null);
    // Fill stage 1 fields if visible
    const nameInput = await page.$("input[name='full_name'], input[placeholder*='name' i], input[type='text']");
    if (nameInput) {
      await nameInput.type("Test User");
      await new Promise((r) => setTimeout(r, 300));
    }
    const emailInput = await page.$("input[type='email']");
    if (emailInput) {
      await emailInput.type("test@example.com");
      await new Promise((r) => setTimeout(r, 300));
    }
    // Find and click the stage 1 submit button
    const submitBtn = await page.$("button[type='submit'], button.button-primary");
    if (submitBtn) {
      const isDisabled = await page.$eval(
        "button[type='submit'], button.button-primary",
        (el) => el.disabled
      );
      console.log(`  Submit button disabled before fill: ${isDisabled}`);
      await submitBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      await shot(page, "06-apply-after-stage1", null);
      // Check if button is now disabled
      const btnAfter = await page.$("button[type='submit'], button.button-primary");
      if (btnAfter) {
        const disabledAfter = await btnAfter.evaluate((el) => el.disabled);
        console.log(`  Submit button disabled after stage 1: ${disabledAfter}`);
      }
    }
    await page.close();
  }

  // ─── Issue 7: Footer — no huge whitespace ────────────────────────────────────
  console.log("\n[Issue 7] Footer spacing");
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle2" });
    // Scroll to near bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 500));
    await shot(page, "07-footer-desktop", null);
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle2" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 500));
    await shot(page, "07-footer-mobile", null);
    await page.close();
  }

  console.log(`\n✅  All screenshots saved to ${path.resolve(OUT)}\n`);
} finally {
  await browser.close();
}
