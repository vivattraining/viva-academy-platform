import puppeteer from "puppeteer";
import fs from "fs";

const BASE = "http://localhost:3000";
const OUT  = "./qa-screenshots/login-tests";
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

const ROLES = [
  { role: "admin",      email: process.env.DEMO_ADMIN_EMAIL,   password: process.env.DEMO_ADMIN_PASSWORD,   loginPage: "/internal/login", dashboard: "/admin"      },
  { role: "operations", email: process.env.DEMO_OPS_EMAIL,     password: process.env.DEMO_OPS_PASSWORD,     loginPage: "/internal/login", dashboard: "/operations" },
  { role: "trainer",    email: process.env.DEMO_TRAINER_EMAIL, password: process.env.DEMO_TRAINER_PASSWORD, loginPage: "/internal/login", dashboard: "/trainer"    },
  { role: "student",    email: process.env.DEMO_STUDENT_EMAIL, password: process.env.DEMO_STUDENT_PASSWORD, loginPage: "/login",          dashboard: "/student"    },
];

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox"],
  defaultViewport: { width: 1440, height: 900 },
});

for (const { role, email, password, loginPage, dashboard } of ROLES) {
  console.log(`\n── ${role.toUpperCase()} ──`);
  // Use a fresh incognito context so each role starts with no cookies/storage
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Go to login page
  await page.goto(`${BASE}${loginPage}`, { waitUntil: "networkidle2" });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/${role}-1-login-page.png` });

  // Fill credentials
  await page.$eval("input[type='email']", el => el.value = "");
  await page.type("input[type='email']", email, { delay: 40 });
  await page.type("input[type='password']", password, { delay: 40 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${role}-2-credentials-filled.png` });

  // Submit
  const submitBtn = await page.$("button[type='submit']") || await page.$(".button-primary");
  if (submitBtn) await submitBtn.click();
  else await page.keyboard.press("Enter");

  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 }).catch(() => {});
  await sleep(1200);
  console.log(`  Landed: ${page.url()}`);
  await page.screenshot({ path: `${OUT}/${role}-3-dashboard.png` });

  // Scroll to show user name / session info
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: `${OUT}/${role}-4-top-of-dashboard.png` });

  // Check for logout button
  const logoutBtn = await page.$("button::-p-text(Sign out), button::-p-text(Logout), button::-p-text(Log out)");
  console.log(`  Logout button found: ${!!logoutBtn}`);
  if (logoutBtn) {
    const box = await logoutBtn.boundingBox();
    if (box) {
      await page.evaluate((b) => {
        window.scrollTo(0, b.y - 200);
      }, box);
      await sleep(400);
      await page.screenshot({ path: `${OUT}/${role}-5-logout-visible.png` });
    }
  }

  await page.close();
  await ctx.close();
  console.log(`  ✓ Screenshots saved for ${role}`);
}

await browser.close();
console.log(`\n✅  All login tests complete → ${OUT}`);
