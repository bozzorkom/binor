import { escapeHtml } from '../utils/escape-html.js';

export function renderToast(toast) {
  if (!toast) return '';
  return `
    <div class="toast" role="status" aria-live="polite">
      <i data-lucide="check" aria-hidden="true"></i>
      <span>${escapeHtml(typeof toast === 'string' ? toast : toast.message)}</span>
    </div>
  `;
}
