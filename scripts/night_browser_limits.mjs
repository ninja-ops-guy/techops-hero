// Playwright library (not Playwright Test) launch policy for acceptance scripts.
// Apply finite defaults to every browser context so a broken player path yields
// a failure screenshot/report instead of an unbounded wait. No game code changes.
import { chromium, firefox, webkit } from 'playwright';
for (const engine of [chromium, firefox, webkit]) {
  const launch = engine.launch.bind(engine);
  engine.launch = async options => {
    const browser = await launch(options);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await newContext(options);
      context.setDefaultTimeout(15000);
      context.setDefaultNavigationTimeout(60000);
      return context;
    };
    return browser;
  };
}
