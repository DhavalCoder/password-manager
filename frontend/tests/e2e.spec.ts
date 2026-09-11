import { test, expect } from '@playwright/test';

test.describe('VaultGuru Full Site DOM Tests', () => {
  const BASE_URL = 'https://frontend-kappa-six-62.vercel.app';

  test('should successfully load the login page and authenticate as admin', async ({ page }) => {
    // 1. Navigate to the live site
    await page.goto(BASE_URL);

    // 2. Verify we are on the login page by checking DOM elements
    await expect(page.locator('h1')).toHaveText(/SECURITY/i);
    await expect(page.getByPlaceholder(/architect@domain\.com/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 3. Interact with the DOM to type credentials
    await page.getByPlaceholder(/architect@domain\.com/i).fill('admin@passwordmanager.com');
    await page.locator('input[type="password"]').fill('Admin@123!');

    // 4. Submit the form
    await page.getByRole('button', { name: /Awaken Agent/i }).click();

    // 5. Wait for the URL to change to the dashboard (or for dashboard elements to appear)
    await expect(page.getByRole('button', { name: /Initialize Entity|New/i }).first()).toBeVisible({ timeout: 10000 });

    // 6. Verify some backend data loaded into the DOM
    const mainArea = page.locator('main');
    await expect(mainArea).toBeVisible();
  });

  test('should reject invalid credentials and show error toast', async ({ page }) => {
    await page.goto(BASE_URL);

    // Type wrong password
    await page.getByPlaceholder(/architect@domain\.com/i).fill('admin@passwordmanager.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.getByRole('button', { name: /Awaken Agent/i }).click();

    // Check for error message in the DOM
    await expect(page.getByText(/invalid|incorrect|error/i).first()).toBeVisible({ timeout: 5000 });
  });
});

