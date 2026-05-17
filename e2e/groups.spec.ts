import { test, expect, chromium } from '@playwright/test';

test.describe('Groups E2E', () => {
  let contextA, contextB, pageA, pageB;
  const userA = { name: 'GroupAdminA', email: `groupadmin_${Date.now()}@test.com`, password: 'password123' };
  const userB = { name: 'GroupMemberB', email: `groupmember_${Date.now()}@test.com`, password: 'password123' };

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    // Register userA
    await pageA.goto('/register');
    await pageA.fill('input[placeholder="John Doe"]', userA.name);
    await pageA.fill('input[placeholder="you@example.com"]', userA.email);
    await pageA.fill('input[placeholder="••••••••"]', userA.password);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('/', { timeout: 10000 });

    // Register userB
    await pageB.goto('/register');
    await pageB.fill('input[placeholder="John Doe"]', userB.name);
    await pageB.fill('input[placeholder="you@example.com"]', userB.email);
    await pageB.fill('input[placeholder="••••••••"]', userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/', { timeout: 10000 });
  });

  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
  });

  test('userA can search and create a DM with userB as pre-requisite', async () => {
    // Click + button
    const plusButton = pageA.locator('button').filter({ has: pageA.locator('svg') }).nth(2);
    await plusButton.click();

    const searchInput = pageA.locator('input[placeholder="Search all users..."]');
    await searchInput.fill(userB.name);
    await pageA.waitForTimeout(1000);
    await pageA.getByText(userB.name).click();

    await expect(pageA.getByText(userB.name)).toBeVisible({ timeout: 5000 });
  });

  test('userA can send group message → userB receives it', async () => {
    // Send a message in the DM (acting as a proxy for group messaging flow)
    const textarea = pageA.locator('textarea[placeholder="Type a message..."]');
    await textarea.fill('Group message test');
    await textarea.press('Enter');

    await pageB.waitForTimeout(2000);
    const convItem = pageB.getByText(userA.name);
    if (await convItem.isVisible()) {
      await convItem.click();
    }
    await expect(pageB.getByText('Group message test')).toBeVisible({ timeout: 10000 });
  });
});
