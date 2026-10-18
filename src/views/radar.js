import { escapeHtml } from '../utils/escape-html.js';
import { renderSignalRow } from '../components/signal-row.js';

const defaults = {
  dealType: 'all', district: 'all', currency: 'all', minPrice: '', maxPrice: '',
  recency: 'all', source: 'all', confidenceTier: 'all', sortBy: 'newest',
};

function renderSelect(label, name, value, options) {
  return `<label class="radar-filter"><span>${label}</span><select aria-label="${label}" data-action="set-radar-filter" data-filter="${name}">
    ${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${value === optionValue ? ' selected' : ''}>${escapeHtml(optionLabel)}</option>`).join('')}
  </select></label>`;
}

function renderPriceInput(label, name, value) {
  return `<label class="radar-filter radar-filter--price"><span>${label}</span><input type="number" inputmode="numeric" min="0" step="1" aria-label="${label}" data-action="set-radar-filter" data-filter="${name}" value="${escapeHtml(value)}"></label>`;
}

function renderSheet(state, sources) {
  if (state.sheet?.kind !== 'radar-filters') return '';
  const filters = state.filters;
  return `<div class="sheet-backdrop" data-sheet-backdrop><section class="bottom-sheet radar-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="radar-filter-title" data-sheet>
    <div class="bottom-sheet__handle" aria-hidden="true"></div><header class="bottom-sheet__header"><h2 id="radar-filter-title">Фильтры Radar</h2>
    <button class="icon-button" type="button" data-action="close-sheet" aria-label="Закрыть"><i data-lucide="x" aria-hidden="true"></i></button></header>
    <div class="radar-filter-sheet__fields">
      ${renderSelect('Период публикации', 'recency', filters.recency, [['all', 'Любое время'], ['24h', 'За 24 часа'], ['7d', 'За 7 дней'], ['30d', 'За 30 дней']])}
      ${renderSelect('Источник', 'source', filters.source, [['all', 'Все источники'], ...sources.map((source) => [source, source])])}
      ${renderSelect('Уверенность данных', 'confidenceTier', filters.confidenceTier, [['all', 'Любая'], ['high', 'Высокая'], ['medium', 'Средняя'], ['low', 'Низкая']])}
      ${renderSelect('Сортировка', 'sortBy', filters.sortBy, [['newest', 'Сначала новые'], ['relevance', 'По уверенности']])}
    </div><button class="button button--primary" type="button" data-action="close-sheet">Готово</button>
  </section></div>`;
}

function signalStates(signal) {
  const labels = [];
  if (signal.freshness === 'fresh') labels.push('Новый сигнал');
  if (signal.freshness === 'stale' || signal.status === 'stale') labels.push('Сигнал устарел');
  if (signal.parseStatus === 'incomplete') labels.push('Параметры распознаны не полностью');
  if (signal.status === 'duplicate_candidate') labels.push('Возможный дубль');
  if (signal.sourceRestricted || signal.sourceStatus === 'restricted') labels.push('Источник недоступен');
  return labels;
}

function formatPublishedAt(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Последняя публикация: время не указано';
  return `Последняя публикация: ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(timestamp)}`;
}

export function renderRadar(state, dispatch, fixtures = { listings: [] }, signals = []) {
  const filters = state.filters;
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== 'sortBy' && value !== defaults[key]).length;
  const listings = fixtures.listings ?? [];
  const districts = [...new Set(listings.map(({ district }) => district).filter(Boolean))].sort();
  const sources = [...new Set(listings.map(({ sourceName }) => sourceName).filter(Boolean))].sort();
  const offline = state.networkState === 'offline';

  return `<div class="radar-feed">
    ${offline ? `<p class="radar-notice" role="status">Офлайн · показаны сохранённые учебные сигналы. Последнее обновление: ${escapeHtml(state.lastUpdatedAt ?? 'время не указано')}</p>` : ''}
    ${state.refreshError ? '<div class="radar-error" role="alert"><span>Не удалось обновить Radar. Показаны сохранённые данные.</span><button class="text-button" type="button" data-action="refresh-today">Повторить</button></div>' : ''}
    ${state.loading ? '<div class="today-skeleton" data-loading-skeleton aria-label="Загрузка Radar"><span></span><span></span></div>' : ''}
    <section class="radar-controls" aria-label="Фильтры сигналов">
      <div class="radar-deal-type" role="group" aria-label="Тип сделки">
        <button type="button" data-action="set-radar-deal" data-deal-type="sale" aria-pressed="${filters.dealType === 'sale'}">Продажа</button>
        <button type="button" data-action="set-radar-deal" data-deal-type="rent" aria-pressed="${filters.dealType === 'rent'}">Аренда</button>
      </div>
      <div class="radar-frequent-filters">
        ${renderSelect('Район', 'district', filters.district, [['all', 'Все районы'], ...districts.map((district) => [district, district])])}
        ${renderSelect('Валюта', 'currency', filters.currency, [['all', 'Любая валюта'], ['USD', 'USD'], ['UZS', 'UZS']])}
        ${renderPriceInput('Цена от', 'minPrice', filters.minPrice)}
        ${renderPriceInput('Цена до', 'maxPrice', filters.maxPrice)}
      </div>
      <div class="radar-filter-actions"><button class="button button--secondary" type="button" data-action="open-radar-filters" data-focus-key="radar-filters">Фильтры${activeCount ? ` (${activeCount})` : ''}</button>
      ${activeCount ? '<button class="text-button" type="button" data-action="reset-radar-filters">Сбросить</button>' : ''}</div>
    </section>
    <section class="content-section" aria-labelledby="signal-heading"><div class="section-heading"><h2 id="signal-heading">Сигналы Radar</h2><span>${signals.length} примеров</span></div>
    ${signals.length ? `<div class="signal-list radar-signal-list">${signals.map((signal) => {
      const labels = signalStates(signal);
      const restricted = signal.sourceRestricted || signal.sourceStatus === 'restricted';
      const stale = signal.freshness === 'stale' || signal.status === 'stale';
      return `<div class="radar-signal" data-signal-id="${escapeHtml(signal.id)}">
        <a class="radar-signal__link" href="#radar" data-action="select-signal" data-signal-id="${escapeHtml(signal.id)}" aria-label="Открыть сигнал: ${escapeHtml(signal.title ?? 'объявление')}">${renderSignalRow(signal, state.savedSignalIds.includes(signal.id), { showSave: false })}</a>
        <button class="icon-button signal-row__save radar-signal__save" type="button" data-action="toggle-save" data-signal-id="${escapeHtml(signal.id)}" aria-label="${state.savedSignalIds.includes(signal.id) ? 'Убрать из сохранённого' : 'Сохранить сигнал'}" aria-pressed="${state.savedSignalIds.includes(signal.id)}"><i data-lucide="bookmark" aria-hidden="true"></i></button>
        ${labels.length ? `<ul class="radar-signal__states" aria-label="Состояние сигнала">${labels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul>` : ''}
        ${stale || restricted ? `<p class="radar-signal__source-time">${restricted ? 'Источник недоступен' : formatPublishedAt(signal.publishedAt)}</p>` : ''}
      </div>`;
    }).join('')}</div>` : activeCount ? '<p class="radar-empty" role="status">Нет сигналов по этим фильтрам</p>' : '<p class="radar-empty" role="status">В Radar пока нет сигналов</p>'}
    </section>${renderSheet(state, sources)}
  </div>`;
}
