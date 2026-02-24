import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev:backend',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev:frontend',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
