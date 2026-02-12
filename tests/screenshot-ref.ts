import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://revehit.com/project/refer_kumc/code-cms/index.jsp', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/ref-login-screenshot.png', fullPage: true });
  console.log('Reference screenshot saved to tests/ref-login-screenshot.png');
  await browser.close();
})();
