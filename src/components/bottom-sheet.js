import { escapeHtml } from '../utils/escape-html.js';

export function renderBottomSheet(sheet) {
  if (!sheet) return '';
  return `
    <div class="sheet-backdrop" data-sheet-backdrop>
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-sheet>
        <div class="bottom-sheet__handle" aria-hidden="true"></div>
        <header class="bottom-sheet__header">
          <h2 id="sheet-title">${escapeHtml(sheet.title ?? 'Быстрое действие')}</h2>
          <button class="icon-button" type="button" data-action="close-sheet" aria-label="Закрыть">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </header>
        <p class="bottom-sheet__copy">${escapeHtml(sheet.message ?? 'Выберите действие для продолжения.')}</p>
        <button class="button button--primary" type="button" data-action="close-sheet">Готово</button>
      </section>
    </div>
  `;
}

export function activateBottomSheet(root, onClose, openerKey = 'quick-action') {
  const backdrop = root.querySelector('[data-sheet-backdrop]');
  const dialog = root.querySelector('[data-sheet]');
  if (!backdrop || !dialog) return () => {};

  const focusable = () => [...dialog.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];
  const close = () => onClose();
  const onBackdropClick = (event) => {
    if (event.target === backdrop) close();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  backdrop.addEventListener('click', onBackdropClick);
  document.addEventListener('keydown', onKeyDown);
  focusable()[0]?.focus();

  return () => {
    backdrop.removeEventListener('click', onBackdropClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}
