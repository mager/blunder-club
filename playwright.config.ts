import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.e2e.ts', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5176', channel: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? undefined : 'chrome', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }, viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure' },
});
