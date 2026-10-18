import {
  createIcons,
  House,
  Radio,
  UsersRound,
  Search,
  Ellipsis,
  Bell,
  Plus,
  Bookmark,
  X,
  Check,
  RefreshCw,
  WifiOff,
  ChevronRight,
} from 'lucide';
import { selectFilteredSignals } from '../state/app-state.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderBottomSheet } from '../components/bottom-sheet.js';
import { renderToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escape-html.js';
import { renderToday } from '../views/today.js';
import { renderRadar } from '../views/radar.js';

const icons = { House, Radio, UsersRound, Search, Ellipsis, Bell, Plus, Bookmark, X, Check, RefreshCw, WifiOff, ChevronRight };
const tabLabels = { today: 'Сегодня', radar: 'Radar', crm: 'CRM', search: 'Поиск', more: 'Ещё' };

export function renderApp(root, state, dispatch, fixtures = { listings: [] }) {
  const label = tabLabels[state.activeTab] ?? tabLabels.today;
  const signals = selectFilteredSignals(state, fixtures.listings ?? []);
  const selectedSignal = state.selectedSignalId
    ? (fixtures.listings ?? []).find(({ id }) => id === state.selectedSignalId)
    : null;

  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header safe-area-top">
        <a class="app-brand" href="#today" aria-label="BINOR, сегодня" data-action="set-tab" data-tab="today">
          <span class="app-brand__mark" aria-hidden="true">B</span>
          <span>BINOR</span>
        </a>
        <div class="app-header__actions">
          <button class="icon-button" type="button" aria-label="Уведомления" data-action="show-toast" data-message="Новых уведомлений нет">
            <i data-lucide="bell" aria-hidden="true"></i>
          </button>
          <button class="icon-button icon-button--primary" type="button" aria-label="Быстрое действие" data-action="open-sheet" data-focus-key="quick-action">
            <i data-lucide="plus" aria-hidden="true"></i>
          </button>
        </div>
      </header>
      <main class="app-main" id="main-content" tabindex="-1">
        <div class="screen-heading">
          <div>
            <p class="eyebrow">Ташкент · рабочее пространство</p>
            <h1>${escapeHtml(label)}</h1>
          </div>
          <span class="sync-indicator"><span aria-hidden="true"></span> Учебные данные</span>
        </div>
        ${state.activeTab === 'today' ? renderToday(state, dispatch, fixtures) : state.activeTab === 'radar' && selectedSignal ? `
          <section class="signal-detail" aria-labelledby="signal-detail-title">
            <button class="text-button signal-detail__back" type="button" data-action="back-radar">Назад к Radar</button>
            <p class="eyebrow">Учебный сигнал</p>
            <h2 id="signal-detail-title">${escapeHtml(selectedSignal.title ?? 'Объявление')}</h2>
            <p class="signal-detail__summary">${escapeHtml(selectedSignal.district ?? 'Район не указан')} · ${escapeHtml(selectedSignal.areaM2 ?? '—')} м²</p>
            <p class="signal-detail__source">Источник: ${escapeHtml(selectedSignal.sourceName ?? 'не указан')}</p>
            <p class="signal-detail__note">Предварительный просмотр учебной записи. Подробности сигнала будут доступны в следующем этапе.</p>
          </section>
        ` : state.activeTab === 'radar' ? `
          ${renderRadar(state, dispatch, fixtures, signals)}
        ` : `
          <section class="shell-placeholder" aria-label="Содержимое раздела">
            <span class="shell-placeholder__icon" aria-hidden="true"><i data-lucide="${state.activeTab === 'crm' ? 'users-round' : state.activeTab === 'search' ? 'search' : state.activeTab === 'more' ? 'ellipsis' : 'house'}"></i></span>
            <p>${state.activeTab === 'today' ? 'Рабочий день в Ташкенте' : `${escapeHtml(label)} — рабочий раздел`}</p>
            <button class="text-button" type="button" data-action="set-tab" data-tab="radar">Открыть Radar</button>
          </section>
        `}
      </main>
      ${renderBottomNav(state.activeTab)}
      ${renderToast(state.toast)}
      ${renderBottomSheet(state.sheet?.kind === 'radar-filters' ? null : state.sheet)}
    </div>
  `;
  createIcons({ icons, root });
}
