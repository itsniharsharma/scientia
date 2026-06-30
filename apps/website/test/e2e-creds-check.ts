/**
 * Credential check: teacher raj@scientia + student reyasharma
 * Runs against http://localhost:5174 (Vite dev server → Render backend)
 */
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';

const BASE = 'http://localhost:5174';
const CHROME =
  'C:\\Users\\itsni\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe';

type Result = { label: string; pass: boolean; detail?: string };
const results: Result[] = [];

function log(label: string, pass: boolean, detail?: string) {
  const icon = pass ? '✓' : '✗';
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
  results.push({ label, pass, detail });
}

async function testTeacherLogin(browser: Browser) {
  console.log('\n══════════════════════════════════════');
  console.log(' TEACHER  raj@scientia / reet32999');
  console.log('══════════════════════════════════════');

  const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page: Page = await ctx.newPage();

  const serverErrors: string[] = [];
  page.on('pageerror', (e) => serverErrors.push(e.message));

  try {
    await page.goto(`${BASE}/teacher/login`, { waitUntil: 'networkidle', timeout: 30_000 });
    log('Login page loaded', (await page.locator('h1').first().textContent())?.includes('sign in') ?? false);

    await page.locator('input[autocomplete="username"]').fill('raj@scientia');
    await page.locator('input[autocomplete="current-password"]').fill('reet32999');
    await page.locator('button[type="submit"]').click();

    // Wait up to 90s for Render cold start
    const result = await Promise.race([
      page.waitForURL(/\/teacher\/tests/, { timeout: 90_000 }).then(() => 'success'),
      page.waitForSelector('[class*="red"]', { timeout: 90_000 }).then(() => 'error'),
    ]);

    if (result === 'success') {
      log('Login succeeded → /teacher/tests', true, page.url());

      await page.waitForSelector('h1', { timeout: 10_000 });
      const h1 = await page.locator('h1').first().textContent();
      log('Dashboard renders', h1?.trim() === 'All Tests', `"${h1}"`);

      const eb = await page.locator('text=Something went wrong').count();
      log('No Error Boundary', eb === 0);

    } else {
      // Login failed — capture the error message shown on screen
      const errorText = await page.locator('[class*="red"]').first().textContent().catch(() => '');
      log('Login succeeded', false, `Server said: "${errorText?.trim()}"`);
    }

    log('No JS page errors', serverErrors.length === 0, serverErrors[0] ?? 'none');
  } catch (e: unknown) {
    log('Unexpected error', false, e instanceof Error ? e.message : String(e));
  } finally {
    await ctx.close();
  }
}

async function testStudentLogin(browser: Browser, createIfMissing: boolean) {
  console.log('\n══════════════════════════════════════');
  console.log(` STUDENT  reyasharma / reya@2727${createIfMissing ? '  (creating account first)' : ''}`);
  console.log('══════════════════════════════════════');

  const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page: Page = await ctx.newPage();

  const serverErrors: string[] = [];
  page.on('pageerror', (e) => serverErrors.push(e.message));

  try {
    await page.goto(`${BASE}/student/login`, { waitUntil: 'networkidle', timeout: 30_000 });
    log('Student login page loaded', (await page.locator('h1').first().textContent())?.includes('back') ?? false);

    await page.locator('input[autocomplete="username"]').fill('reyasharma');
    await page.locator('input[autocomplete="current-password"]').fill('reya@2727');
    await page.locator('button[type="submit"]').click();

    const result = await Promise.race([
      page.waitForURL(/\/student\/dashboard/, { timeout: 90_000 }).then(() => 'success'),
      page.waitForSelector('[class*="red"]', { timeout: 90_000 }).then(() => 'error'),
    ]);

    if (result === 'success') {
      log('Login succeeded → /student/dashboard', true, page.url());

      await page.waitForSelector('h1', { timeout: 10_000 });
      const h1 = await page.locator('h1').first().textContent();
      log('Dashboard renders', !!h1, `"${h1}"`);

      const eb = await page.locator('text=Something went wrong').count();
      log('No Error Boundary', eb === 0);

    } else {
      const errorText = await page.locator('[class*="red"]').first().textContent().catch(() => '');
      log('Login succeeded', false, `Server said: "${errorText?.trim()}"`);

      // Return signal to caller so it can create the account and retry
      await ctx.close();
      return 'need_signup';
    }

    log('No JS page errors', serverErrors.length === 0, serverErrors[0] ?? 'none');
  } catch (e: unknown) {
    log('Unexpected error', false, e instanceof Error ? e.message : String(e));
  } finally {
    await ctx.close().catch(() => {});
  }
  return 'done';
}

async function signupStudent(browser: Browser) {
  console.log('\n  → Account not found. Creating via /signup …');

  const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page: Page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle', timeout: 30_000 });

    // SignupPage has: firstName, lastName, phone, username, password fields
    // Based on the schema: fullName (firstName + lastName), phone, username, password
    await page.locator('input[placeholder*="First"]').fill('Reya');
    await page.locator('input[placeholder*="Last"]').fill('Sharma');
    await page.locator('input[placeholder*="phone"], input[placeholder*="mobile"], input[type="tel"]').fill('9876543210');
    await page.locator('input[placeholder*="username"]').fill('reyasharma');
    await page.locator('input[type="password"]').first().fill('reya@2727');
    await page.locator('button[type="submit"]').click();

    const result = await Promise.race([
      page.waitForURL(/\/student\/dashboard/, { timeout: 90_000 }).then(() => 'success'),
      page.waitForSelector('[class*="red"]', { timeout: 90_000 }).then(() => 'error'),
    ]);

    if (result === 'success') {
      log('Student account created + auto-logged in', true);
      return true;
    } else {
      const errorText = await page.locator('[class*="red"]').first().textContent().catch(() => '');
      log('Signup failed', false, errorText?.trim());
      return false;
    }
  } catch (e: unknown) {
    log('Signup error', false, e instanceof Error ? e.message : String(e));
    return false;
  } finally {
    await ctx.close();
  }
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  try {
    // ── Teacher ──
    await testTeacherLogin(browser);

    // ── Student ──
    let studentResult = await testStudentLogin(browser, false);

    if (studentResult === 'need_signup') {
      const created = await signupStudent(browser);
      if (created) {
        // Re-test login now that account exists
        studentResult = await testStudentLogin(browser, false);
      }
    }

  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log('\n══════════════════════════════════════');
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('FAILURES:');
    results.filter((r) => !r.pass).forEach((r) =>
      console.log(`  ✗ ${r.label}${r.detail ? ': ' + r.detail : ''}`),
    );
    process.exit(1);
  } else {
    console.log('ALL CHECKS PASSED ✓');
  }
}

run();
