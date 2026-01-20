import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  // Global test timeout
  timeout: 30 * 1000,

  // Expect assertion timeout
  expect: {
    timeout: 5000
  },

  // Retry failed tests (normal mode)
//   retries: 1,

  // Parallel execution
//   workers: 1,

  // ✅ Reports: HTML + Allure
  reporter: [
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }]
  ],

  // ✅ Shared test settings
  use: {
    // Base URL (optional .env)
    baseURL: process.env.BASE_URL,

    // Capture artifacts only on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser settings
    viewport: { width: 1280, height: 720 },
    headless: true
  },

  // ✅ Browser configuration (Chrome & Edge only)
  projects: [
    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      }
    },
    // {
    //   name: 'Edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge'
    //   }
    // }
  ]
});
