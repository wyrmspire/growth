/**
 * Integrations — FUT-2
 * Mock-safe settings shell for Slack and Office 365 connections.
 * Lets operators see connection status and configure notification targets.
 * No live API calls are made in this phase.
 */

import { iconLink } from '../icons';

export function renderIntegrationsPage(): string {
    return `
    <div class="page-shell">
      <div class="page-heading">
        <h1 class="page-title">Integrations</h1>
        <p class="page-subtitle">
          Connect GrowthOps OS to your team tools. When a campaign batch is ready for review,
          we can notify your Slack channel or Outlook inbox automatically.
        </p>
      </div>

      <div class="coach-block">
        <div class="coach-block-icon">${iconLink()}</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Connect your Slack workspace or Office 365 account so review notifications go directly to where your team already works.</p>
          <strong>Why it matters</strong>
          <p>Right now your team has to check the app to know when content is ready. With integrations, the app comes to them.</p>
          <strong>What comes next</strong>
          <p>Once connected, the Review Queue will automatically dispatch a summary to your chosen channel or inbox when a new batch is ready.</p>
        </div>
      </div>

      <div class="mock-notice">
        <span class="mock-badge">COMING SOON</span>
        Live connections are not active yet. This page shows the planned integration interface.
        Notifications currently require you to check the Review Queue manually.
      </div>

      <div class="integrations-grid">
        <div class="integration-card card">
          <div class="integration-header">
            <span class="integration-logo">🟩</span>
            <div>
              <div class="integration-name">Slack</div>
              <div class="integration-status integration-status--disconnected">Not connected</div>
            </div>
          </div>
          <p class="integration-desc">
            Post approval-ready summaries to a Slack channel. Your team approves or requests
            changes without leaving Slack (Phase 2).
          </p>
          <div class="integration-fields">
            <label class="field-label">Default notification channel</label>
            <input class="field-input" type="text" placeholder="#campaign-reviews" disabled />
          </div>
          <div class="integration-actions">
            <button class="btn btn--primary" disabled>Connect Slack</button>
            <button class="btn btn--ghost" disabled>Send test message</button>
          </div>
        </div>

        <div class="integration-card card">
          <div class="integration-header">
            <span class="integration-logo">🔷</span>
            <div>
              <div class="integration-name">Office 365</div>
              <div class="integration-status integration-status--disconnected">Not connected</div>
            </div>
          </div>
          <p class="integration-desc">
            Send approval digests to Outlook and optionally create calendar holds for campaign
            launch windows via Microsoft Graph.
          </p>
          <div class="integration-fields">
            <label class="field-label">Default approval recipient</label>
            <input class="field-input" type="email" placeholder="reviewer@yourcompany.com" disabled />
          </div>
          <div class="integration-actions">
            <button class="btn btn--primary" disabled>Connect Office 365</button>
            <button class="btn btn--ghost" disabled>Send test email</button>
          </div>
        </div>
      </div>

      <div class="security-notice card">
        <span class="security-notice-icon">🔒</span>
        <div>
          <strong>Security</strong>
          <p>OAuth tokens are encrypted at rest and never stored in client state. You can revoke access at any time from this page.</p>
        </div>
      </div>
    </div>
  `;
}

export function bindIntegrationsEvents(): void {
    // No live events in mock mode — controls are disabled.
}
