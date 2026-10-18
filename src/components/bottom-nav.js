import { escapeHtml } from '../utils/escape-html.js';

const tabs = [
  { id: 'today', label: 'Сегодня', icon: 'house' },
  { id: 'radar', label: 'Radar', icon: 'radio' },
  { id: 'crm', label: 'CRM', icon: 'users-round' },
  { id: 'search', label: 'Поиск', icon: 'search' },
  { id: 'more', label: 'Ещё', icon: 'ellipsis' },
];

export function renderBottomNav(activeTab) {
  return `
    <nav class="bottom-nav safe-area-bottom" aria-label="Основная навигация">
      ${tabs.map(({ id, label, icon }) => `
        <button class="bottom-nav__item${activeTab === id ? ' is-active' : ''}" type="button"
          data-action="set-tab" data-tab="${escapeHtml(id)}" aria-label="${escapeHtml(label)}"
          ${activeTab === id ? 'aria-current="page"' : ''}>
          <i data-lucide="${icon}" aria-hidden="true"></i>
          <span>${escapeHtml(label)}</span>
        </button>
      `).join('')}
    </nav>
  `;
}
