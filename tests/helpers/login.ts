import { Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';
import { safeNavigate, waitForElement, waitForNetworkIdle } from './navigation';
import { captureScreenshot, dumpCurrentURL, setupDiagnostics } from './diagnostics';

/**
 * Robustly log in as Admin. Utilizes data-testid selectors, retry logic, URL checks, 
 * page-content validations, and automatic diagnostics reporting on failure.
 */
export async function loginAsAdmin(page: Page, maxRetries = 2) {
  const diagnostics = await setupDiagnostics(page);
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      console.log(`[Login] Admin login attempt ${attempt + 1} of ${maxRetries + 1}`);
      
      // Navigate to main login route
      await safeNavigate(page, '/');
      
      // Wait for login fields and submit button
      const emailInput = await waitForElement(page, SELECTORS.admin.emailInput);
      const passwordInput = await waitForElement(page, SELECTORS.admin.passwordInput);
      const submitBtn = await waitForElement(page, SELECTORS.admin.submitButton);

      // Fill values cleanly
      await emailInput.fill('admin@insidershield.local');
      await passwordInput.fill('password123');

      // Click Authenticate
      console.log('[Login] Clicking Authenticate button');
      await submitBtn.click();
      
      // Wait for navigation change
      console.log('[Login] Waiting for navigation change to dashboard...');
      await page.waitForURL((url) => url.pathname.endsWith('/dashboard'), { timeout: 15000 });
      
      // Ensure page fully settles
      await waitForNetworkIdle(page, 5000);

      // Verify dashboard content is visible
      const heading = page.getByRole('heading', { name: 'Security Operations Center' });
      await heading.waitFor({ state: 'visible', timeout: 10000 });

      console.log('[Login] Admin login successfully completed and verified.');
      return;
    } catch (err: any) {
      attempt++;
      console.error(`[Login] Admin login attempt ${attempt} failed: ${err.message}`);
      await dumpCurrentURL(page);
      await diagnostics.dumpDiagnostics(`admin_login_attempt_${attempt}`);
      await captureScreenshot(page, `admin_login_fail_attempt_${attempt}`);
      
      if (attempt > maxRetries) {
        throw new Error(`Admin login failed after ${maxRetries + 1} attempts. Final Error: ${err.message}`);
      }
      
      // Cooldown wait before retrying
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Robustly log in as an Employee to the Workstation Portal.
 */
export async function loginAsEmployee(page: Page, maxRetries = 2) {
  const diagnostics = await setupDiagnostics(page);
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      console.log(`[Login] Employee login attempt ${attempt + 1} of ${maxRetries + 1}`);
      
      // Navigate to employee login page
      await safeNavigate(page, '/employee/login');
      
      // Wait for select identity dropdown
      const selectLocator = await waitForElement(page, SELECTORS.employee.selectDropdown);
      
      // Ensure option elements have loaded from the database API
      console.log('[Login] Waiting for employee identity options to load...');
      await page.waitForFunction((selectSel) => {
        const selectEl = document.querySelector(selectSel) as HTMLSelectElement;
        return selectEl && selectEl.options.length > 0;
      }, SELECTORS.employee.selectDropdown, { timeout: 10000 });

      // Select first employee option
      await selectLocator.selectOption({ index: 0 });

      // Click login button
      const loginBtn = await waitForElement(page, SELECTORS.employee.loginButton);
      await loginBtn.click();

      // Wait for redirection to the dashboard
      console.log('[Login] Waiting for employee dashboard redirection...');
      await page.waitForURL((url) => url.pathname.endsWith('/employee/dashboard'), { timeout: 15000 });

      // Check if unlock screen is shown, and click it
      console.log('[Login] Finding unlock workstation lock button...');
      const unlockBtn = await waitForElement(page, SELECTORS.workstation.unlockButton, 10000);
      await unlockBtn.click();

      // Verify portal dashboard page content loaded successfully
      const welcomeMsg = page.getByText('Welcome Back');
      await welcomeMsg.waitFor({ state: 'visible', timeout: 10000 });

      console.log('[Login] Employee login and workstation unlock successfully verified.');
      return;
    } catch (err: any) {
      attempt++;
      console.error(`[Login] Employee login attempt ${attempt} failed: ${err.message}`);
      await dumpCurrentURL(page);
      await diagnostics.dumpDiagnostics(`employee_login_attempt_${attempt}`);
      await captureScreenshot(page, `employee_login_fail_attempt_${attempt}`);
      
      if (attempt > maxRetries) {
        throw new Error(`Employee login failed after ${maxRetries + 1} attempts. Final Error: ${err.message}`);
      }
      
      // Cooldown wait before retrying
      await page.waitForTimeout(1000);
    }
  }
}
