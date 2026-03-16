/**
 * error-boundary.ts — FW-9
 * Safe page render wrapper. Catches synchronous render errors and returns
 * a styled fallback error card so the app shell stays functional.
 *
 * Target phase: P10 (Production Hardening)
 */

/**
 * Sanitise an unknown error value into a human-readable message string.
 */
function extractMessage(err: unknown): string {
  if (err === null || err === undefined) return 'An unknown error occurred.';
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'An unknown error occurred.';
  }
}

/**
 * Build the HTML string for a styled error fallback card.
 * Uses design system classes (.error-boundary defined in index.css).
 */
function renderErrorCard(message: string): string {
  // Escape the message to prevent XSS from error content being injected into DOM
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `
    <div class="error-boundary">
      <div class="error-boundary-icon">⚠</div>
      <h3>Something went wrong</h3>
      <p class="error-boundary-message">${safe}</p>
      <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: window.__currentPage || 'dashboard'}))">
        Try Again
      </button>
    </div>
  `;
}

/**
 * Wrap a page render function in a try/catch boundary.
 *
 * If `renderFn` throws, the error is caught and a styled error card is
 * returned in its place. The app shell continues to function normally.
 *
 * @param renderFn - A zero-argument function that returns an HTML string.
 * @returns The rendered HTML, or an error card if rendering failed.
 *
 * @example
 * ```ts
 * import { safePage } from './error-boundary';
 * import { renderProjectsPage } from './pages/projects';
 *
 * // In the router/renderer:
 * mainContent.innerHTML = safePage(renderProjectsPage);
 * ```
 */
export function safePage(renderFn: () => string): string {
  try {
    return renderFn();
  } catch (err: unknown) {
    const message = extractMessage(err);
    // Log to console so developers can inspect the full stack trace
    console.error('[safePage] Page render error:', err);
    return renderErrorCard(message);
  }
}
