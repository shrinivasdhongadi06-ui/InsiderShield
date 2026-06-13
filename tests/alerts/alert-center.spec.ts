import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login';

test.describe('Alert Center Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/threat-center');
  });

  test('Alert page loads successfully', async ({ page }) => {
    // Verify header title "Threat Center" is visible
    await expect(page.getByRole('heading', { name: 'Threat Center' })).toBeVisible();
  });

  test('Alert table exists', async ({ page }) => {
    // Verify that the table and major headers are visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Severity' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Employee' })).toBeVisible();
  });

  test('Alert cards/metrics render', async ({ page }) => {
    // Verify that metrics cards (e.g. Active Threats, Critical Incidents) render correctly
    await expect(page.getByText('Active Threats')).toBeVisible();
    await expect(page.getByText('Critical Incidents')).toBeVisible();
    await expect(page.getByText('Isolated Sessions')).toBeVisible();
  });
});
