import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderDiscoveryPage(): string {
    const interview = engine.getCurrentInterview();
    const hypotheses = engine.getCurrentHypotheses();
    const profile = engine.getCurrentProfile();

    const stepIndex = !interview ? 0 : !hypotheses.length ? 1 : !profile ? 2 : 3;
    const steps = ['Your Business', 'Offer Suggestions', 'Choose & Approve'];

    return `
    <div class="page-header">
      <h1>${tip('businessDiscovery', '🔍 Business Discovery')}</h1>
      <p>Tell us about your business so we can suggest the best marketing strategy.</p>
    </div>

    <div class="wizard-steps">
      ${steps.map((s, i) => `
        <div class="wizard-step ${i < stepIndex ? 'complete' : i === stepIndex ? 'active' : ''}">
          <span class="step-num">${i < stepIndex ? '✓' : i + 1}</span>
          ${s}
        </div>
      `).join('')}
    </div>

    ${stepIndex === 0 ? renderInterviewForm() : ''}
    ${stepIndex === 1 || (stepIndex > 1 && hypotheses.length) ? renderHypotheses(hypotheses, !!profile) : ''}
    ${profile ? renderApprovedProfile(profile) : ''}
  `;
}

function renderInterviewForm(): string {
    return `
    <div class="card" style="max-width: 640px">
      <div class="card-header">
        <span class="card-title">Tell us about your business</span>
      </div>
      <form id="discovery-form">
        <div class="form-group">
          <label>${tip('offer', 'Business Name')}</label>
          <input class="form-input" id="disc-name" value="GrowthOps Automation" />
        </div>
        <div class="form-group">
          <label>Industry</label>
          <input class="form-input" id="disc-industry" value="Marketing Technology" />
        </div>
        <div class="form-group">
          <label>${tip('icp', 'Who is your ideal customer?')}</label>
          <input class="form-input" id="disc-customer" value="Small business owners who run their own marketing" />
        </div>
        <div class="form-group">
          <label>What do you currently offer? (comma separated)</label>
          <input class="form-input" id="disc-offerings" value="Campaign management, Copy generation, Social scheduling" />
        </div>
        <div class="form-group">
          <label>What problems do your customers face? (comma separated)</label>
          <input class="form-input" id="disc-pains" value="Too many tools, Inconsistent messaging, Missed posting windows" />
        </div>
        <div class="form-group">
          <label>What makes you different from competitors?</label>
          <textarea class="form-input" id="disc-advantage">All-in-one system with AI-assisted copy and human approval gates</textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: var(--space-md)">
          Complete Interview →
        </button>
      </form>
    </div>
  `;
}

function renderHypotheses(hypotheses: ReturnType<typeof engine.getCurrentHypotheses>, locked: boolean): string {
    if (!hypotheses.length) return '';

    return `
    <hr class="section-divider" />
    <h2 style="margin-bottom: var(--space-md)">${tip('offerHypothesis', '💡 Offer Suggestions')}</h2>
    <p style="color: var(--text-secondary); margin-bottom: var(--space-lg)">
      Based on your interview, here are recommended offers ranked by ${tip('confidence', 'confidence')}.
    </p>
    <div class="card-grid">
      ${hypotheses.map((h, i) => `
        <div class="card">
          <div class="card-header">
            <span class="card-title">${h.name}</span>
            <span class="badge badge-${h.confidence > 0.8 ? 'approved' : h.confidence > 0.7 ? 'scheduled' : 'pending'}">
              ${Math.round(h.confidence * 100)}% ${tip('confidence', 'confident')}
            </span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-sm)">
            <strong>Angle:</strong> ${h.angle}
          </p>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-sm)">
            <strong>${tip('icp', 'Target Customer')}:</strong> ${h.icp}
          </p>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-md)">
            <strong>Why:</strong> ${h.rationale}
          </p>
          ${!locked ? `
            <button class="btn btn-primary btn-sm approve-offer-btn" data-index="${i}">
              ${tip('approve', 'Choose This Offer')} →
            </button>
          ` : h.rank === 1 ? '<span class="badge badge-approved">✓ Selected</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderApprovedProfile(profile: ReturnType<typeof engine.getCurrentProfile>): string {
    if (!profile) return '';
    return `
    <hr class="section-divider" />
    <div class="card" style="border-color: var(--accent-green); max-width: 640px">
      <div class="card-header">
        <span class="card-title">✅ Offer Approved</span>
        <span class="badge badge-approved">Ready to Launch</span>
      </div>
      <p style="font-size: 15px; font-weight: 600; margin-bottom: var(--space-sm)">
        ${profile.hypothesis.name}
      </p>
      <p style="color: var(--text-secondary); font-size: 13px">
        ${profile.hypothesis.angle} — targeting ${profile.hypothesis.icp}
      </p>
      <p style="color: var(--text-muted); font-size: 12px; margin-top: var(--space-sm)">
        Backed by ${profile.signals.length} market signals. Head to 
        <a href="#" data-nav="launcher">Campaign Launcher</a> to create your first ${tip('campaign', 'campaign')}.
      </p>
    </div>
  `;
}

export function bindDiscoveryEvents(): void {
    const form = document.getElementById('discovery-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

            engine.submitDiscoveryInterview({
                businessName: val('disc-name'),
                industry: val('disc-industry'),
                targetCustomer: val('disc-customer'),
                currentOfferings: val('disc-offerings').split(',').map(s => s.trim()),
                painPoints: val('disc-pains').split(',').map(s => s.trim()),
                competitiveAdvantage: val('disc-advantage'),
            });

            engine.getOfferSuggestions();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
        });
    }

    document.querySelectorAll('.approve-offer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt((btn as HTMLElement).dataset.index || '0');
            engine.approveOffer(idx);
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
        });
    });
}
