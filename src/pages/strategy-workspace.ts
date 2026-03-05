import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';
import type { StarterPreset } from '../mock-engine';

export function renderStrategyWorkspacePage(): string {
    const interview = engine.getCurrentInterview();
    const hypotheses = engine.getCurrentHypotheses();
    const profile = engine.getCurrentProfile();
    const presets = engine.getStarterPresets();

    return `
    <div class="page-header">
      <h1>${tip('strategyWorkspace', '🗺️ Strategy Workspace')}</h1>
      <p>Review your business profile, compare offer ideas, and decide what to promote — before writing a single word of copy.</p>
    </div>

    <div class="coach-block" id="sw-coach-block">
      <div class="coach-block-icon">🎓</div>
      <div class="coach-block-body">
        <div class="coach-what"><strong>What you do here:</strong> Look at your approved business profile and offer side-by-side. Compare options, refine your thinking, and confirm you're promoting the right thing to the right people.</div>
        <div class="coach-why"><strong>Why it matters:</strong> Campaigns built on a weak or vague offer waste money. Spending a few minutes here sharpens your positioning before you spend time generating copy.</div>
        <div class="coach-next"><strong>What comes next:</strong> Once your offer is approved, go to <a href="#" data-nav="launcher">Campaign Launcher</a> to generate channel-specific copy and funnel steps.</div>
      </div>
    </div>

    ${!interview ? renderNoProfileState(presets) : renderWorkspaceContent(interview, hypotheses, profile, presets)}
  `;
}

function renderNoProfileState(presets: StarterPreset[]): string {
    return `
    <div class="sw-empty-state">
      <div class="sw-empty-icon">🔍</div>
      <h2>Start with Business Discovery</h2>
      <p>You haven't completed a business interview yet. The Strategy Workspace shows your profile and offer options once you do.</p>
      <a href="#" data-nav="discovery" class="btn btn-primary" style="margin-top: var(--space-md)">Go to Business Discovery →</a>
    </div>

    ${presets.length ? renderPresetPanel(presets, 'discovery') : ''}
  `;
}

function renderWorkspaceContent(
    interview: NonNullable<ReturnType<typeof engine.getCurrentInterview>>,
    hypotheses: ReturnType<typeof engine.getCurrentHypotheses>,
    profile: ReturnType<typeof engine.getCurrentProfile>,
    presets: StarterPreset[],
): string {
    return `
    <div class="sw-grid">

      <!-- Business Profile Card -->
      <div class="sw-panel">
        <div class="sw-panel-header">
          <span class="sw-panel-title">📋 Business Profile</span>
          <a href="#" data-nav="discovery" class="btn btn-ghost btn-sm">Edit →</a>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">Business</span>
          <span class="sw-field-value">${interview.data.businessName}</span>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">Industry</span>
          <span class="sw-field-value">${interview.data.industry}</span>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">${tip('icp', 'Target Customer')}</span>
          <span class="sw-field-value">${interview.data.targetCustomer}</span>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">What you offer</span>
          <span class="sw-field-value">${interview.data.currentOfferings.join(', ')}</span>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">Customer pain points</span>
          <span class="sw-field-value">${interview.data.painPoints.join(', ')}</span>
        </div>
        <div class="sw-field-row">
          <span class="sw-field-label">Your edge</span>
          <span class="sw-field-value">${interview.data.competitiveAdvantage}</span>
        </div>
      </div>

      <!-- Offer Status Card -->
      <div class="sw-panel ${profile ? 'sw-panel--approved' : ''}">
        <div class="sw-panel-header">
          <span class="sw-panel-title">
            ${profile ? '✅ Approved Offer' : `${tip('offerHypothesis', '💡 Offer Status')}`}
          </span>
          ${profile ? '<span class="badge badge-approved">Ready to Launch</span>' : '<span class="badge badge-pending">Pending Selection</span>'}
        </div>
        ${profile ? `
          <p class="sw-offer-name">${profile.hypothesis.name}</p>
          <p class="sw-offer-sub">${profile.hypothesis.angle}</p>
          <p class="sw-offer-icp">Targeting: <strong>${profile.hypothesis.icp}</strong></p>
          <p class="sw-offer-signals">Backed by ${profile.signals.length} market signal${profile.signals.length !== 1 ? 's' : ''}.</p>
          <div class="sw-approved-actions">
            <a href="#" data-nav="launcher" class="btn btn-primary btn-sm">Launch Campaign →</a>
            <a href="#" data-nav="discovery" class="btn btn-ghost btn-sm">Review Offer Options</a>
          </div>
        ` : `
          <p class="sw-offer-sub">You have ${hypotheses.length} offer suggestion${hypotheses.length !== 1 ? 's' : ''} to review. Choose one to approve.</p>
          <a href="#" data-nav="discovery" class="btn btn-primary btn-sm" style="margin-top: var(--space-md)">Review Suggestions →</a>
        `}
      </div>

    </div>

    ${hypotheses.length ? renderOfferComparison(hypotheses, profile) : ''}

    ${renderPresetPanel(presets, 'strategy')}
  `;
}

function renderOfferComparison(
    hypotheses: ReturnType<typeof engine.getCurrentHypotheses>,
    profile: ReturnType<typeof engine.getCurrentProfile>,
): string {
    const approvedIdx = profile
        ? hypotheses.findIndex(h => h.name === profile.hypothesis.name)
        : -1;

    return `
    <hr class="section-divider" />
    <h2 style="margin-bottom: var(--space-sm)">${tip('offerHypothesis', '💡 All Offer Options')}</h2>
    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-lg)">
      These were generated from your business interview. Compare them here before committing to one.
    </p>
    <div class="card-grid">
      ${hypotheses.map((h, i) => `
        <div class="card ${i === approvedIdx ? 'sw-card--selected' : ''}">
          <div class="card-header">
            <span class="card-title">${h.name}</span>
            <span class="badge badge-${h.confidence > 0.8 ? 'approved' : h.confidence > 0.7 ? 'scheduled' : 'pending'}">
              ${Math.round(h.confidence * 100)}% ${tip('confidence', 'confidence')}
            </span>
          </div>
          <p class="sw-hyp-angle"><strong>Angle:</strong> ${h.angle}</p>
          <p class="sw-hyp-icp"><strong>${tip('icp', 'Who it targets')}:</strong> ${h.icp}</p>
          <p class="sw-hyp-rationale"><strong>Why:</strong> ${h.rationale}</p>
          ${i === approvedIdx
            ? '<span class="badge badge-approved" style="margin-top: var(--space-sm)">✓ Your Chosen Offer</span>'
            : !profile
                ? `<button class="btn btn-primary btn-sm approve-offer-btn" data-index="${i}" style="margin-top: var(--space-md)">Choose This Offer →</button>`
                : ''
        }
        </div>
      `).join('')}
    </div>
  `;
}

function renderPresetPanel(presets: StarterPreset[], context: 'discovery' | 'strategy'): string {
    if (!presets.length) return '';
    return `
    <hr class="section-divider" />
    <div class="preset-panel">
      <div class="preset-panel-header">
        <span class="preset-panel-title">🧪 Try a Starter Example Business</span>
        <span class="preset-panel-sub">New here? Load a realistic example to see how the system works — no real data needed.</span>
      </div>
      <div class="preset-grid">
        ${presets.map(p => `
          <button class="preset-card load-preset-btn" data-preset-id="${p.id}" data-context="${context}">
            <span class="preset-icon">${p.icon}</span>
            <span class="preset-name">${p.name}</span>
            <span class="preset-desc">${p.description}</span>
          </button>
        `).join('')}
      </div>
      <p class="preset-note">Loading a preset fills in the Business Discovery form with realistic example data. You can edit any field before submitting.</p>
    </div>
  `;
}

export function bindStrategyWorkspaceEvents(): void {
    document.querySelectorAll('.approve-offer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt((btn as HTMLElement).dataset.index || '0');
            engine.approveOffer(idx);
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'strategy-workspace' }));
        });
    });

    document.querySelectorAll('.load-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetId = (btn as HTMLElement).dataset.presetId || '';
            const context = (btn as HTMLElement).dataset.context as 'discovery' | 'strategy';
            engine.loadStarterPreset(presetId);
            // Navigate to discovery to show the pre-filled form
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
        });
    });
}
