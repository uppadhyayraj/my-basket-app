import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 30000,
  retries: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
});
