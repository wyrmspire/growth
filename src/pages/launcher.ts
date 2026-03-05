import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderLauncherPage(): string {
  const brief = engine.getCurrentBrief();
  const plan = engine.getCurrentPlan();
  const variants = engine.getCurrentVariants();
  const scores = engine.getCurrentScores();
  const profile = engine.getCurrentProfile();

  if (!profile) {
    return `
      <div class="page-header">
        <h1>🚀 Campaign Launcher</h1>
        <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">🔍</p>
        <p class="body-secondary">
          Complete <a href="#" data-nav="discovery">Business Discovery</a> first to define your ${tip('offer', 'offer')}.
        </p>
      </div>
    `;
  }

  if (!brief) {
    return `
      <div class="page-header">
        <h1>🚀 Campaign Launcher</h1>
        <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
      </div>
      ${renderLaunchForm(profile)}
    `;
  }

  return `
    <div class="page-header">
      <h1>🚀 Campaign Launcher</h1>
      <p>${tip('campaign', 'Campaign')} for <strong>${brief.offerName}</strong> targeting <strong>${brief.audience}</strong></p>
    </div>

    ${plan ? renderFunnelPreview(plan) : ''}
    ${variants && scores.length ? renderVariantTable(variants, scores) : ''}

    <div class="action-row action-row-bottom">
      <button class="btn btn-primary" id="send-to-review-btn">
        ${tip('reviewQueue', '📋 Send to Review')}
      </button>
    </div>
  `;
}

function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurrentProfile>>): string {
  return `
    <div class="card card-narrow">
      <div class="card-header">
        <span class="card-title">Create a ${tip('campaign', 'Campaign')}</span>
      </div>
      <form id="launch-form">
        <div class="form-group">
          <label>${tip('offer', 'Offer Name')}</label>
          <input class="form-input" id="launch-offer" value="${profile.hypothesis.name}" />
        </div>
        <div class="form-group">
          <label>${tip('icp', 'Target Audience')}</label>
          <input class="form-input" id="launch-audience" value="${profile.hypothesis.icp}" />
        </div>
        <div class="form-group">
          <label>${tip('channel', 'Channels')} (select which platforms to post on)</label>
          <div class="channel-row">
            <label class="channel-label">
              <input type="checkbox" value="meta" checked /> ${tip('channelMeta', 'Meta')}
            </label>
            <label class="channel-label">
              <input type="checkbox" value="linkedin" checked /> ${tip('channelLinkedin', 'LinkedIn')}
            </label>
            <label class="channel-label">
              <input type="checkbox" value="x" checked /> ${tip('channelX', 'X')}
            </label>
            <label class="channel-label">
              <input type="checkbox" value="email" /> ${tip('channelEmail', 'Email')}
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Goals (comma separated)</label>
          <input class="form-input" id="launch-goals" value="Generate leads, Build brand awareness, Drive demo bookings" />
        </div>
        <button type="submit" class="btn btn-primary form-submit">
          ${tip('generateCopy', '⚡ Generate Launch Pack')}
        </button>
      </form>
    </div>
  `;
}

function renderFunnelPreview(plan: NonNullable<ReturnType<typeof engine.getCurrentPlan>>): string {
  return `
    <h3 class="sub-heading">${tip('funnel', '🔻 Campaign Funnel')}</h3>
    <div class="funnel-visual">
      ${plan.stages.map(stage => `
        <div class="funnel-stage ${stage.name}" data-tip="${stage.name}">
          <div class="stage-name">${stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}</div>
          <div class="stage-meta">
            ${stage.channels.length} ${tip('channel', 'channels')} · ${stage.ctas.length} ${tip('cta', 'CTAs')}
          </div>
          <div class="stage-ctas">
            ${stage.ctas.join(' · ')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVariantTable(
  variants: NonNullable<ReturnType<typeof engine.getCurrentVariants>>,
  scores: ReturnType<typeof engine.getCurrentScores>,
): string {
  const scoreMap = new Map(scores.map(s => [s.variantId, s]));
  const sorted = [...variants.variants].sort((a, b) => {
    const sa = scoreMap.get(a.id)?.score || 0;
    const sb = scoreMap.get(b.id)?.score || 0;
    return sb - sa;
  });

  return `
    <hr class="section-divider" />
    <h3 class="section-heading">${tip('copy', '📝 Generated Copy')}</h3>
    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>${tip('channel', 'Channel')}</th>
            <th>Stage</th>
            <th>Headline</th>
            <th>${tip('cta', 'CTA')}</th>
            <th>${tip('score', 'Score')}</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(v => {
    const s = scoreMap.get(v.id);
    const scoreVal = s?.score || 0;
    const scoreClass = scoreVal >= 85 ? 'score-high' : scoreVal >= 70 ? 'score-mid' : 'score-low';
    return `
              <tr>
                <td><span class="badge badge-${v.channel === 'meta' ? 'scheduled' : v.channel === 'linkedin' ? 'approved' : 'pending'}">${v.channel}</span></td>
                <td data-tip="${v.stage}" class="has-tip cell-capitalize">${v.stage}</td>
                <td class="cell-truncate">${v.headline}</td>
                <td>${v.cta}</td>
                <td class="score-value score-${scoreClass}">${scoreVal}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function bindLauncherEvents(): void {
  const form = document.getElementById('launch-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

      const checkedChannels = Array.from(form.querySelectorAll('input[type=checkbox]:checked'))
        .map(c => (c as HTMLInputElement).value) as ('meta' | 'linkedin' | 'x' | 'email')[];

      engine.createCampaign({
        offerName: val('launch-offer'),
        audience: val('launch-audience'),
        channels: checkedChannels,
        goals: val('launch-goals').split(',').map(s => s.trim()),
      });

      window.dispatchEvent(new CustomEvent('navigate', { detail: 'launcher' }));
    });
  }

  const reviewBtn = document.getElementById('send-to-review-btn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      engine.sendToReview();
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }
}
