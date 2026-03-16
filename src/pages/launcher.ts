import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';
import { toastSuccess } from '../components/toast';
import { getPlatformStatuses as setupStatuses, type PlatformId } from '../setup-store';

export function renderLauncherPage(): string {
  const brief = engine.getCurrentBrief();
  const plan = engine.getCurrentPlan();
  const variants = engine.getCurrentVariants();
  const scores = engine.getCurrentScores();
  const profile = engine.getCurrentProfile();
  const advisory = engine.getLaunchAdvisory();
  const notice = engine.getPageNotice('launcher');

  if (!profile) {
    return `
      <div class="page-header">
        <h1>Campaign Launcher</h1>
        <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
      </div>
      <div class="coach-block">
        <div class="coach-block-icon">Guide</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Turn an approved offer into a real campaign plan, then generate channel-specific copy you can review before publishing.</p>
          <strong>Why it matters</strong>
          <p>This is where strategy becomes execution. Good launch structure makes later approvals and scheduling much easier.</p>
          <strong>What comes next</strong>
          <p>Complete Business Discovery first, then come back here to generate the launch pack.</p>
        </div>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">Plan</p>
        <p class="body-secondary">
          Complete <a href="#" data-nav="discovery">Business Discovery</a> first to define your ${tip('offer', 'offer')}.
        </p>
      </div>
    `;
  }

  if (!brief) {
    return `
      <div class="page-header">
        <h1>Campaign Launcher</h1>
        <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
      </div>
      <div class="coach-block">
        <div class="coach-block-icon">Guide</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Confirm the offer, choose channels, and generate copy suggestions for each stage of your funnel.</p>
          <strong>Why it matters</strong>
          <p>The same offer needs different wording for awareness, consideration, and decision. This step gives you a structured first draft.</p>
          <strong>What comes next</strong>
          <p>Once the variants look good, move them into the Review Queue for approval.</p>
        </div>
      </div>
      ${notice ? renderPageNotice(notice) : ''}
      ${advisory ? renderAdvisory(advisory) : ''}
      ${renderLaunchForm(profile)}
    `;
  }

  return `
    <div class="page-header">
      <h1>Campaign Launcher</h1>
      <p>${tip('campaign', 'Campaign')} for <strong>${brief.offerName}</strong> targeting <strong>${brief.audience}</strong></p>
    </div>

    ${notice ? renderPageNotice(notice) : ''}
    ${advisory ? renderAdvisory(advisory) : ''}
    ${plan ? renderFunnelPreview(plan) : ''}
    ${variants && scores.length ? renderVariantTable(variants, scores) : ''}

    <div class="action-row action-row-bottom">
      <button class="btn btn-primary" id="send-to-review-btn">
        ${tip('reviewQueue', 'Send to Review')}
      </button>
    </div>
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

function advisoryPhaseClass(phase: NonNullable<ReturnType<typeof engine.getLaunchAdvisory>>['phase']): string {
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

function renderAdvisory(advisory: NonNullable<ReturnType<typeof engine.getLaunchAdvisory>>): string {
  return `
    <div class="advisor-panel">
      <div class="advisor-panel-header">
        <span class="badge badge-approved">${advisory.source}</span>
        <span class="badge badge-${advisoryPhaseClass(advisory.phase)}">${advisory.phase}</span>
      </div>
      <h3 class="advisor-panel-title">Copy advisory state</h3>
      <p class="advisor-panel-summary">${advisory.summary}</p>
      <ul class="advisor-panel-list">
        ${advisory.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurrentProfile>>): string {
  // Build platform list with connected status from setup-store
  const statuses = setupStatuses();
  const statusMap = new Map(statuses.map(s => [s.id, s.isConnected]));

  // Core channels (always present) + extended channels
  const coreChannels: { value: string; label: string; platformId: PlatformId | null; checked: boolean }[] = [
    { value: 'meta', label: 'Meta', platformId: 'facebook', checked: true },
    { value: 'linkedin', label: 'LinkedIn', platformId: 'linkedin', checked: true },
    { value: 'x', label: 'X', platformId: 'twitter', checked: true },
    { value: 'email', label: 'Email', platformId: null, checked: false },
  ];
  const extendedChannels: { value: string; label: string; platformId: PlatformId }[] = [
    { value: 'instagram', label: 'Instagram', platformId: 'instagram' },
    { value: 'reddit', label: 'Reddit', platformId: 'reddit' },
    { value: 'tiktok', label: 'TikTok', platformId: 'tiktok' },
    { value: 'youtube', label: 'YouTube', platformId: 'youtube' },
    { value: 'substack', label: 'Substack', platformId: 'substack' },
    { value: 'threads', label: 'Threads', platformId: null as unknown as PlatformId },
  ];

  function channelCheckbox(ch: { value: string; label: string; platformId: PlatformId | null; checked?: boolean }): string {
    const connected = ch.platformId ? (statusMap.get(ch.platformId) ?? false) : false;
    const dot = connected
      ? '<span class="channel-dot channel-dot--connected" title="Connected"></span>'
      : '<span class="channel-dot channel-dot--disconnected" title="Not set up"></span>';
    const hint = connected ? '' : ' <span class="channel-hint">(not set up)</span>';
    return `<label class="channel-label"><input type="checkbox" value="${ch.value}" ${ch.checked ? 'checked' : ''} />${dot} ${tip('channel' + ch.label, ch.label)}${hint}</label>`;
  }

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
            ${coreChannels.map(ch => channelCheckbox(ch)).join('\n            ')}
          </div>
          <div class="channel-row channel-row--extended">
            ${extendedChannels.map(ch => channelCheckbox({ ...ch, checked: false })).join('\n            ')}
          </div>
        </div>
        <div class="form-group">
          <label>Goals (comma separated)</label>
          <input class="form-input" id="launch-goals" value="Generate leads, Build brand awareness, Drive demo bookings" />
        </div>
        <button type="submit" class="btn btn-primary form-submit">
          ${tip('generateCopy', 'Generate Launch Pack')}
        </button>
      </form>
    </div>
  `;
}

function renderFunnelPreview(plan: NonNullable<ReturnType<typeof engine.getCurrentPlan>>): string {
  return `
    <h3 class="sub-heading">${tip('funnel', 'Campaign Funnel')}</h3>
    <div class="funnel-visual">
      ${plan.stages.map((stage) => `
        <div class="funnel-stage ${stage.name}" data-tip="${stage.name}">
          <div class="stage-name">${stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}</div>
          <div class="stage-meta">${stage.channels.length} channels · ${stage.ctas.length} CTAs</div>
          <div class="stage-ctas">${stage.ctas.join(' · ')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVariantTable(
  variants: NonNullable<ReturnType<typeof engine.getCurrentVariants>>,
  scores: ReturnType<typeof engine.getCurrentScores>,
): string {
  const scoreMap = new Map(scores.map((score) => [score.variantId, score]));
  const sorted = [...variants.variants].sort((left, right) => {
    const leftScore = scoreMap.get(left.id)?.score || 0;
    const rightScore = scoreMap.get(right.id)?.score || 0;
    return rightScore - leftScore;
  });

  return `
    <hr class="section-divider" />
    <h3 class="section-heading">${tip('copy', 'Generated Copy')}</h3>
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
          ${sorted.map((variant) => {
            const score = scoreMap.get(variant.id)?.score || 0;
            const scoreClass = score >= 85 ? 'score-high' : score >= 70 ? 'score-mid' : 'score-low';
            return `
              <tr>
                <td><span class="badge badge-${variant.channel === 'meta' ? 'scheduled' : variant.channel === 'linkedin' ? 'approved' : 'pending'}">${variant.channel}</span></td>
                <td class="cell-capitalize">${variant.stage}</td>
                <td class="cell-truncate">${variant.headline}</td>
                <td>${variant.cta}</td>
                <td class="score-value score-${scoreClass}">${score}</td>
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
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
      const checkedChannels = Array.from(form.querySelectorAll('input[type=checkbox]:checked'))
        .map((checkbox) => (checkbox as HTMLInputElement).value) as import('@core/types').ChannelName[];

      engine.trackLearningAction('launch.generate-pack', 'launcher', { channelCount: checkedChannels.length });
      await engine.createCampaignWithAdvisory({
        offerName: val('launch-offer'),
        audience: val('launch-audience'),
        channels: checkedChannels,
        goals: val('launch-goals').split(',').map((goal) => goal.trim()).filter(Boolean),
      });

      toastSuccess('Launch pack generated — copy variants are ready for review.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'launcher' }));
    });
  }

  const reviewBtn = document.getElementById('send-to-review-btn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      engine.trackLearningAction('launch.send-to-review', 'launcher');
      engine.sendToReview();
      toastSuccess('Copy variants sent to the Review Queue.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }
}
