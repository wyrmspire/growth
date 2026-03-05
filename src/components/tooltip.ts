import { getTooltip } from '../glossary';

let tooltipEl: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let showTimeout: ReturnType<typeof setTimeout> | null = null;

function ensureTooltipEl(): HTMLDivElement {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'go-tooltip';
        tooltipEl.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
}

function show(target: HTMLElement, text: string) {
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

function hide() {
    if (tooltipEl) {
        tooltipEl.classList.remove('visible');
    }
}

export function attachTooltips(root: HTMLElement = document.body): void {
    root.addEventListener('mouseenter', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null;
        if (!target) return;

        const key = target.getAttribute('data-tip') || '';
        const text = target.getAttribute('data-tip-text') || getTooltip(key);
        if (!text) return;

        if (hideTimeout) clearTimeout(hideTimeout);
        showTimeout = setTimeout(() => show(target, text), 200);
    }, true);

    root.addEventListener('mouseleave', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tip]');
        if (!target) return;

        if (showTimeout) clearTimeout(showTimeout);
        hideTimeout = setTimeout(hide, 100);
    }, true);
}

/** Helper to wrap text with a tooltip span */
export function tip(key: string, content: string, tag: string = 'span'): string {
    return `<${tag} data-tip="${key}" class="has-tip">${content}</${tag}>`;
}
