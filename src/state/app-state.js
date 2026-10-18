const clone = (value) => structuredClone(value);

const isActiveFilter = (value) => value !== undefined && value !== null && value !== '' && value !== 'all';

export function createInitialState(fixtures) {
  return {
    activeTab: 'today',
    selectedSignalId: null,
    signalIds: (fixtures.listings ?? []).map(({ id }) => id),
    filters: {
      dealType: 'all',
      district: 'all',
      currency: 'all',
      minPrice: '',
      maxPrice: '',
      recency: 'all',
      source: 'all',
      confidenceTier: 'all',
      sortBy: 'newest',
    },
    savedSignalIds: [],
    linkedClientBySignalId: {},
    clients: clone(fixtures.clients ?? []),
    tasks: clone(fixtures.tasks ?? []),
    sheet: null,
    networkState: 'online',
    loading: false,
    toast: null,
  };
}

export function selectFilteredSignals(state, allSignals) {
  const filters = state.filters;
  const hasSelectedCurrency = isActiveFilter(filters.currency);
  const minPrice = hasSelectedCurrency && isActiveFilter(filters.minPrice) ? Number(filters.minPrice) : null;
  const maxPrice = hasSelectedCurrency && isActiveFilter(filters.maxPrice) ? Number(filters.maxPrice) : null;
  const recencyMs = filters.recency === '24h' ? 24 * 60 * 60 * 1000
    : filters.recency === '7d' ? 7 * 24 * 60 * 60 * 1000
      : filters.recency === '30d' ? 30 * 24 * 60 * 60 * 1000
        : null;
  const now = Date.now();

  const filtered = allSignals
    .map((signal, index) => ({ signal, index }))
    .filter(({ signal }) => {
      if (isActiveFilter(filters.dealType) && signal.dealType !== filters.dealType) return false;
      if (isActiveFilter(filters.district) && signal.district !== filters.district) return false;
      if (isActiveFilter(filters.currency) && signal.currency !== filters.currency) return false;
      if (minPrice !== null && (!Number.isFinite(minPrice) || signal.price < minPrice)) return false;
      if (maxPrice !== null && (!Number.isFinite(maxPrice) || signal.price > maxPrice)) return false;
      if (isActiveFilter(filters.source) && signal.sourceName !== filters.source) return false;
      if (isActiveFilter(filters.confidenceTier) && signal.confidenceTier !== filters.confidenceTier) return false;
      if (recencyMs !== null) {
        const publishedAt = Date.parse(signal.publishedAt);
        if (!Number.isFinite(publishedAt) || now - publishedAt > recencyMs || publishedAt > now) return false;
      }
      return true;
    });

  if (filters.sortBy === 'relevance') {
    return filtered.sort((a, b) => {
      const tier = { high: 0, medium: 1, low: 2 };
      return (tier[a.signal.confidenceTier] ?? 3) - (tier[b.signal.confidenceTier] ?? 3)
        || Date.parse(b.signal.publishedAt) - Date.parse(a.signal.publishedAt)
        || a.index - b.index;
    }).map(({ signal }) => signal);
  }
  return filtered.sort((a, b) => Date.parse(b.signal.publishedAt) - Date.parse(a.signal.publishedAt)
    || a.index - b.index).map(({ signal }) => signal);
}

export function setRadarFilters(state, patch) {
  return { ...state, filters: { ...state.filters, ...patch } };
}

export function toggleSavedSignal(state, signalId) {
  const savedSignalIds = state.savedSignalIds.includes(signalId)
    ? state.savedSignalIds.filter((id) => id !== signalId)
    : [...state.savedSignalIds, signalId];
  return { ...state, savedSignalIds };
}

const failure = (state, reason) => ({ ok: false, state, reason });
const success = (state) => ({ ok: true, state });

export function linkSignalToClient(state, signalId, clientId) {
  if (!state.signalIds.includes(signalId)) return failure(state, 'unknown_signal');
  if (!state.clients.some((client) => client.id === clientId)) return failure(state, 'unknown_client');
  const linkedClientId = state.linkedClientBySignalId[signalId];
  if (linkedClientId === clientId) return success(state);
  if (linkedClientId) return failure(state, 'already_linked');
  const linkedClientBySignalId = { ...state.linkedClientBySignalId, [signalId]: clientId };
  return success({ ...state, linkedClientBySignalId });
}

export function createClientAndLinkSignal(state, signalId, clientInput) {
  if (!state.signalIds.includes(signalId)) return failure(state, 'unknown_signal');
  const name = String(clientInput?.displayName ?? clientInput?.name ?? '').trim();
  if (!name) return failure(state, 'invalid_client');
  if (state.linkedClientBySignalId[signalId]) return failure(state, 'already_linked');

  let suffix = state.clients.length + 1;
  let id = `client-${String(suffix).padStart(3, '0')}`;
  while (state.clients.some((client) => client.id === id)) {
    suffix += 1;
    id = `client-${String(suffix).padStart(3, '0')}`;
  }
  const client = { ...clone(clientInput), id, name };
  const clients = [...state.clients, client];
  const linkedClientBySignalId = { ...state.linkedClientBySignalId, [signalId]: id };
  return success({ ...state, clients, linkedClientBySignalId });
}

export function addFollowUpTask(state, signalId, clientId) {
  if (!state.signalIds.includes(signalId)) return failure(state, 'unknown_signal');
  if (!state.clients.some((client) => client.id === clientId)) return failure(state, 'unknown_client');
  const duplicate = state.tasks.some((task) => task.signalId === signalId && task.clientId === clientId
    && ['active', 'open', 'pending'].includes(task.status));
  if (duplicate) return failure(state, 'duplicate_task');

  let suffix = state.tasks.length + 1;
  let id = `task-${String(suffix).padStart(3, '0')}`;
  while (state.tasks.some((task) => task.id === id)) {
    suffix += 1;
    id = `task-${String(suffix).padStart(3, '0')}`;
  }
  const task = {
    id,
    signalId,
    clientId,
    title: 'Связаться по объявлению',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  return success({ ...state, tasks: [...state.tasks, task] });
}
