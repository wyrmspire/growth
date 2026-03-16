/**
 * counter.ts — FW-8
 * Animated count-up utility for dashboard metric tiles.
 * Uses requestAnimationFrame with easeOutQuart easing for a smooth, tactile feel.
 *
 * Target phase: P7 (Dashboard Premium)
 */

export interface CounterOptions {
  /** String prepended to the number (e.g. '$'). Default: '' */
  prefix?: string;
  /** String appended to the number (e.g. 'x', '%'). Default: '' */
  suffix?: string;
  /** Number of decimal places to show. Default: auto (0 for integers). */
  decimals?: number;
}

/**
 * easeOutQuart — fast start, slow finish.
 * t: normalized time in [0, 1]. Returns eased value in [0, 1].
 */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Format a numeric value for display with optional prefix, suffix, decimals.
 */
function formatValue(
  value: number,
  target: number,
  opts: CounterOptions,
): string {
  const { prefix = '', suffix = '', decimals } = opts;

  let formatted: string;
  if (decimals !== undefined) {
    formatted = value.toFixed(decimals);
  } else if (Number.isInteger(target)) {
    formatted = Math.round(value).toLocaleString();
  } else {
    // Auto-detect decimal places from target's string representation
    const targetStr = String(target);
    const dotIdx = targetStr.indexOf('.');
    const autoDecimals = dotIdx >= 0 ? targetStr.length - dotIdx - 1 : 0;
    formatted = value.toFixed(autoDecimals);
  }

  return `${prefix}${formatted}${suffix}`;
}

/**
 * Animate the text content of an element from 0 to `target` over `duration` ms.
 *
 * - Uses easeOutQuart easing for a premium feel.
 * - Supports prefix (e.g. '$'), suffix (e.g. 'x', '%'), and decimal places.
 * - Stops gracefully if the element is removed from the DOM mid-animation.
 * - Sets exact target value on completion (no floating-point drift).
 *
 * @param el       - DOM element whose textContent will be animated.
 * @param target   - Final numeric value.
 * @param duration - Duration in ms. Default: 1200.
 * @param opts     - Optional prefix/suffix/decimals.
 *
 * @example
 * ```ts
 * import { animateCounter } from './counter';
 * animateCounter(el, 3.2, 1200, { prefix: '$', decimals: 2 });
 * ```
 */
export function animateCounter(
  el: HTMLElement,
  target: number,
  duration = 1200,
  opts: CounterOptions = {},
): void {
  if (!el) return;

  // Short-circuit for zero or negative targets
  if (target <= 0) {
    el.textContent = formatValue(0, target, opts);
    return;
  }

  // Set initial state before first frame
  el.textContent = formatValue(0, target, opts);

  let startTime: number | null = null;

  function step(timestamp: number): void {
    // Graceful DOM removal check
    if (!el.isConnected) return;

    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const current = eased * target;

    el.textContent = formatValue(current, target, opts);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Exact final value — no floating-point drift
      el.textContent = formatValue(target, target, opts);
    }
  }

  requestAnimationFrame(step);
}
