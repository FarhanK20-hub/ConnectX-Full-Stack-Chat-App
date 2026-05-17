import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'cd ../server && npm start',
      port: 5000,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../client && npm run dev',
      port: 5173,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
