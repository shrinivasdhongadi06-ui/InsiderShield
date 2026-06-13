import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login';
import { setupDiagnostics } from '../helpers/diagnostics';
import { safeNavigate } from '../helpers/navigation';

test.describe('System Health Check Tests', () => {
  test('Application loads and administration flow is operational', async ({ page }) => {
    // Setup diagnostics to capture console errors and network requests
    const diagnostics = await setupDiagnostics(page);

    // 1. Verify application loads at root
    console.log('[Health] Verifying application loads at root url...');
    await safeNavigate(page, '/');
    await expect(page).toHaveTitle(/InsiderShield/i);

    // 2. Verify login works and dashboard loads
    console.log('[Health] Running loginAsAdmin helper...');
    await loginAsAdmin(page);

    // 3. Verify navigation works
    console.log('[Health] Navigating to Threat Center page...');
    const threatCenterLink = page.getByRole('link', { name: 'Threat Center' });
    await expect(threatCenterLink).toBeVisible();
    await threatCenterLink.click();
    await page.waitForURL('**/dashboard/threat-center', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Threat Center' })).toBeVisible();

    console.log('[Health] Navigating to Monitored Personnel page...');
    const employeesLink = page.getByRole('link', { name: 'Employees' });
    await expect(employeesLink).toBeVisible();
    await employeesLink.click();
    await page.waitForURL('**/dashboard/employees', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Monitored Personnel' })).toBeVisible();

    // 4. Verify no critical page errors occurred
    const errors = diagnostics.getConsoleErrors();
    const pageErrors = errors.filter(err => err.startsWith('[Page Error]'));
    
    await diagnostics.dumpDiagnostics('system_health_check');

    expect(pageErrors.length).toBe(0);
    console.log('[Health] Health check passed successfully.');
  });
});
