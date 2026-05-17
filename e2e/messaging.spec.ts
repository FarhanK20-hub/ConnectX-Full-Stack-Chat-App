import { test, expect, chromium } from '@playwright/test';

test.describe('Messaging E2E', () => {
  let contextA, contextB, pageA, pageB;
  const userA = { name: 'UserA', email: `usera_${Date.now()}@test.com`, password: 'password123' };
  const userB = { name: 'UserB', email: `userb_${Date.now()}@test.com`, password: 'password123' };

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

  test('userA searches for userB and opens a DM conversation', async () => {
    // Click the + button to switch to global search
    const plusButton = pageA.locator('button').filter({ has: pageA.locator('svg') }).nth(2);
    await plusButton.click();

    // Search for userB
    const searchInput = pageA.locator('input[placeholder="Search all users..."]');
    await searchInput.fill(userB.name);

    // Wait for results and click on userB
    await pageA.waitForTimeout(1000);
    await pageA.getByText(userB.name).click();

    // Should see the conversation opened
    await expect(pageA.getByText(userB.name)).toBeVisible({ timeout: 5000 });
  });

  test('userA sends a message → userB sees it', async () => {
    // userA types and sends
    const textarea = pageA.locator('textarea[placeholder="Type a message..."]');
    await textarea.fill('Hello from A!');
    await textarea.press('Enter');

    // userB should see it (open the conversation first)
    await pageB.waitForTimeout(2000);
    // userB clicks on the conversation in sidebar
    const convItem = pageB.getByText(userA.name);
    if (await convItem.isVisible()) {
      await convItem.click();
    }

    await expect(pageB.getByText('Hello from A!')).toBeVisible({ timeout: 10000 });
  });

  test('userB replies → userA sees reply', async () => {
    const textarea = pageB.locator('textarea[placeholder="Type a message..."]');
    await textarea.fill('Reply from B!');
    await textarea.press('Enter');

    await expect(pageA.getByText('Reply from B!')).toBeVisible({ timeout: 10000 });
  });
});
