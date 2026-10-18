import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escape-html.js';

test('escapes hostile markup as text', () => {
  assert.equal(
    escapeHtml('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;',
  );
});

test('preserves readable Uzbek and Russian Unicode', () => {
  const text = 'Oʻzbekiston — квартира, Чиланзар';
  assert.equal(escapeHtml(text), text);
});
