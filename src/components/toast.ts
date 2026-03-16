/**
 * Toast notification system — slide-in toasts for action feedback.
 * Replaces alert()-style feedback with elegant animated notifications.
 */

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // ms, default 3500
}

let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

const ICONS: Record<ToastType, string> = {
  success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
};

export function toast(options: ToastOptions | string): void {
  const opts: ToastOptions =
    typeof options === 'string' ? { message: options } : options;
  const type = opts.type || 'info';
  const duration = opts.duration ?? 3500;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="toast-icon">${ICONS[type]}</span>
    <span class="toast-message">${opts.message}</span>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  const close = () => {
    el.classList.add('toast--exiting');
    el.addEventListener('animationend', () => el.remove());
  };

  el.querySelector('.toast-close')?.addEventListener('click', close);

  ensureContainer().appendChild(el);

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(close, duration);
  }
}

// Convenience helpers
export const toastSuccess = (msg: string) => toast({ message: msg, type: 'success' });
export const toastError = (msg: string) => toast({ message: msg, type: 'error' });
export const toastWarning = (msg: string) => toast({ message: msg, type: 'warning' });
export const toastInfo = (msg: string) => toast({ message: msg, type: 'info' });
