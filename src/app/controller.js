import {
  createInitialState,
  setRadarFilters,
  toggleSavedSignal,
  linkSignalToClient,
  createClientAndLinkSignal,
  addFollowUpTask,
} from '../state/app-state.js';
import { renderApp } from './render.js';
import { activateBottomSheet } from '../components/bottom-sheet.js';

const tabs = new Set(['today', 'radar', 'crm', 'search', 'more']);

export function createAppController(root, fixtures) {
  let state = createInitialState(fixtures);
  let todayUi = { searchQuery: '', lastUpdatedAt: new Date().toISOString(), refreshError: false };
  let sheetCleanup = null;
  let activeOpenerKey = 'quick-action';
  let refreshTimer = null;

  const render = (wasSheetOpen = Boolean(state.sheet)) => {
    const scrollTop = window.scrollY;
    sheetCleanup?.();
    sheetCleanup = null;
    renderApp(root, { ...state, ...todayUi }, dispatch, fixtures);
    window.scrollTo(0, scrollTop);
    if (state.sheet) {
      sheetCleanup = activateBottomSheet(root, () => dispatch({ type: 'closeSheet' }), activeOpenerKey);
    } else if (wasSheetOpen) {
      root.querySelector(`[data-focus-key="${activeOpenerKey}"]`)?.focus();
    }
  };

  function dispatch(action) {
    if (!action || typeof action !== 'object') return state;
    let nextState = state;
    switch (action.type) {
      case 'setActiveTab':
        if (!tabs.has(action.tabId)) return state;
        nextState = { ...state, activeTab: action.tabId };
        break;
      case 'selectSignal':
        if (!state.signalIds.includes(action.signalId)) return state;
        nextState = { ...state, selectedSignalId: action.signalId, activeTab: 'radar' };
        break;
      case 'backToRadar':
        nextState = { ...state, selectedSignalId: null, activeTab: 'radar' };
        break;
      case 'setNetworkState':
        if (!['online', 'offline'].includes(action.networkState)) return state;
        nextState = { ...state, networkState: action.networkState };
        break;
      case 'setSearchQuery':
        todayUi = { ...todayUi, searchQuery: String(action.query ?? '') };
        render();
        return state;
      case 'refreshToday':
        if (state.loading) return state;
        todayUi = { ...todayUi, refreshError: false };
        nextState = { ...state, loading: true };
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          const failed = state.networkState === 'offline';
          todayUi = { ...todayUi, refreshError: failed, lastUpdatedAt: failed ? todayUi.lastUpdatedAt : new Date().toISOString() };
          state = { ...state, loading: false };
          render();
        }, 350);
        break;
      case 'setRadarFilters':
        nextState = setRadarFilters(state, action.patch ?? {});
        break;
      case 'resetRadarFilters':
        nextState = setRadarFilters(state, {
          dealType: 'all', district: 'all', currency: 'all', minPrice: '', maxPrice: '',
          recency: 'all', source: 'all', confidenceTier: 'all', sortBy: 'newest',
        });
        break;
      case 'toggleSavedSignal':
        nextState = toggleSavedSignal(state, action.signalId);
        break;
      case 'linkSignalToClient': {
        const result = linkSignalToClient(state, action.signalId, action.clientId);
        if (!result.ok) return result;
        nextState = result.state;
        break;
      }
      case 'createClientAndLinkSignal': {
        const result = createClientAndLinkSignal(state, action.signalId, action.clientInput);
        if (!result.ok) return result;
        nextState = result.state;
        break;
      }
      case 'addFollowUpTask': {
        const result = addFollowUpTask(state, action.signalId, action.clientId);
        if (!result.ok) return result;
        nextState = result.state;
        break;
      }
      case 'openSheet':
        if (action.openerKey) activeOpenerKey = action.openerKey;
        nextState = { ...state, sheet: { title: action.title, message: action.message, kind: action.kind } };
        break;
      case 'closeSheet':
        nextState = { ...state, sheet: null };
        break;
      case 'showToast':
        nextState = { ...state, toast: { message: String(action.message ?? '') } };
        break;
      case 'dismissToast':
        nextState = { ...state, toast: null };
        break;
      default:
        return state;
    }
    if (nextState !== state) {
      const wasSheetOpen = Boolean(state.sheet);
      state = nextState;
      render(wasSheetOpen);
    }
    return state;
  }

  const onClick = (event) => {
    const element = event.target.closest('[data-action]');
    if (!element || !root.contains(element)) return;
    const { action } = element.dataset;
    if (action === 'set-tab') {
      event.preventDefault();
      dispatch({ type: 'setActiveTab', tabId: element.dataset.tab });
    } else if (action === 'toggle-save') {
      dispatch({ type: 'toggleSavedSignal', signalId: element.dataset.signalId });
    } else if (action === 'open-sheet') {
      activeOpenerKey = element.dataset.focusKey ?? 'quick-action';
      dispatch({ type: 'openSheet', openerKey: activeOpenerKey, kind: element.dataset.kind });
    } else if (action === 'open-radar-filters') {
      activeOpenerKey = 'radar-filters';
      dispatch({ type: 'openSheet', openerKey: activeOpenerKey, kind: 'radar-filters' });
    } else if (action === 'reset-radar-filters') {
      dispatch({ type: 'resetRadarFilters' });
    } else if (action === 'set-radar-deal') {
      dispatch({ type: 'setRadarFilters', patch: { dealType: element.dataset.dealType } });
    } else if (action === 'close-sheet') {
      dispatch({ type: 'closeSheet' });
    } else if (action === 'show-toast') {
      dispatch({ type: 'showToast', message: element.dataset.message });
    } else if (action === 'select-signal') {
      event.preventDefault();
      dispatch({ type: 'selectSignal', signalId: element.dataset.signalId });
    } else if (action === 'back-radar') {
      dispatch({ type: 'backToRadar' });
    } else if (action === 'refresh-today') {
      dispatch({ type: 'refreshToday' });
    }
  };

  const onChange = (event) => {
    const element = event.target.closest('[data-action="set-radar-filter"]');
    if (!element || !root.contains(element)) return;
    dispatch({ type: 'setRadarFilters', patch: { [element.dataset.filter]: element.value } });
  };

  const onSubmit = (event) => {
    if (!event.target.matches('[data-action="search-today"]')) return;
    event.preventDefault();
    dispatch({ type: 'setSearchQuery', query: new FormData(event.target).get('query') });
  };
  const onOnline = () => dispatch({ type: 'setNetworkState', networkState: 'online' });
  const onOffline = () => dispatch({ type: 'setNetworkState', networkState: 'offline' });

  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('submit', onSubmit);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  if (!navigator.onLine) state = { ...state, networkState: 'offline' };
  render();

  return {
    getState: () => ({ ...state, ...todayUi }),
    dispatch,
  };
}
