import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login';

test.describe('Employee Management UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/employees');
  });

  test('Employee page loads', async ({ page }) => {
    // Verify title/header is visible
    await expect(page.getByRole('heading', { name: 'Monitored Personnel' })).toBeVisible();
  });

  test('Search box exists', async ({ page }) => {
    // Verify search input with correct placeholder is visible
    await expect(page.getByPlaceholder('Search by name, department, role...')).toBeVisible();
  });

  test('Add Employee button exists', async ({ page }) => {
    // Verify the "Add Employee" button is visible
    await expect(page.getByRole('button', { name: 'Add Employee' })).toBeVisible();
  });
});
