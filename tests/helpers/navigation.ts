import { Page, Locator } from '@playwright/test';

/**
 * Safely navigates to a URL, waiting for DOM content to load, with custom timeouts.
 */
export async function safeNavigate(page: Page, url: string, timeout = 15000) {
  console.log(`[Navigation] Navigating to URL: ${url}`);
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });
    console.log(`[Navigation] Successfully loaded: ${url} (Status: ${response?.status() ?? 'N/A'})`);
    return response;
  } catch (err) {
    console.error(`[Navigation] Error navigating to: ${url}`, err);
    throw err;
  }
}

/**
 * Waits for a selector or locator to become visible, ensuring element existence.
 */
export async function waitForElement(page: Page, selectorOrLocator: string | Locator, timeout = 10000): Promise<Locator> {
  const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  } catch (err) {
    console.error(`[Navigation] Timeout waiting for element visibility:`, selectorOrLocator);
    throw err;
  }
}

/**
 * Helper to wait for the page load state or network idle to prevent race conditions.
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (err) {
    console.log(`[Navigation] Warning: networkidle wait timed out, proceeding anyway.`);
  }
}
