import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login';

test.describe('Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin and navigate to Dashboard
    await loginAsAdmin(page);
  });

  test('Dashboard loads successfully', async ({ page }) => {
    // Assert heading presence
    await expect(page.getByRole('heading', { name: 'Security Operations Center' })).toBeVisible();
  });

  test('KPI cards are visible', async ({ page }) => {
    // Verify visibility of all KPI cards
    await expect(page.getByText('Active Employees')).toBeVisible();
    await expect(page.getByText('Threats Detected')).toBeVisible();
    await expect(page.getByText('Avg Trust Score')).toBeVisible();
    await expect(page.getByText('Isolated Sessions')).toBeVisible();
  });

  test('Activity feed is visible', async ({ page }) => {
    // Verify Live Activity Stream heading is visible
    await expect(page.getByRole('heading', { name: 'Live Activity Stream' })).toBeVisible();
  });

  test('Threat center link is visible', async ({ page }) => {
    // Verify that the Threat Center sidebar/navigation link is visible
    const link = page.getByRole('link', { name: 'Threat Center' });
    await expect(link).toBeVisible();
  });
});
