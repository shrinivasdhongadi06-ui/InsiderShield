import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login';
import { waitForElement } from '../helpers/navigation';

test.describe('Threat Center Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/threat-center');
    await page.waitForURL('**/dashboard/threat-center');
  });

  test('Threat center page opens', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Threat Center' })).toBeVisible();
  });

  test('Threat list is visible', async ({ page }) => {
    const table = await waitForElement(page, 'table');
    await expect(table).toBeVisible();
  });

  test('Investigate button is visible on selecting an alert', async ({ page }) => {
    // Wait for the filter buttons to become visible and filter by 'Open' to guarantee 'Investigate' action is valid
    const openFilterBtn = await waitForElement(page, 'button:has-text("Open")');
    await openFilterBtn.click();

    // Check if there are row items in the table
    const tableRows = page.locator('tbody tr');
    
    // Wait for the first row to appear or display 'No incidents'
    const firstRow = tableRows.first();
    await firstRow.waitFor({ state: 'visible', timeout: 5000 });
    const firstRowText = await firstRow.innerText();
    
    if (firstRowText && !firstRowText.includes('No incidents found')) {
      // Click the first row to open the detail drawer
      await firstRow.click();
      
      // The drawer should open and contain an Investigate button
      const investigateButton = page.getByRole('button', { name: 'Investigate', exact: true });
      await expect(investigateButton).toBeVisible();
    } else {
      console.log('[ThreatCenter] No open threats found in the list, skipping row click check');
    }
  });
});
