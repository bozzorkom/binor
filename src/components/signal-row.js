import { escapeHtml } from '../utils/escape-html.js';

const evidenceLabels = {
  high: 'Высокая уверенность',
  medium: 'Средняя уверенность',
  low: 'Низкая уверенность',
};

function formatPrice(signal) {
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: signal.currency,
      maximumFractionDigits: 0,
    }).format(signal.price);
  } catch {
    return `${new Intl.NumberFormat('ru-RU').format(signal.price)} ${signal.currency ?? ''}`.trim();
  }
}

function formatAge(publishedAt) {
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) return 'Время публикации не указано';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

export function renderSignalRow(signal, isSaved, { showSave = true } = {}) {
  const imagePath = typeof signal.imagePath === 'string' && signal.imagePath.startsWith('/assets/')
    ? signal.imagePath
    : '';
  const title = signal.title ?? `${signal.rooms ?? '—'}-комнатная квартира`;
  const confidence = evidenceLabels[signal.confidenceTier] ?? 'Уровень данных не указан';
  const image = imagePath
    ? `<img class="signal-row__image" src="${escapeHtml(imagePath)}" alt="" loading="lazy">`
    : '<span class="signal-row__image signal-row__image--empty" aria-hidden="true"></span>';

  return `
    <article class="signal-row" data-signal-id="${escapeHtml(signal.id)}">
      <div class="signal-row__media">${image}</div>
      <div class="signal-row__body">
        <div class="signal-row__topline">
          <h3>${escapeHtml(title)}</h3>
          ${showSave ? `<button class="icon-button signal-row__save" type="button" data-action="toggle-save"
            data-signal-id="${escapeHtml(signal.id)}" aria-label="${isSaved ? 'Убрать из сохранённого' : 'Сохранить сигнал'}"
            aria-pressed="${Boolean(isSaved)}">
            <i data-lucide="bookmark" aria-hidden="true"></i>
          </button>` : ''}
        </div>
        <p class="signal-row__price">${escapeHtml(formatPrice(signal))}</p>
        <p class="signal-row__meta">${escapeHtml(signal.district ?? 'Район не указан')} · ${escapeHtml(signal.areaM2 ?? '—')} м² · ${escapeHtml(formatAge(signal.publishedAt))}</p>
        <div class="signal-row__foot">
          <span class="signal-row__source">${escapeHtml(signal.sourceName ?? 'Источник не указан')}</span>
          <span class="evidence-tier evidence-tier--${escapeHtml(signal.confidenceTier ?? 'unknown')}">${escapeHtml(confidence)}</span>
        </div>
      </div>
    </article>
  `;
}
