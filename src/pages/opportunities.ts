import {
  getSeedResearchRecords,
  sentenceCase,
} from '../../modules/social-scout/src/research-store';

/**
 * Opportunities Inbox — FUT-3 / RESEARCH-2
 * Local-first inbox backed by the repo research seed dataset.
 * No live scanning or auto-sending in this phase — all actions require explicit decision.
 */

type SeedRecord = ReturnType<typeof getSeedResearchRecords>[number];

type OpportunityView = {
  id: string;
  platform: string;
  platformIcon: string;
  sourceUrl: string;
  author: string;
  community: string;
  contentSnippet: string;
  score: number;
  riskFlags: string[];
  suggestedComment: string;
  reason: string;
  status: string;
  workflow: string;
  whyNow: string;
};

const PLATFORM_META: Record<string, { label: string; icon: string }> = {
  reddit: { label: 'Reddit', icon: '🟠' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  facebook: { label: 'Facebook', icon: '🔵' },
  x: { label: 'X', icon: '🐦' },
  instagram: { label: 'Instagram', icon: '📸' },
  youtube: { label: 'YouTube', icon: '▶️' },
};

function mapRecordToOpportunity(record: SeedRecord): OpportunityView {
  const platformMeta = PLATFORM_META[record.source.platform] ?? {
    label: sentenceCase(record.source.platform),
    icon: '📡',
  };

  return {
    id: record.id,
    platform: platformMeta.label,
    platformIcon: platformMeta.icon,
    sourceUrl: record.source.url,
    author: record.source.author,
    community: record.source.community,
    contentSnippet: `“${record.summary}”`,
    score: record.scoring.total,
    riskFlags: record.opportunity.riskFlags,
    suggestedComment: record.opportunity.suggestedReply,
    reason: record.opportunity.recommendedAction,
    status: record.status,
    workflow: record.operatorFit.workflow,
    whyNow: record.operatorFit.whyNow,
  };
}

const OPPORTUNITIES: OpportunityView[] = getSeedResearchRecords().map(mapRecordToOpportunity);
const PLATFORM_FILTERS = ['All platforms', ...new Set(OPPORTUNITIES.map((opp) => opp.platform))];

function renderOpportunityCard(opp: OpportunityView): string {
  const riskTag = opp.riskFlags.length > 0
    ? `<span class="risk-flag">⚠ ${opp.riskFlags.join(', ')}</span>`
    : '';

  return `
    <div class="opportunity-card card" data-opp-id="${opp.id}" data-opp-platform="${opp.platform}">
      <div class="opp-header">
        <span class="opp-platform">${opp.platformIcon} ${opp.platform}</span>
        <span class="opp-score score-badge">Score: ${opp.score}</span>
        <span class="opp-status">${sentenceCase(opp.status)}</span>
        ${riskTag}
      </div>
      <div class="opp-source">
        <span class="opp-author">${opp.author}</span>
        <span class="opp-source-sep">•</span>
        <span>${opp.community}</span>
      </div>
      <blockquote class="opp-snippet">${opp.contentSnippet}</blockquote>
      <div class="opp-context">
        <div><strong>Workflow:</strong> ${opp.workflow}</div>
        <div><strong>Why now:</strong> ${opp.whyNow}</div>
      </div>
      <div class="opp-suggestion">
        <label class="field-label">Suggested reply <span class="advisory-tag">— Advisory · Edit before using</span></label>
        <div class="opp-draft">${opp.suggestedComment}</div>
        <div class="opp-reason field-hint">${opp.reason}</div>
      </div>
      <div class="opp-actions">
        <a class="btn btn--ghost btn--sm" href="${opp.sourceUrl}" target="_blank" rel="noreferrer">View source</a>
        <button class="btn btn--primary btn--sm" data-opp-action="approve" data-opp-id="${opp.id}" ${opp.riskFlags.length ? 'disabled' : ''}>
          Approve for reply
        </button>
        <button class="btn btn--ghost btn--sm" data-opp-action="edit" data-opp-id="${opp.id}">
          Edit draft
        </button>
        <button class="btn btn--ghost btn--sm" data-opp-action="skip" data-opp-id="${opp.id}">
          Skip
        </button>
        <button class="btn btn--ghost btn--sm btn--muted" data-opp-action="mute" data-opp-id="${opp.id}">
          Mute source
        </button>
      </div>
      ${opp.riskFlags.length ? '<p class="risk-notice">This opportunity has risk flags and requires individual manual review — bulk approval is disabled.</p>' : ''}
    </div>
  `;
}

function renderOpportunitiesList(platformFilter = 'All platforms'): string {
  const visibleOpportunities = platformFilter === 'All platforms'
    ? OPPORTUNITIES
    : OPPORTUNITIES.filter((opp) => opp.platform === platformFilter);

  if (visibleOpportunities.length === 0) {
    return `
      <div class="card opp-empty-state">
        <div class="empty-icon">🗂️</div>
        <h3>No local research items match this filter</h3>
        <p>Keep the workflow manual-first for now: add or update records in <code>data/research/opportunities.seed.json</code> and review them here before doing anything outbound.</p>
      </div>
    `;
  }

  return visibleOpportunities.map(renderOpportunityCard).join('');
}

export function renderOpportunitiesPage(): string {
  return `
    <div class="page-shell">
      <div class="page-heading">
        <h1 class="page-title">Opportunities Inbox</h1>
        <p class="page-subtitle">
          Conversations where you could add real value. Scored and surfaced for you
          to review — nothing goes out without your approval.
        </p>
      </div>

      <div class="coach-block">
        <div class="coach-block-icon">📡</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Review locally captured research opportunities before deciding whether they are worth engaging with. Each card shows the pain point, workflow context, and an advisory draft reply.</p>
          <strong>Why it matters</strong>
          <p>This keeps the research loop grounded in durable repo data instead of brittle live scanning. It is a pattern library first, not an autonomous outreach engine.</p>
          <strong>What comes next</strong>
          <p>Approved replies enter your Review Queue before sending. Nothing goes out automatically.</p>
        </div>
      </div>

      <div class="mock-notice">
        <span class="mock-badge">LOCAL DATA</span>
        This inbox is rendered from the repo research seed file so you can review opportunities offline before any future integrations exist.
      </div>

      <div class="opp-filters" id="opportunities-filters">
        ${PLATFORM_FILTERS.map((filter, index) => `
          <button class="chip ${index === 0 ? 'chip--active' : ''}" data-opp-filter="${filter}">${filter}</button>
        `).join('')}
      </div>

      <div class="opportunities-list" id="opportunities-list">
        ${renderOpportunitiesList()}
      </div>
    </div>
  `;
}

export function bindOpportunitiesEvents(): void {
  document.addEventListener('click', (e) => {
    const filterTarget = (e.target as HTMLElement).closest('[data-opp-filter]') as HTMLElement | null;
    if (filterTarget) {
      const nextFilter = filterTarget.dataset.oppFilter;
      if (!nextFilter) return;

      const filterButtons = Array.from(document.querySelectorAll('[data-opp-filter]')) as HTMLElement[];
      for (const button of filterButtons) {
        button.classList.toggle('chip--active', button.dataset.oppFilter === nextFilter);
      }

      const list = document.getElementById('opportunities-list');
      if (list) {
        list.innerHTML = renderOpportunitiesList(nextFilter);
      }
      return;
    }

    const target = (e.target as HTMLElement).closest('[data-opp-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.oppAction;
    const oppId = target.dataset.oppId;
    if (!action || !oppId) return;

    const card = document.querySelector(`[data-opp-id="${oppId}"].opportunity-card`) as HTMLElement | null;

    if (action === 'approve') {
      if (card) {
        card.classList.add('opp-card--done');
        const actions = card.querySelector('.opp-actions');
        if (actions) {
          actions.innerHTML = '<span class="status-badge status-badge--green">✓ Sent to Review Queue</span>';
        }
      }
    } else if (action === 'edit') {
      const draft = card?.querySelector('.opp-draft');
      if (draft) {
        draft.insertAdjacentHTML('afterend', '<p class="body-note">Draft editing stays manual for now — update the local research record or future approval flow before sending.</p>');
        target.setAttribute('disabled', 'true');
      }
    } else if (action === 'skip' || action === 'mute') {
      if (card) card.remove();
    }
  });
}
