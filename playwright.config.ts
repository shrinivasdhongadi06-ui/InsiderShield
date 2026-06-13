import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration optimized for stability and diagnostics.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 60000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on failure */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3000',

    /* Maximum time each action (click, type, etc.) can take */
    actionTimeout: 15000,

    /* Maximum time navigation (goto, waitForURL) can take */
    navigationTimeout: 20000,

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Capture video on failure */
    video: 'retain-on-failure',

    /* Collect trace when tests fail. */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox']
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'browser.tabs.remote.autostart': false,
            'dom.ipc.processCount': 1
          }
        }
      },
    },
  ],
});
