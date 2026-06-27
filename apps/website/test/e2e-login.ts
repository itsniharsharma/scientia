/**
 * E2E login test — runs against the local Vite dev server (http://localhost:5174)
 * which proxies /api/* to the live Render backend.
 *
 * Usage: npx tsx test/e2e-login.ts
 */

import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5174';
const TEACHER_USER = 'test_e2e';
const TEACHER_PASS = 'Test@12345';

type Step = { label: string; pass: boolean; detail?: string };
const steps: Step[] = [];

function log(label: string, pass: boolean, detail?: string) {
  const icon = pass ? '✓' : '✗';
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
  steps.push({ label, pass, detail });
}

async function run() {
  const browser = await chromium.launch({
    executablePath:
      'C:\\Users\\itsni\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });

  // Use a desktop viewport so the sidebar nav is visible (≥768px = md breakpoint)
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await ctx.newPage();

  // Collect console errors and track 404s
  const consoleErrors: string[] = [];
  const notFoundUrls: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('response', (res) => {
    if (res.status() === 404) notFoundUrls.push(res.url());
  });

  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    console.log('\n── Step 1: Load teacher login page ──');
    await page.goto(`${BASE}/teacher/login`, { waitUntil: 'networkidle', timeout: 30_000 });

    const heading = await page.locator('h1').first().textContent();
    log('Login page loaded', heading?.toLowerCase().includes('sign in') ?? false, `h1="${heading}"`);

    console.log('\n── Step 2: Fill credentials & submit ──');
    await page.locator('input[autocomplete="username"]').fill(TEACHER_USER);
    await page.locator('input[autocomplete="current-password"]').fill(TEACHER_PASS);
    log('Credentials filled', true);

    const navPromise = page.waitForURL(`${BASE}/teacher/tests`, { timeout: 90_000 });
    await page.locator('button[type="submit"]').click();
    log('Form submitted', true);

    console.log('\n── Step 3: Wait for redirect to /teacher/tests ──');
    await navPromise;
    log('Redirected to /teacher/tests', page.url().includes('/teacher/tests'), page.url());

    console.log('\n── Step 4: Verify teacher dashboard ──');
    await page.waitForSelector('h1', { timeout: 15_000 });
    const dashHeading = await page.locator('h1').first().textContent();
    log('Dashboard heading "All Tests"', dashHeading?.trim() === 'All Tests', `"${dashHeading}"`);

    const errorBoundaryCount = await page.locator('text=Something went wrong').count();
    log('Error Boundary did NOT fire', errorBoundaryCount === 0);

    // Sidebar nav should be visible at 1280px desktop viewport
    const sidebarBatchesVisible = await page.locator('aside a[href="/teacher/batches"]').isVisible();
    log('Sidebar nav visible (desktop)', sidebarBatchesVisible);

    // Wait for tests list or empty state — allow up to 15s for API response
    await page.waitForFunction(
      () => document.body.innerText.includes('No tests yet')
        || document.body.innerText.includes('Generate New Test')
        || document.querySelectorAll('[class*="rounded-2xl"]').length > 1,
      { timeout: 15_000 },
    ).catch(() => {});

    const hasTestListContent =
      await page.locator('text=No tests yet').count() > 0 ||
      await page.locator('text=Loading tests').count() > 0 ||
      await page.locator('a[href*="/teacher/tests/"]').count() > 0 ||
      await page.locator('[class*="shadow-sm"]').count() > 1;
    log('Test list or empty-state rendered', hasTestListContent);

    console.log('\n── Step 5: Navigate to Batches ──');
    // Click "Batches" in the desktop sidebar (visible at 1280px)
    await page.locator('aside a[href="/teacher/batches"]').click();
    await page.waitForURL(/\/teacher\/batches/, { timeout: 10_000 });
    log('Batches page loads', page.url().includes('/teacher/batches'), page.url());

    const batchHeading = await page.locator('h1').first().textContent();
    log('Batches heading visible', batchHeading?.trim() === 'Batches', `"${batchHeading}"`);

    const batchErrorBoundary = await page.locator('text=Something went wrong').count();
    log('Error Boundary did NOT fire on Batches', batchErrorBoundary === 0);

    console.log('\n── Step 6: Sign out ──');
    const signOutBtn = page.locator('button', { hasText: 'Sign out' }).first();
    await signOutBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await signOutBtn.click();
    await page.waitForURL(`${BASE}/`, { timeout: 10_000 });
    log('Signed out → home', page.url() === `${BASE}/`, page.url());

    // After sign-out, navigating to /teacher/tests should redirect to login
    await page.goto(`${BASE}/teacher/tests`);
    await page.waitForURL(/teacher\/login/, { timeout: 5_000 });
    log('Protected route redirects after logout', page.url().includes('/teacher/login'), page.url());

    console.log('\n── Step 7: Network & error check ──');
    log('No JS page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join('; ') || 'none');
    log('No 404 resource errors', notFoundUrls.length === 0,
      notFoundUrls.length > 0 ? notFoundUrls.join(', ') : 'none');
    log('No console errors', consoleErrors.length === 0,
      consoleErrors.filter(e => !e.includes('favicon')).slice(0, 3).join('; ') || 'none');

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('Unexpected error', false, msg);
    if (notFoundUrls.length > 0) {
      console.log('  → 404 URLs so far:', notFoundUrls);
    }
  } finally {
    await browser.close();
  }

  const passed = steps.filter((s) => s.pass).length;
  const failed = steps.filter((s) => !s.pass).length;
  console.log(`\n─────────────────────────────────────`);
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('FAILED STEPS:');
    steps.filter((s) => !s.pass).forEach((s) =>
      console.log(`  ✗ ${s.label}${s.detail ? ': ' + s.detail : ''}`),
    );
    process.exit(1);
  } else {
    console.log('ALL CHECKS PASSED ✓');
  }
}

run();
