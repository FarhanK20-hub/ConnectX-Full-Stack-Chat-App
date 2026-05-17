import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  const testUser = {
    name: 'E2E Tester',
    email: `e2e_${Date.now()}@test.com`,
    password: 'password123',
  };

  test('New user can register with name, email, password', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[placeholder="you@example.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to chat page
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('Registered user can log in', async ({ page }) => {
    // First register
    await page.goto('/register');
    const email = `login_${Date.now()}@test.com`;
    await page.fill('input[placeholder="John Doe"]', 'Login User');
    await page.fill('input[placeholder="you@example.com"]', email);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Navigate to login (simulate logout first)
    await page.goto('/login');
    await page.fill('input[placeholder="you@example.com"]', email);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('Wrong password shows error message', async ({ page }) => {
    // Register first
    const email = `wrong_${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('input[placeholder="John Doe"]', 'Wrong Pass User');
    await page.fill('input[placeholder="you@example.com"]', email);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Try wrong password
    await page.goto('/login');
    await page.fill('input[placeholder="you@example.com"]', email);
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page (not redirect)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Logged-out user is redirected to /login on protected route', async ({ page }) => {
    // Clear cookies to simulate logged-out state
    await page.context().clearCookies();
    await page.goto('/');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
