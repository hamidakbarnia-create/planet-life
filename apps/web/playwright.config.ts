import { defineConfig } from '@playwright/test';

const webServer = {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    NEXT_PUBLIC_CHART_TEST: '1',
  },
};

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  webServer,
  projects: [
    {
      name: 'e2e',
      testDir: './e2e',
      use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      testMatch: 'capture.spec.ts',
      use: {
        baseURL: 'http://localhost:3000',
        reducedMotion: 'reduce',
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.005,
        },
      },
      snapshotPathTemplate: '{testDir}/baseline/{arg}{ext}',
    },
    {
      name: 'visual-current',
      testDir: './tests/visual',
      testMatch: 'capture-current.spec.ts',
      use: {
        baseURL: 'http://localhost:3000',
        reducedMotion: 'reduce',
      },
    },
  ],
});
