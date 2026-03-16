/**
 * Setup & Accounts Page — SETUP-1 through SETUP-7
 * Lets operators enter and manage social-platform API credentials.
 *
 * Security contract:
 *  - Raw keys are NEVER rendered to the DOM. Only masked values are shown.
 *  - All reads go through setup-store.ts which keeps raw values in localStorage.
 *  - This page treats every input like a password field: value="" on render.
 */

import { tip } from '../components/tooltip';
import { toastSuccess, toastError, toastInfo } from '../components/toast';
import { iconSettings, iconCheck, iconX } from '../icons';
import {
  PLATFORM_SLOTS,
  getPlatformStatuses,
  hasKey,
  getKeyMasked,
  setKey,
  clearPlatform,
  clearAll,
  type PlatformId,
} from '../setup-store';

// ── Helpers ──────────────────────────────────────────────────────────────────

function connectedCount(): number {
  return getPlatformStatuses().filter((s) => s.isConnected).length;
}

function renderConnectionDot(connected: boolean): string {
  return connected
    ? `<span class="setup-dot setup-dot--connected" title="Connected"></span>`
    : `<span class="setup-dot setup-dot--disconnected" title="Not connected"></span>`;
}

function renderFieldRow(platformId: PlatformId, fieldKey: string, label: string, placeholder: string, optional: boolean): string {
  const masked = getKeyMasked(platformId, fieldKey);
  const filled = hasKey(platformId, fieldKey);

  return `
    <div class="setup-field-row">
      <label class="setup-field-label" for="setup-${platformId}-${fieldKey}">
        ${label}
        ${optional ? '<span class="setup-optional-badge">optional</span>' : ''}
      </label>
      <div class="setup-field-input-group">
        <input
          id="setup-${platformId}-${fieldKey}"
          type="password"
          autocomplete="off"
          class="form-input setup-field-input"
          data-platform="${platformId}"
          data-field="${fieldKey}"
          placeholder="${filled ? masked : placeholder}"
          value=""
          aria-label="${label} for ${platformId}"
        />
        ${filled
          ? `<span class="setup-field-status setup-field-status--saved" title="Saved">
               ${iconCheck()}
             </span>`
          : `<span class="setup-field-status setup-field-status--empty" title="Not set">
               ${iconX()}
             </span>`
        }
      </div>
      ${filled ? `<div class="setup-field-hint">Saved — enter a new value to update, or clear below to remove.</div>` : ''}
    </div>
  `;
}

function renderPlatformCard(slot: typeof PLATFORM_SLOTS[number]): string {
  const statuses = getPlatformStatuses();
  const status = statuses.find((s) => s.id === slot.id)!;
  const fields = slot.fields.map((f) =>
    renderFieldRow(slot.id, f.key, f.label, f.placeholder, f.optional ?? false)
  ).join('');

  const connectionBadge = status.isConnected
    ? `<span class="badge badge-approved">Connected</span>`
    : status.filledCount > 0
      ? `<span class="badge badge-pending">Partial</span>`
      : `<span class="badge" style="background:var(--bg-badge);color:var(--text-muted);">Not configured</span>`;

  return `
    <div class="setup-platform-card card" id="setup-card-${slot.id}" data-platform-id="${slot.id}">
      <div class="setup-platform-header">
        <div class="setup-platform-name-row">
          ${renderConnectionDot(status.isConnected)}
          <span class="setup-platform-name">${slot.label}</span>
          ${connectionBadge}
        </div>
        ${slot.helpUrl
          ? `<a href="${slot.helpUrl}" target="_blank" rel="noopener noreferrer" class="setup-help-link" title="View developer docs for ${slot.label}">
               Get API keys ↗
             </a>`
          : ''}
      </div>

      <form class="setup-platform-form" id="setup-form-${slot.id}" data-platform="${slot.id}" novalidate>
        <div class="setup-fields">
          ${fields}
        </div>
        <div class="setup-form-actions">
          <button type="submit" class="btn btn-primary btn--sm" id="setup-save-${slot.id}">
            ${iconCheck()} Save
          </button>
          <button type="button" class="btn btn--ghost btn--sm" data-setup-clear="${slot.id}">
            Clear all
          </button>
        </div>
      </form>
    </div>
  `;
}

// ── Main render ───────────────────────────────────────────────────────────────

export function renderSetupPage(): string {
  const statuses = getPlatformStatuses();
  const totalConnected = statuses.filter((s) => s.isConnected).length;
  const totalPlatforms = PLATFORM_SLOTS.length;

  const progressPct = totalPlatforms > 0 ? Math.round((totalConnected / totalPlatforms) * 100) : 0;

  return `
    <div class="page-shell" id="setup-page">
      <div class="page-header">
        <h1>${iconSettings()} Setup &amp; Accounts</h1>
        <p class="body-secondary">Connect your social media accounts so GrowthOps can publish your approved campaigns.</p>
      </div>

      <!-- Coaching block -->
      <div class="coach-block">
        <div class="coach-block-icon">${iconSettings()}</div>
        <div class="coach-block-body">
          <div class="coach-what">
            <strong>What you do here</strong><br>
            Enter the API credentials for each social platform you want to publish to.
            ${tip('setupAccounts', 'Account Setup')} happens once per platform and is saved in your browser.
          </div>
          <div class="coach-why" style="margin-top: var(--space-sm);">
            <strong>Why it matters</strong><br>
            Without platform credentials GrowthOps can only generate and preview content — it cannot publish.
            Add your ${tip('apiKey', 'API keys')} here to unlock the full publishing pipeline.
          </div>
          <div class="coach-next" style="margin-top: var(--space-sm);">
            <strong>What comes next</strong><br>
            After connecting a platform, head to the Publishing Calendar and schedule your approved posts for live delivery.
          </div>
        </div>
      </div>

      <!-- Security notice -->
      <div class="setup-security-notice card" style="margin-bottom: var(--space-lg);">
        <span class="setup-security-icon">🔒</span>
        <div>
          <strong>Your keys stay local</strong>
          <p style="margin-top: var(--space-xs); color: var(--text-secondary); font-size: 13px;">
            Credentials are stored only in your browser's localStorage — they are never sent to any server.
            Keys are masked in the UI and base64-encoded at rest.
            For production deployments, use a server-side vault (Phase 8).
          </p>
        </div>
      </div>

      <!-- Connection progress overview -->
      <div class="setup-overview card" style="margin-bottom: var(--space-xl);">
        <div class="setup-overview-header">
          <span class="section-heading">${tip('platformCredentials', 'Platform Connections')}</span>
          <span class="badge ${totalConnected === totalPlatforms ? 'badge-approved' : totalConnected > 0 ? 'badge-pending' : ''}">
            ${totalConnected} / ${totalPlatforms} connected
          </span>
        </div>
        <div class="setup-progress-bar" style="margin-top: var(--space-md);">
          <div class="setup-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="setup-overview-platforms">
          ${statuses.map((s) => `
            <div class="setup-overview-platform" title="${s.label}: ${s.isConnected ? 'Connected' : 'Not connected'}">
              ${renderConnectionDot(s.isConnected)}
              <span class="setup-overview-platform-name">${s.label}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: var(--space-md); display: flex; justify-content: flex-end;">
          <button class="btn btn--ghost btn--sm" id="setup-clear-all">
            ${iconX()} Clear all credentials
          </button>
        </div>
      </div>

      <!-- Platform cards -->
      <div class="setup-platforms-grid" id="setup-platforms-grid">
        ${PLATFORM_SLOTS.map(renderPlatformCard).join('')}
      </div>
    </div>
  `;
}

// ── Event binding ─────────────────────────────────────────────────────────────

export function bindSetupEvents(): void {
  function reNavigate(): void {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'setup' }));
  }

  // Save form submit
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (!form.dataset.platform) return;

    e.preventDefault();
    const platformId = form.dataset.platform as PlatformId;
    const slot = PLATFORM_SLOTS.find((s) => s.id === platformId);
    if (!slot) return;

    let savedCount = 0;

    slot.fields.forEach((field) => {
      const input = form.querySelector<HTMLInputElement>(
        `input[data-platform="${platformId}"][data-field="${field.key}"]`
      );
      if (!input) return;
      const val = input.value.trim();
      if (val) {
        setKey(platformId, field.key, val);
        savedCount++;
      }
    });

    if (savedCount > 0) {
      toastSuccess(`${slot.label} credentials saved (${savedCount} field${savedCount !== 1 ? 's' : ''} updated).`);
    } else {
      toastInfo('No new values entered — nothing was changed.');
    }

    reNavigate();
  });

  // Clear platform
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-setup-clear]') as HTMLElement | null;
    if (!btn) return;

    const platformId = btn.dataset.setupClear as PlatformId;
    const slot = PLATFORM_SLOTS.find((s) => s.id === platformId);
    if (!slot) return;

    clearPlatform(platformId);
    toastInfo(`${slot.label} credentials cleared.`);
    reNavigate();
  });

  // Clear all
  document.addEventListener('click', (e) => {
    const btn = e.target as HTMLElement;
    if (btn.id !== 'setup-clear-all' && !btn.closest('#setup-clear-all')) return;

    const connected = connectedCount();
    if (connected === 0) {
      toastInfo('No credentials are saved — nothing to clear.');
      return;
    }

    clearAll();
    toastError(`All ${connected} platform credential${connected !== 1 ? 's' : ''} cleared.`);
    reNavigate();
  });
}
