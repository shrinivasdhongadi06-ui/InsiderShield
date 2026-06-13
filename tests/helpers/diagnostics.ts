import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Captures a full-page screenshot and saves it to the test-results folder.
 */
export async function captureScreenshot(page: Page, name: string): Promise<string> {
  const dir = path.join(process.cwd(), 'test-results', 'diagnostics');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filePath = path.join(dir, `fail_${cleanName}_${Date.now()}.png`);
  
  console.log(`[Diagnostics] Capturing full-page screenshot for "${name}" at: ${filePath}`);
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  } catch (err) {
    console.error(`[Diagnostics] Failed to capture screenshot:`, err);
    return '';
  }
}

/**
 * Logs the current URL of the page.
 */
export async function dumpCurrentURL(page: Page): Promise<string> {
  const url = page.url();
  console.log(`[Diagnostics] Current URL: ${url}`);
  return url;
}

/**
 * Sets up event listeners on the page to collect console errors and failed network requests.
 * Returns helper functions to retrieve and dump these diagnostics.
 */
export async function setupDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error] ${msg.text()} (${msg.location().url}:${msg.location().lineNumber})`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Error] ${err.message}\n${err.stack || ''}`);
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    networkFailures.push(`[Network Failure] ${req.method()} ${req.url()} - Reason: ${failure?.errorText || 'Unknown'}`);
  });

  return {
    getConsoleErrors: () => consoleErrors,
    getNetworkFailures: () => networkFailures,
    dumpDiagnostics: async (testName: string) => {
      console.log(`\n=== DIAGNOSTICS FOR TEST: ${testName} ===`);
      console.log(`Current URL: ${page.url()}`);
      console.log(`--- Console Errors (${consoleErrors.length}) ---`);
      if (consoleErrors.length === 0) console.log('None');
      else consoleErrors.forEach((err) => console.log(err));
      
      console.log(`--- Network Failures (${networkFailures.length}) ---`);
      if (networkFailures.length === 0) console.log('None');
      else networkFailures.forEach((fail) => console.log(fail));
      console.log('========================================\n');
    }
  };
}
