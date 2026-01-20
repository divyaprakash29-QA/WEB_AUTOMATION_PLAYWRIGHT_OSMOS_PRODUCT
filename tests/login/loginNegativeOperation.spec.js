import { test, expect } from '../../fixtures/baseFixture.js';

test.describe('Login - Negative Scenarios', () => {
  test('TC_01: Click Sign In without entering credentials', async ({ loginPage }) => {
    await loginPage.clickSignIn();
    await expect(loginPage.emailRequiredMsg).toBeVisible();
    await expect(loginPage.passwordRequiredMsg).toBeVisible();
  });

  test('TC_02: Invalid email format', async ({ loginPage }) => {
    await loginPage.login('divyaprakash.singh', 'Qwerty@123');
    await expect(loginPage.invalidEmailMsg).toBeVisible();
  });
});
