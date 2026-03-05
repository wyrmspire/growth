import { getTooltip } from '../glossary';

let tooltipEl: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let showTimeout: ReturnType<typeof setTimeout> | null = null;

export function supportsHoverTooltips(
    mediaQuery: { matchMedia?: (query: string) => { matches: boolean } } | undefined =
        typeof window === 'undefined' ? undefined : window,
): boolean {
    if (!mediaQuery || typeof mediaQuery.matchMedia !== 'function') return false;
    return mediaQuery.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function ensureTooltipEl(): HTMLDivElement {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'go-tooltip';
        tooltipEl.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
}

/** Cancel any pending show or hide and immediately hide the tooltip. */
export function cancelAndHide(): void {
    if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
    }
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    if (tooltipEl) {
        tooltipEl.classList.remove('visible', 'above');
    }
}

export function showTooltip(target: HTMLElement, text: string): void {
    const el = ensureTooltipEl();
    el.textContent = text;
    el.classList.add('visible');

    const rect = target.getBoundingClientRect();
    const tipWidth = 280;

    let left = rect.left + rect.width / 2 - tipWidth / 2;
    if (left < 8) left = 8;
    if (left + tipWidth > window.innerWidth - 8) left = window.innerWidth - tipWidth - 8;

    let top = rect.bottom + 8;
    if (top + 80 > window.innerHeight) {
        top = rect.top - 8;
        el.classList.add('above');
    } else {
        el.classList.remove('above');
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.maxWidth = `${tipWidth}px`;
}

export function hideTooltip(): void {
    // Cancel pending show first so a fast hover can't leave a stale tip
    if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
    }
    hideTimeout = setTimeout(() => {
        if (tooltipEl) {
            tooltipEl.classList.remove('visible', 'above');
        }
        hideTimeout = null;
    }, 80);
}

export function attachTooltips(root: HTMLElement = document.body): void {
    if (!supportsHoverTooltips()) {
        cancelAndHide();
        return;
    }

    root.addEventListener('mouseenter', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null;
        if (!target) return;

        const key = target.getAttribute('data-tip') || '';
        const text = target.getAttribute('data-tip-text') || getTooltip(key);
        if (!text) return;

        // Cancel any pending hide so we don't flicker on fast hover transitions
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        // Cancel any pending (stale) show and schedule a fresh one
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }
        showTimeout = setTimeout(() => {
            showTimeout = null;
            showTooltip(target, text);
        }, 200);
    }, true);

    root.addEventListener('mouseleave', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tip]');
        if (!target) return;

        hideTooltip();
    }, true);
}

/** Helper to wrap text with a tooltip span */
export function tip(key: string, content: string, tag: string = 'span'): string {
    return `<${tag} data-tip="${key}" class="has-tip">${content}</${tag}>`;
}
