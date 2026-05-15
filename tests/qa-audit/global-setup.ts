import { request } from '@playwright/test';

/**
 * Global setup: warm up Next.js dev-mode page compilation before tests run.
 * On cold start, Next.js compiles each page on first request. If a test hits
 * an uncompiled page and then navigates away mid-compilation, networkidle can
 * fire prematurely, making login tests flaky. Pre-fetching the pages here
 * ensures they're compiled and cached before any test worker starts.
 */
export default async function globalSetup() {
  const base = process.env.VIVA_BASE_URL || 'https://www.vivacareeracademy.com';
  if (!base.includes('localhost') && !base.includes('127.0.0.1')) return;

  const ctx = await request.newContext({ baseURL: base });
  const pagesToWarm = ['/login', '/internal/login', '/apply', '/student', '/admin', '/api/student-login'];

  await Promise.allSettled(
    pagesToWarm.map((path) => ctx.get(path, { timeout: 30_000 }).catch(() => {}))
  );

  await ctx.dispose();
}
