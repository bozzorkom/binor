import { expect, test } from '@playwright/test';

async function mountController(page, fixtures = null) {
  await page.goto('/');
  await page.evaluate(async (injectedFixtures) => {
    const { createAppController } = await import('/src/app/controller.js');
    const root = document.createElement('div');
    root.id = 'today-test';
    document.body.append(root);
    const defaults = await import('/src/data/fixtures.js');
    window.todayController = createAppController(root, injectedFixtures ?? defaults);
  }, fixtures);
  return page.locator('#today-test');
}

test('Today prioritizes Radar signals, follow-ups and the next showing', async ({ page }) => {
  const app = await mountController(page);

  await expect(app.getByRole('heading', { level: 1, name: 'Сегодня' })).toBeVisible();
  await expect(app.getByRole('searchbox', { name: 'Поиск по объектам и клиентам' })).toBeVisible();
  await expect(app.getByRole('heading', { level: 2, name: 'Новые сигналы Radar' })).toBeVisible();
  await expect(app.locator('.today-signal')).toHaveCount(3);
  await expect(app.getByRole('heading', { level: 2, name: 'Ответить' })).toBeVisible();
  await expect(app.locator('[data-task-id]')).toHaveCount(2);
  await expect(app.getByRole('heading', { level: 2, name: 'Ближайший показ' })).toBeVisible();
  await expect(app.locator('[data-showing]')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Обновить ленту' })).toBeVisible();
  await app.getByRole('button', { name: 'Быстрое действие' }).click();
  await expect(app.getByRole('dialog')).toBeVisible();
  await app.getByRole('button', { name: 'Закрыть' }).click();
});

test('first-run Today gives actionable empty states when there are no signals or tasks', async ({ page }) => {
  const app = await mountController(page, { listings: [], clients: [], tasks: [] });

  await expect(app.getByText('Новых сигналов пока нет')).toBeVisible();
  await expect(app.getByText('Нет задач на сегодня')).toBeVisible();
  await expect(app.locator('[data-task-id]')).toHaveCount(0);
  await expect(app.getByRole('button', { name: 'Все сигналы Radar' })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Все задачи CRM' })).toBeVisible();
});

test('Today signal is keyboard operable, opens selected detail, returns to Radar, and saves independently', async ({ page }) => {
  const app = await mountController(page);

  await app.getByRole('button', { name: 'Все сигналы Radar' }).click();
  await expect(app.getByRole('button', { name: 'Radar', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.evaluate(() => window.todayController.dispatch({ type: 'setActiveTab', tabId: 'today' }));
  const signalLink = app.getByRole('link', { name: 'Открыть сигнал: 2-комнатная квартира, учебный пример' });
  const controlsAreSiblings = await app.locator('.today-signal').first().evaluate((row) => (
    row.querySelector(':scope > a.today-signal__link') !== null
    && row.querySelector(':scope > button.today-signal__save') !== null
    && row.querySelector('a button') === null
  ));
  expect(controlsAreSiblings).toBe(true);
  await app.getByRole('button', { name: 'Все сигналы Radar' }).focus();
  await page.keyboard.press('Tab');
  await expect(signalLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(app.getByRole('button', { name: 'Radar', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => window.todayController.getState().selectedSignalId)).toBe('signal-001');
  await expect(app.getByRole('heading', { name: '2-комнатная квартира, учебный пример' })).toBeVisible();
  await expect(app.getByText('Учебный сигнал')).toBeVisible();
  await expect(app.getByText('Учебный канал «BINOR / Ташкент 01»')).toBeVisible();

  await app.getByRole('button', { name: 'Назад к Radar' }).click();
  await expect(app.getByRole('heading', { name: 'Новые сигналы' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.todayController.getState().selectedSignalId)).toBeNull();

  await page.evaluate(() => window.todayController.dispatch({ type: 'setActiveTab', tabId: 'today' }));
  const saveButton = app.getByRole('button', { name: 'Сохранить сигнал' }).first();
  await saveButton.click();
  await expect.poll(() => page.evaluate(() => window.todayController.getState().savedSignalIds)).toEqual(['signal-001']);
  await expect(app.getByRole('button', { name: 'Убрать из сохранённого' }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(app.getByRole('button', { name: 'Сегодня' })).toHaveAttribute('aria-current', 'page');

  await app.getByRole('button', { name: 'Все задачи CRM' }).click();
  await expect(app.getByRole('button', { name: 'CRM' })).toHaveAttribute('aria-current', 'page');
});

test('search stays local and refresh shows loading before returning the same fixtures', async ({ page }) => {
  const app = await mountController(page);
  const search = app.getByRole('searchbox', { name: 'Поиск по объектам и клиентам' });
  await search.fill('Чиланзар учебный');
  await search.press('Enter');
  await expect.poll(() => page.evaluate(() => window.todayController.getState().searchQuery)).toBe('Чиланзар учебный');
  await expect(app.getByRole('button', { name: 'Сегодня' })).toHaveAttribute('aria-current', 'page');

  await app.getByRole('button', { name: 'Обновить ленту' }).click();
  await expect(app.locator('[data-loading-skeleton]')).toBeVisible();
  await expect(app.getByText('Обновлено')).toBeVisible({ timeout: 3000 });
  await expect(search).toHaveValue('Чиланзар учебный');
  await expect(app.locator('.today-signal')).toHaveCount(3);
});

test('offline feed is labeled as cached and retry recovers without losing search', async ({ page, context }) => {
  const app = await mountController(page);
  const search = app.getByRole('searchbox', { name: 'Поиск по объектам и клиентам' });
  await search.fill('Юнусабад');
  await search.press('Enter');
  await context.setOffline(true);
  await expect(app.getByRole('status').getByText(/Офлайн/)).toBeVisible();
  await expect(app.locator('.today-offline').getByText(/Последнее обновление/)).toBeVisible();

  await app.getByRole('button', { name: 'Обновить ленту' }).click();
  await expect(app.getByRole('alert').getByText(/Не удалось обновить/)).toBeVisible();
  await context.setOffline(false);
  await app.getByRole('button', { name: 'Повторить' }).click();

  await expect(app.getByRole('alert')).toHaveCount(0);
  await expect(search).toHaveValue('Юнусабад');
  await expect(app.locator('.today-signal')).toHaveCount(3);
  await expect(app.getByRole('status').getByText(/Офлайн/)).toHaveCount(0);
});

test('Today fits 360px without horizontal overflow or covering the bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const app = await mountController(page, {
    listings: [{
      id: 'uzbek-signal', title: 'Chilonzor tumanidagi xonadon bo‘yicha o‘quv e’loni', freshness: 'fresh',
      price: 680000000, currency: 'UZS', district: 'Chilonzor', areaM2: 91,
      publishedAt: '2026-10-03T06:20:00.000Z', confidenceTier: 'high', sourceName: 'Учебный канал',
    }],
    clients: [],
    tasks: [],
  });

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top,
    refreshBottom: document.querySelector('[data-action="refresh-today"]').getBoundingClientRect().bottom,
    searchBottom: document.querySelector('.today-search').getBoundingClientRect().bottom,
  }));
  expect(dimensions.documentWidth).toBe(dimensions.viewportWidth);
  expect(dimensions.refreshBottom).toBeLessThanOrEqual(dimensions.navTop);
  expect(dimensions.searchBottom).toBeLessThanOrEqual(dimensions.navTop);
  await expect(app.getByText('Chilonzor tumanidagi xonadon bo‘yicha o‘quv e’loni')).toBeVisible();
  await expect(app.getByRole('searchbox', { name: 'Поиск по объектам и клиентам' })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Быстрое действие' })).toBeVisible();
  await expect(app.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
});
