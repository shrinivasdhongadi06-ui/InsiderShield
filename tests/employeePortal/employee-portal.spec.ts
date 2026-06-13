import { test, expect } from '@playwright/test';
import { loginAsEmployee } from '../helpers/login';
import { waitForElement } from '../helpers/navigation';

test.describe('Employee Workstation Portal Tests', () => {
  test('Employee portal login and workspace operations', async ({ page }) => {
    // Log in and unlock workstation using the centralized robust helper
    await loginAsEmployee(page);

    // Verify employee portal dashboard loads
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Verify activity actions (Quick Actions) are visible
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compose Email' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Meeting' })).toBeVisible();

    // Navigate to Files tab to verify upload section
    await page.getByRole('button', { name: 'My Files' }).click();

    // Verify upload section is visible with wait helper
    const uploadHeader = await waitForElement(page, 'h3:has-text("Secure Document Upload Sandbox")');
    await expect(uploadHeader).toBeVisible();
    await expect(page.getByPlaceholder('quarterly_report.pdf')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload Document' })).toBeVisible();
  });
});
