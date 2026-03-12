import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';
import type { StarterPreset } from '../mock-engine';

export function renderDiscoveryPage(): string {
  const interview = engine.getCurrentInterview();
  const hypotheses = engine.getCurrentHypotheses();
  const profile = engine.getCurrentProfile();
  const advisory = engine.getDiscoveryAdvisory();
  const notice = engine.getPageNotice('discovery');
  const pendingPreset = engine.getPendingPreset();

  const stepIndex = !interview ? 0 : !hypotheses.length ? 1 : !profile ? 2 : 3;
  const steps = ['Your Business', 'Offer Suggestions', 'Choose & Approve'];

  return `
    <div class="page-header">
      <h1>${tip('businessDiscovery', 'Business Discovery')}</h1>
      <p>Tell us about your business so we can suggest the best marketing strategy.</p>
    </div>

    <div class="coach-block">
      <div class="coach-block-icon">Guide</div>
      <div class="coach-block-body">
        <strong>What you do here</strong>
        <p>Describe the business you want to promote. The system will suggest offer angles and explain why they might work.</p>
        <strong>Why it matters</strong>
        <p>Clear offers make every later step easier: copy, approvals, scheduling, and comment handling all get better when the starting position is sharp.</p>
        <strong>What comes next</strong>
        <p>After you approve an offer, move to Campaign Launcher to generate copy and build the funnel around it.</p>
      </div>
    </div>

    ${notice ? renderPageNotice(notice) : ''}
    ${advisory ? renderAdvisory(advisory) : ''}

    <div class="wizard-steps">
      ${steps.map((step, index) => `
        <div class="wizard-step ${index < stepIndex ? 'complete' : index === stepIndex ? 'active' : ''}">
          <span class="step-num">${index < stepIndex ? 'Done' : index + 1}</span>
          ${step}
        </div>
      `).join('')}
    </div>

    ${stepIndex === 0 ? renderPresetPicker(pendingPreset?.id || null) : ''}
    ${stepIndex === 0 ? renderInterviewForm(pendingPreset?.data || null) : ''}
    ${stepIndex === 1 || (stepIndex > 1 && hypotheses.length) ? renderHypotheses(hypotheses, !!profile) : ''}
    ${profile ? renderApprovedProfile(profile) : ''}
  `;
}

function renderPageNotice(notice: NonNullable<ReturnType<typeof engine.getPageNotice>>): string {
  return `
    <div class="status-banner status-banner--${notice.type}">
      <strong>${notice.type === 'error' ? 'Action needed' : 'Heads up'}</strong>
      <span>${notice.message}</span>
    </div>
  `;
}

function advisoryPhaseClass(phase: NonNullable<ReturnType<typeof engine.getDiscoveryAdvisory>>['phase']): string {
  switch (phase) {
    case 'approved':
      return 'approved';
    case 'in-review':
      return 'scheduled';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending';
  }
}

function renderAdvisory(advisory: NonNullable<ReturnType<typeof engine.getDiscoveryAdvisory>>): string {
  return `
    <div class="advisor-panel">
      <div class="advisor-panel-header">
        <span class="badge badge-approved">${advisory.source}</span>
        <span class="badge badge-${advisoryPhaseClass(advisory.phase)}">${advisory.phase}</span>
      </div>
      <h3 class="advisor-panel-title">AI advisory state</h3>
      <p class="advisor-panel-summary">${advisory.summary}</p>
      <ul class="advisor-panel-list">
        ${advisory.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderPresetPicker(activePresetId: string | null): string {
  const presets = engine.getStarterPresets();
  return `
    <div class="preset-strip">
      ${presets.map((preset) => `
        <button type="button" class="preset-chip ${preset.id === activePresetId ? 'preset-chip--active' : ''}" data-preset-id="${preset.id}">
          <span class="preset-chip-title">${preset.name}</span>
          <span class="preset-chip-desc">${preset.description}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderInterviewForm(preset: StarterPreset['data'] | null): string {
  const defaults = preset || {
    businessName: '',
    industry: '',
    targetCustomer: '',
    currentOfferings: [],
    painPoints: [],
    competitiveAdvantage: '',
  };

  return `
    <div class="card card-narrow">
      <div class="card-header">
        <span class="card-title">Tell us about your business</span>
      </div>
      <form id="discovery-form">
        <div class="form-group">
          <label>${tip('offer', 'Business Name')}</label>
          <input class="form-input" id="disc-name" value="${defaults.businessName}" />
        </div>
        <div class="form-group">
          <label>Industry</label>
          <input class="form-input" id="disc-industry" value="${defaults.industry}" />
        </div>
        <div class="form-group">
          <label>${tip('icp', 'Who is your ideal customer?')}</label>
          <input class="form-input" id="disc-customer" value="${defaults.targetCustomer}" />
        </div>
        <div class="form-group">
          <label>What do you currently offer? (comma separated)</label>
          <input class="form-input" id="disc-offerings" value="${defaults.currentOfferings.join(', ')}" />
        </div>
        <div class="form-group">
          <label>What problems do your customers face? (comma separated)</label>
          <input class="form-input" id="disc-pains" value="${defaults.painPoints.join(', ')}" />
        </div>
        <div class="form-group">
          <label>What makes you different from competitors?</label>
          <textarea class="form-input" id="disc-advantage">${defaults.competitiveAdvantage}</textarea>
        </div>
        <button type="submit" class="btn btn-primary form-submit">
          Complete Interview
        </button>
      </form>
    </div>
  `;
}

function renderHypotheses(hypotheses: ReturnType<typeof engine.getCurrentHypotheses>, locked: boolean): string {
  if (!hypotheses.length) return '';

  return `
    <hr class="section-divider" />
    <h2 class="section-heading">${tip('offerHypothesis', 'Offer Suggestions')}</h2>
    <p class="body-secondary sub-heading">
      Based on your interview, here are recommended offers ranked by ${tip('confidence', 'confidence')}.
    </p>
    <div class="card-grid">
      ${hypotheses.map((hypothesis, index) => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${hypothesis.name}</span>
            <span class="badge badge-${hypothesis.confidence > 0.8 ? 'approved' : hypothesis.confidence > 0.7 ? 'scheduled' : 'pending'}">
              ${Math.round(hypothesis.confidence * 100)}% ${tip('confidence', 'confident')}
            </span>
          </div>
          <p class="body-secondary"><strong>Angle:</strong> ${hypothesis.angle}</p>
          <p class="body-secondary"><strong>${tip('icp', 'Target Customer')}:</strong> ${hypothesis.icp}</p>
          <p class="body-secondary"><strong>Why:</strong> ${hypothesis.rationale}</p>
          ${!locked ? `
            <button class="btn btn-primary btn-sm approve-offer-btn" data-index="${index}">
              ${tip('approve', 'Choose This Offer')}
            </button>
          ` : hypothesis.rank === 1 ? '<span class="badge badge-approved">Selected</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderApprovedProfile(profile: NonNullable<ReturnType<typeof engine.getCurrentProfile>>): string {
  return `
    <hr class="section-divider" />
    <div class="card card-narrow card-approved">
      <div class="card-header">
        <span class="card-title">Offer Approved</span>
        <span class="badge badge-approved">Ready to Launch</span>
      </div>
      <p class="offer-title">${profile.hypothesis.name}</p>
      <p class="body-secondary">${profile.hypothesis.angle} targeting ${profile.hypothesis.icp}</p>
      <p class="body-muted">
        Backed by ${profile.signals.length} market signals. Head to
        <a href="#" data-nav="launcher">Campaign Launcher</a> to create your first ${tip('campaign', 'campaign')}.
      </p>
    </div>
  `;
}

export function bindDiscoveryEvents(): void {
  const form = document.getElementById('discovery-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

      engine.trackLearningAction('discovery.submit-interview', 'discovery');
      await engine.runDiscoveryInterview({
        businessName: val('disc-name'),
        industry: val('disc-industry'),
        targetCustomer: val('disc-customer'),
        currentOfferings: val('disc-offerings').split(',').map((item) => item.trim()).filter(Boolean),
        painPoints: val('disc-pains').split(',').map((item) => item.trim()).filter(Boolean),
        competitiveAdvantage: val('disc-advantage'),
      });
      engine.clearPendingPreset();
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
    });
  }

  document.querySelectorAll('[data-preset-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const presetId = (button as HTMLElement).dataset.presetId || '';
      engine.trackLearningAction('discovery.choose-preset', 'discovery', { presetId });
      engine.loadStarterPreset(presetId);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
    });
  });

  document.querySelectorAll('.approve-offer-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = parseInt((button as HTMLElement).dataset.index || '0', 10);
      engine.trackLearningAction('discovery.approve-offer', 'discovery', { offerIndex: index });
      engine.approveOffer(index);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
    });
  });
}
