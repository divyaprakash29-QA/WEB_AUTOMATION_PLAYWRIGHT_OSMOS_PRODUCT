import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

// Determine environment
let envName;

if (process.env.TEST_ENV) {
  envName = process.env.TEST_ENV.toLowerCase();
} else {
  const { CONFIG } = await import('../config/config.js');
  envName = CONFIG.environment.toLowerCase();
}

// Map environment to env files
const envMap = {
  dev: () => import('../config/env.dev.js'),
  qa: () => import('../config/env.qa.js'),
  prod: () => import('../config/env.prod.js')
};

// Validate environment
if (!envMap[envName]) {
  throw new Error(`Environment "${envName}" not found. Use dev, qa, or prod`);
}

// Load ENV dynamically
const { ENV } = await envMap[envName]();

export const test = base.extend({
  env: ({}, use) => use(ENV),
  loginPage: async ({ page }, use) => {
    await page.goto(ENV.LOGIN_URL);
    await use(new LoginPage(page));
  }
});

export { expect } from '@playwright/test';
