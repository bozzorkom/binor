import { expect, test } from '@playwright/test';

test('Radar renders injected listings in filtered order and escapes their text', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createAppController } = await import('/src/app/controller.js');
    const root = document.createElement('div');
    document.body.append(root);
    const fixtures = {
      clients: [],
      tasks: [],
      listings: [
        {
          id: 'injected-older', title: 'Injected older listing', dealType: 'sale', district: 'Chilonzor',
          price: 100000, currency: 'USD', publishedAt: '2026-10-01T00:00:00.000Z', confidenceTier: 'medium',
        },
        {
          id: 'injected-newer', title: '<img src=x onerror=alert(1)> injected newer', dealType: 'rent',
          district: 'Yunusobod', price: 500, currency: 'USD', publishedAt: '2026-10-02T00:00:00.000Z',
          confidenceTier: 'high',
        },
      ],
    };
    window.fixtureController = createAppController(root, fixtures);
    window.fixtureRoot = root;
    window.fixtureController.dispatch({ type: 'setActiveTab', tabId: 'radar' });
  });

  const rows = page.locator('body > div .signal-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveAttribute('data-signal-id', 'injected-newer');
  await expect(rows.nth(1)).toHaveAttribute('data-signal-id', 'injected-older');
  await expect(page.locator('body > div .signal-row h3').first()).toHaveText('<img src=x onerror=alert(1)> injected newer');
  await expect(page.locator('body > div .signal-row h3 img')).toHaveCount(0);
  await expect(page.locator('body > div .section-heading span')).toHaveText('2 примеров');

  await page.evaluate(() => {
    window.fixtureController.dispatch({ type: 'setRadarFilters', patch: { district: 'Chilonzor' } });
  });
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-signal-id', 'injected-older');
  await expect(page.locator('body > div .section-heading span')).toHaveText('1 примеров');
});
