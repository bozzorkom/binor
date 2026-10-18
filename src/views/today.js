import { selectFilteredSignals } from '../state/app-state.js';
import { renderSignalRow } from '../components/signal-row.js';
import { escapeHtml } from '../utils/escape-html.js';

const freshSignals = (state, fixtures) => selectFilteredSignals(state, fixtures.listings ?? [])
  .filter((signal) => signal.freshness === 'fresh')
  .slice(0, 3);

function renderTasks(state, fixtures) {
  const tasks = (state.tasks ?? []).filter((task) => ['active', 'open', 'pending'].includes(task.status)).slice(0, 3);
  if (!tasks.length) return '<p class="today-empty">Нет задач на сегодня</p>';
  return `<div class="today-task-list">${tasks.map((task) => {
    const client = (state.clients ?? []).find(({ id }) => id === task.clientId);
    const signal = (fixtures.listings ?? []).find(({ id }) => id === task.signalId);
    return `
      <button class="today-task" type="button" data-action="set-tab" data-tab="crm" data-task-id="${escapeHtml(task.id)}">
        <span class="today-task__copy">
          <span class="today-task__title">${escapeHtml(task.title ?? 'Связаться с клиентом')}</span>
          <span class="today-task__meta">${escapeHtml(client?.name ?? 'Учебный клиент')} · ${escapeHtml(signal?.district ?? 'Район не указан')}</span>
        </span>
        <span class="today-task__action">Клиент</span>
      </button>
    `;
  }).join('')}</div>`;
}

function formatUpdatedAt(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'время не указано';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function renderToday(state, dispatch, fixtures = { listings: [] }) {
  const locale = state.locale ?? document.documentElement.lang ?? 'ru-RU';
  const signals = freshSignals(state, fixtures);
  const updatedAt = formatUpdatedAt(state.lastUpdatedAt, locale);
  const greetingDate = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const greeting = locale.startsWith('uz') ? 'Xayrli tong' : 'Доброе утро';
  const offline = state.networkState === 'offline';

  return `
    <div class="today-feed">
      <div class="today-context">
        <p class="eyebrow">${locale.startsWith('uz') ? 'Toshkent · ish hududi' : 'Ташкент · рабочее пространство'}</p>
        <button class="today-refresh" type="button" data-action="refresh-today" aria-label="Обновить ленту">
          <i data-lucide="refresh-cw" aria-hidden="true"></i>
        </button>
      </div>
      ${offline ? `<p class="today-offline" role="status"><i data-lucide="wifi-off" aria-hidden="true"></i><span>Офлайн · показаны сохранённые учебные данные. Последнее обновление: ${escapeHtml(updatedAt)}</span></p>` : ''}
      <div class="today-greeting">
        <p class="today-greeting__date">${escapeHtml(greetingDate)}</p>
        <h1>${escapeHtml(greeting)}</h1>
      </div>
      <form class="today-search" data-action="search-today" role="search">
        <i data-lucide="search" aria-hidden="true"></i>
        <input type="search" name="query" aria-label="Поиск по объектам и клиентам" placeholder="Адрес, клиент или запрос" value="${escapeHtml(state.searchQuery ?? '')}" autocomplete="off">
      </form>
      ${state.refreshError ? `
        <div class="today-error" role="alert">
          <span>Не удалось обновить ленту. Ваши данные сохранены.</span>
          <button class="text-button" type="button" data-action="refresh-today">Повторить</button>
        </div>
      ` : ''}
      ${state.loading ? '<div class="today-skeleton" data-loading-skeleton aria-label="Обновление ленты"><span></span><span></span></div>' : ''}
      <section class="today-section" aria-labelledby="today-radar-title">
        <div class="today-section__heading">
          <h2 id="today-radar-title">Новые сигналы Radar</h2>
          <button class="today-all" type="button" data-action="set-tab" data-tab="radar" aria-label="Все сигналы Radar">Все</button>
        </div>
        ${signals.length
    ? `<div class="today-signal-list">${signals.map((signal) => `
      <div class="today-signal">
        <a class="today-signal__link" href="#radar" data-action="select-signal" data-signal-id="${escapeHtml(signal.id)}" aria-label="Открыть сигнал: ${escapeHtml(signal.title ?? 'объявление')}">
          ${renderSignalRow(signal, state.savedSignalIds.includes(signal.id), { showSave: false })}
        </a>
        <button class="icon-button signal-row__save today-signal__save" type="button" data-action="toggle-save"
          data-signal-id="${escapeHtml(signal.id)}" aria-label="${state.savedSignalIds.includes(signal.id) ? 'Убрать из сохранённого' : 'Сохранить сигнал'}"
          aria-pressed="${state.savedSignalIds.includes(signal.id)}">
          <i data-lucide="bookmark" aria-hidden="true"></i>
        </button>
      </div>`).join('')}</div>`
    : '<p class="today-empty">Новых сигналов пока нет</p>'}
      </section>
      <section class="today-section" aria-labelledby="today-followups-title">
        <div class="today-section__heading">
          <h2 id="today-followups-title">Ответить</h2>
          <button class="today-all" type="button" data-action="set-tab" data-tab="crm" aria-label="Все задачи CRM">Все</button>
        </div>
        ${renderTasks(state, fixtures)}
      </section>
      <section class="today-section today-section--showing" aria-labelledby="today-showing-title">
        <div class="today-section__heading">
          <h2 id="today-showing-title">Ближайший показ</h2>
          <span class="today-showing__label">Учебный пример</span>
        </div>
        <div class="today-showing" data-showing>
          <span class="today-showing__time">16:30</span>
          <span class="today-showing__details"><strong>Учебный объект · Чиланзар</strong><span>Учебный клиент 01 · Сегодня</span></span>
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </div>
      </section>
      <p class="today-updated">${offline ? 'Последнее обновление' : 'Обновлено'} · ${escapeHtml(updatedAt)}</p>
    </div>
  `;
}
