/**
 * Quick-help drawer component.
 * Shows a contextual glossary panel when user clicks "What does this mean?".
 * Each page passes a list of glossary keys relevant to that page.
 */

import { glossary } from '../glossary';

let drawerEl: HTMLDivElement | null = null;
let overlayEl: HTMLDivElement | null = null;
let currentKeys: string[] = [];

function ensureDrawer(): HTMLDivElement {
    if (!drawerEl) {
        // Overlay
        overlayEl = document.createElement('div');
        overlayEl.className = 'help-drawer-overlay';
        overlayEl.addEventListener('click', closeDrawer);
        document.body.appendChild(overlayEl);

        // Drawer
        drawerEl = document.createElement('div');
        drawerEl.className = 'help-drawer';
        drawerEl.setAttribute('role', 'dialog');
        drawerEl.setAttribute('aria-label', 'Marketing term glossary');
        document.body.appendChild(drawerEl);

        // Close on Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDrawer();
        });
    }
    return drawerEl;
}

function renderDrawerContent(keys: string[]): string {
    const entries = keys
        .map(k => glossary[k])
        .filter(Boolean);

    if (!entries.length) return '<p style="color:var(--text-muted);font-size:13px">No terms available for this page.</p>';

    return entries.map(e => `
        <div class="help-term">
            <div class="help-term-label">${e.label}</div>
            <div class="help-term-body">${e.tooltip}</div>
        </div>
    `).join('');
}

export function openDrawer(keys: string[]): void {
    currentKeys = keys;
    const drawer = ensureDrawer();

    drawer.innerHTML = `
        <div class="help-drawer-header">
            <span class="help-drawer-title">📖 What does this mean?</span>
            <button class="help-drawer-close" id="help-drawer-close" aria-label="Close">✕</button>
        </div>
        <p class="help-drawer-intro">
            Here are plain-English explanations for the marketing terms on this page —
            no experience needed.
        </p>
        <div class="help-term-list">
            ${renderDrawerContent(keys)}
        </div>
    `;

    document.getElementById('help-drawer-close')?.addEventListener('click', closeDrawer);

    // Animate in
    requestAnimationFrame(() => {
        drawer.classList.add('open');
        overlayEl?.classList.add('open');
    });
}

export function closeDrawer(): void {
    drawerEl?.classList.remove('open');
    overlayEl?.classList.remove('open');
}

export function isDrawerOpen(): boolean {
    return drawerEl?.classList.contains('open') ?? false;
}
