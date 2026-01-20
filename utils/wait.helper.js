export class WaitHelper {
  static async waitForElement(page, selector, timeout = 30000) {
    await page.waitForSelector(selector, { timeout });
  }

  static async waitForVisible(page, selector, timeout = 30000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  static async waitForHidden(page, selector, timeout = 30000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  static async waitForTimeout(milliseconds) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  static async waitForNavigation(page, timeout = 30000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async waitForURL(page, urlPattern, timeout = 30000) {
    await page.waitForURL(urlPattern, { timeout });
  }

  static async waitForCondition(condition, timeout = 30000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.waitForTimeout(interval);
    }
    throw new Error('Condition not met within timeout');
  }
}
