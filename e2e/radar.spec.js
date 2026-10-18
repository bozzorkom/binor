import { expect, test } from '@playwright/test';

async function mountRadar(page, listings) {
  await page.goto('/');
  await page.evaluate(async (injectedListings) => {
    const { createAppController } = await import('/src/app/controller.js');
    const root = document.createElement('div');
    root.id = 'radar-test';
    document.body.append(root);
    const defaults = await import('/src/data/fixtures.js');
    window.radarController = createAppController(root, {
      ...defaults,
      listings: injectedListings ?? defaults.listings,
    });
    window.radarController.dispatch({ type: 'setActiveTab', tabId: 'radar' });
  }, listings);
  return page.locator('#radar-test');
}

const ids = (app) => app.locator('.radar-signal').evaluateAll((rows) => rows.map((row) => row.dataset.signalId));

test('sale and rent segmented controls filter signals and reset restores results', async ({ page }) => {
  const app = await mountRadar(page);
  const allIds = await ids(app);
  expect(allIds.length).toBeGreaterThan(3);

  await app.getByRole('button', { name: 'Продажа' }).click();
  await expect(app.getByRole('button', { name: 'Продажа' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => ids(app)).toEqual(['signal-001', 'signal-003', 'signal-006', 'signal-005']);

  await app.getByRole('button', { name: 'Аренда' }).click();
  await expect.poll(() => ids(app)).toEqual(['signal-002', 'signal-007', 'signal-004']);
  await app.getByRole('button', { name: 'Сбросить' }).click();
  await expect.poll(() => ids(app)).toEqual(allIds);
});

test('district and selected currency price bounds filter injected fixtures', async ({ page }) => {
  const app = await mountRadar(page);
  const district = app.getByLabel('Район');
  await district.selectOption('Chilonzor');
  await expect.poll(() => ids(app)).toEqual(['signal-001', 'signal-005']);

  await district.selectOption('all');
  await app.getByLabel('Валюта').selectOption('USD');
  await app.getByLabel('Цена от').fill('70000');
  await app.getByLabel('Цена от').press('Tab');
  await app.getByLabel('Цена до').fill('90000');
  await app.getByLabel('Цена до').press('Tab');
  await expect.poll(() => page.evaluate(() => window.radarController.getState().filters)).toMatchObject({ currency: 'USD', minPrice: '70000', maxPrice: '90000' });
  await expect.poll(() => ids(app)).toEqual(['signal-001']);
  await expect(app.locator('.signal-row__price')).toContainText('$');
});

test('filters sheet has accessible recency, source, confidence and sort controls', async ({ page }) => {
  const app = await mountRadar(page);
  await app.getByRole('button', { name: 'Фильтры' }).click();
  const dialog = app.getByRole('dialog', { name: 'Фильтры Radar' });
  await expect(dialog.getByLabel('Период публикации')).toBeVisible();
  await expect(dialog.getByLabel('Источник')).toBeVisible();
  await expect(dialog.getByLabel('Уверенность данных')).toBeVisible();
  await expect(dialog.getByLabel('Сортировка')).toBeVisible();
  await dialog.getByLabel('Период публикации').selectOption('24h');
  await expect.poll(() => ids(app)).toEqual(['signal-001', 'signal-002', 'signal-007', 'signal-003']);
  await app.getByRole('button', { name: 'Закрыть' }).click();
});

test('save is independent of row navigation and persists across tabs', async ({ page }) => {
  const app = await mountRadar(page);
  const row = app.locator('.radar-signal').first();
  const signalId = await row.getAttribute('data-signal-id');
  await row.getByRole('button', { name: 'Сохранить сигнал' }).click();
  await expect.poll(() => page.evaluate(() => window.radarController.getState().savedSignalIds)).toEqual([signalId]);
  await expect(app.getByRole('button', { name: 'Radar', exact: true })).toHaveAttribute('aria-current', 'page');

  await app.getByRole('button', { name: 'CRM' }).click();
  await app.getByRole('button', { name: 'Radar', exact: true }).click();
  const savedRow = app.locator(`.radar-signal[data-signal-id="${signalId}"]`);
  await expect(savedRow.getByRole('button', { name: 'Убрать из сохранённого' })).toHaveAttribute('aria-pressed', 'true');
  await savedRow.getByRole('button', { name: 'Убрать из сохранённого' }).click();
  await expect.poll(() => page.evaluate(() => window.radarController.getState().savedSignalIds)).toEqual([]);
});

test('signal row opens selected detail without nested save action', async ({ page }) => {
  const app = await mountRadar(page);
  const row = app.locator('.radar-signal').first();
  const signalId = await row.getAttribute('data-signal-id');
  await row.getByRole('link', { name: /Открыть сигнал/ }).click();
  await expect.poll(() => page.evaluate(() => window.radarController.getState().selectedSignalId)).toBe(signalId);
  await expect(app.getByRole('heading', { level: 2 })).toBeVisible();
});

test('no-result state offers reset', async ({ page }) => {
  const app = await mountRadar(page);
  const allIds = await ids(app);
  await app.getByLabel('Район').selectOption('Chilonzor');
  await app.getByLabel('Валюта').selectOption('USD');
  await app.getByLabel('Цена до').fill('1');
  await app.getByLabel('Цена до').press('Tab');
  await expect(app.getByRole('status').getByText('Нет сигналов по этим фильтрам')).toBeVisible();
  await app.getByRole('button', { name: 'Сбросить' }).click();
  await expect.poll(() => ids(app)).toEqual(allIds);
});

test('uncertain, stale, duplicate and restricted source states are explicit', async ({ page }) => {
  const app = await mountRadar(page, [
    { id: 'parser', title: 'Parser incomplete', dealType: 'sale', district: 'A', currency: 'USD', price: 10,
      publishedAt: '2026-10-03T00:00:00.000Z', freshness: 'fresh', parseStatus: 'incomplete', confidenceTier: 'low', sourceName: 'Fixture A' },
    { id: 'stale', title: 'Stale item', dealType: 'rent', district: 'B', currency: 'UZS', price: 20,
      publishedAt: '2026-09-20T09:00:00.000Z', capturedAt: '2026-09-20T09:05:00.000Z', freshness: 'stale', status: 'stale', confidenceTier: 'medium', sourceName: 'Fixture B' },
    { id: 'duplicate', title: 'Possible duplicate', dealType: 'sale', district: 'C', currency: 'USD', price: 30,
      publishedAt: '2026-10-02T00:00:00.000Z', freshness: 'recent', status: 'duplicate_candidate', confidenceTier: 'low', sourceName: 'Fixture C' },
    { id: 'restricted', title: 'Restricted source item', dealType: 'rent', district: 'D', currency: 'UZS', price: 40,
      publishedAt: '2026-10-03T00:00:00.000Z', freshness: 'fresh', sourceRestricted: true, confidenceTier: 'medium', sourceName: 'Fixture D' },
  ]);

  await expect(app.getByText('Параметры распознаны не полностью')).toBeVisible();
  await expect(app.getByText('Сигнал устарел')).toBeVisible();
  await expect(app.getByText('Возможный дубль')).toBeVisible();
  await expect(app.getByText('Источник недоступен').first()).toBeVisible();
  await expect(app.getByText(/Последняя публикация/)).toBeVisible();
  await expect(app.getByText(/собственник подтверждён/i)).toHaveCount(0);
  await expect(app.locator('.radar-signal')).toHaveCount(4);
});
