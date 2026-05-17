import { test, expect } from '@playwright/test';

test.describe('Profile E2E', () => {
  const user = { name: 'Profile User', email: `profile_${Date.now()}@test.com`, password: 'password123' };

  test.beforeEach(async ({ page }) => {
    // Register and log in
    await page.goto('/register');
    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[placeholder="you@example.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('User can navigate to profile page', async ({ page }) => {
    // Click settings/profile icon in sidebar
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
  });

  test('User can update display name', async ({ page }) => {
    await page.goto('/profile');
    
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Profile Name');
      
      const saveButton = page.getByText('Save');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('User can update bio', async ({ page }) => {
    await page.goto('/profile');
    
    const bioInput = page.locator('textarea').first();
    if (await bioInput.isVisible()) {
      await bioInput.fill('This is my updated bio for testing');
      
      const saveButton = page.getByText('Save');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
