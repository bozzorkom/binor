import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addFollowUpTask,
  createClientAndLinkSignal,
  createInitialState,
  linkSignalToClient,
  selectFilteredSignals,
  setRadarFilters,
  toggleSavedSignal,
} from './app-state.js';
import { clients, listings, tasks } from '../data/fixtures.js';

const makeState = () => createInitialState({ listings, clients, tasks });
const clone = (value) => structuredClone(value);

test('filters sale, rent, district, currency-aware price range and recency', () => {
  const state = makeState();
  assert.ok(selectFilteredSignals(setRadarFilters(state, { dealType: 'sale' }), listings).every((item) => item.dealType === 'sale'));
  assert.ok(selectFilteredSignals(setRadarFilters(state, { dealType: 'rent' }), listings).every((item) => item.dealType === 'rent'));
  assert.ok(selectFilteredSignals(setRadarFilters(state, { district: 'Chilonzor' }), listings).every((item) => item.district === 'Chilonzor'));
  const bounded = selectFilteredSignals(setRadarFilters(state, { currency: 'USD', minPrice: 400, maxPrice: 500 }), listings);
  assert.ok(bounded.length > 0);
  assert.ok(bounded.every((item) => item.currency === 'USD' && item.price >= 400 && item.price <= 500));
  const now = Date.now();
  const recencySignals = [
    { ...listings[0], id: 'recent-test', publishedAt: new Date(now - 60_000).toISOString() },
    { ...listings[1], id: 'old-test', publishedAt: new Date(now - 48 * 60 * 60 * 1000).toISOString() },
  ];
  const recent = selectFilteredSignals(setRadarFilters(state, { recency: '24h' }), recencySignals);
  assert.deepEqual(recent.map((item) => item.id), ['recent-test']);
  assert.deepEqual(selectFilteredSignals(setRadarFilters(state, { district: 'Atlantis' }), listings), []);
});

test('does not apply numeric price bounds across currencies when currency is all', () => {
  const state = makeState();
  const unbounded = selectFilteredSignals(state, listings);
  const mixedCurrencyRange = selectFilteredSignals(setRadarFilters(state, {
    minPrice: 6_000_000,
    maxPrice: 7_000_000,
  }), listings);

  assert.deepEqual(mixedCurrencyRange, unbounded);
  assert.ok(mixedCurrencyRange.some((item) => item.currency === 'USD'));
  assert.ok(mixedCurrencyRange.some((item) => item.currency === 'UZS'));
});

test('keeps stale, parse-incomplete and low-confidence signals visible by default', () => {
  const result = selectFilteredSignals(makeState(), listings);
  assert.ok(result.some((item) => item.freshness === 'stale'));
  assert.ok(result.some((item) => item.parseStatus === 'incomplete'));
  assert.ok(result.some((item) => item.confidenceTier === 'low'));
});

test('filtering returns a sorted result without mutating fixture arrays or objects', () => {
  const before = clone(listings);
  const result = selectFilteredSignals(makeState(), listings);
  assert.deepEqual(listings, before);
  assert.notEqual(result, listings);
  assert.deepEqual(result.map((item) => item.publishedAt), [...result.map((item) => item.publishedAt)].sort().reverse());
});

test('initial state owns copies of fixture arrays and nested objects', () => {
  const before = { listings: clone(listings), clients: clone(clients), tasks: clone(tasks) };
  const state = makeState();
  assert.notEqual(state.clients, clients);
  assert.notEqual(state.clients[0], clients[0]);
  assert.notEqual(state.tasks, tasks);
  assert.deepEqual({ listings, clients, tasks }, before);
});

test('saving and unsaving a signal is reversible and immutable', () => {
  const state = makeState();
  const saved = toggleSavedSignal(state, listings[0].id);
  assert.deepEqual(saved.savedSignalIds, [listings[0].id]);
  assert.deepEqual(toggleSavedSignal(saved, listings[0].id).savedSignalIds, state.savedSignalIds);
  assert.deepEqual(state.savedSignalIds, []);
});

test('linking is idempotent for the same client and blocks replacing the client', () => {
  const state = makeState();
  const first = linkSignalToClient(state, listings[0].id, clients[0].id);
  assert.equal(first.ok, true);
  assert.equal(first.state.linkedClientBySignalId[listings[0].id], clients[0].id);
  const repeated = linkSignalToClient(first.state, listings[0].id, clients[0].id);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.state, first.state);
  const replacement = linkSignalToClient(first.state, listings[0].id, clients[1].id);
  assert.deepEqual({ ok: replacement.ok, reason: replacement.reason, state: replacement.state }, {
    ok: false, reason: 'already_linked', state: first.state,
  });
});

test('creates and links a client only when its display name is non-empty', () => {
  const state = makeState();
  const invalid = createClientAndLinkSignal(state, listings[0].id, { displayName: '  ' });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, 'invalid_client');
  assert.equal(invalid.state, state);
  const created = createClientAndLinkSignal(state, listings[0].id, { displayName: 'Новый учебный клиент' });
  assert.equal(created.ok, true);
  assert.equal(created.state.clients.length, clients.length + 1);
  assert.ok(created.state.clients.some((client) => client.id === created.state.linkedClientBySignalId[listings[0].id]));
});

test('rejects unknown IDs without partially changing state', () => {
  const state = makeState();
  for (const result of [
    linkSignalToClient(state, 'missing-signal', clients[0].id),
    linkSignalToClient(state, listings[0].id, 'missing-client'),
    createClientAndLinkSignal(state, 'missing-signal', { displayName: 'Новый учебный клиент' }),
    addFollowUpTask(state, 'missing-signal', clients[0].id),
    addFollowUpTask(state, listings[0].id, 'missing-client'),
  ]) {
    assert.equal(result.ok, false);
    assert.equal(result.state, state);
    assert.deepEqual(result.state, state);
  }
  assert.equal(linkSignalToClient(state, 'missing-signal', clients[0].id).reason, 'unknown_signal');
  assert.equal(linkSignalToClient(state, listings[0].id, 'missing-client').reason, 'unknown_client');
});

test('prevents duplicate active follow-up tasks for a signal and client pair', () => {
  const state = makeState();
  const first = addFollowUpTask(state, listings[3].id, clients[3].id);
  assert.equal(first.ok, true);
  const repeated = addFollowUpTask(first.state, listings[3].id, clients[3].id);
  assert.equal(repeated.ok, false);
  assert.equal(repeated.reason, 'duplicate_task');
  assert.equal(repeated.state, first.state);
});
