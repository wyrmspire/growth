/**
 * Opportunities Inbox — FUT-3
 * Mock-safe shell for the social-scout opportunities discovery surface.
 * Shows scored opportunity cards from social sources for human review.
 * No live scanning or auto-sending in this phase — all actions require explicit decision.
 */

const MOCK_OPPORTUNITIES = [
    {
        id: 'opp-001',
        platform: 'Reddit',
        platformIcon: '🟠',
        sourceUrl: '#',
        author: 'u/smallbiz_owner',
        contentSnippet: '"Does anyone have a good recommendation for a local automation consultant? We\'re spending 10 hrs/week on manual data entry."',
        score: 87,
        riskFlags: [],
        suggestedComment: 'This is exactly the kind of problem we solve. Happy to share how we approach it — would a quick DM help?',
        reason: 'High intent service inquiry in a relevant community with no competing replies yet.',
    },
    {
        id: 'opp-002',
        platform: 'X',
        platformIcon: '🐦',
        sourceUrl: '#',
        author: '@designstudio_co',
        contentSnippet: '"Spent 3 days on a proposal nobody read. There has to be a better way to qualify clients before writing full briefs."',
        score: 72,
        riskFlags: [],
        suggestedComment: 'Proposal fatigue is real. We\'ve been experimenting with a 3-question qualifier that cuts pre-work in half — worth sharing if you\'re open to it.',
        reason: 'Relevant pain point, medium engagement potential, well within policy.',
    },
    {
        id: 'opp-003',
        platform: 'Facebook',
        platformIcon: '🔵',
        sourceUrl: '#',
        author: 'Local Business Owners Group',
        contentSnippet: '"Anyone tried using AI tools for marketing? Getting mixed results and not sure if it\'s worth the cost."',
        score: 61,
        riskFlags: ['third-party-group'],
        suggestedComment: 'It depends a lot on what you\'re trying to do. Happy to share what\'s worked for us vs what\'s been overhyped.',
        reason: 'Moderate relevance; risk flag for third-party group — routed to manual review only.',
    },
];

function renderOpportunityCard(opp: typeof MOCK_OPPORTUNITIES[0]): string {
    const riskTag = opp.riskFlags.length > 0
        ? `<span class="risk-flag">⚠ ${opp.riskFlags.join(', ')}</span>`
        : '';
    return `
    <div class="opportunity-card card" data-opp-id="${opp.id}">
      <div class="opp-header">
        <span class="opp-platform">${opp.platformIcon} ${opp.platform}</span>
        <span class="opp-score score-badge">Score: ${opp.score}</span>
        ${riskTag}
      </div>
      <div class="opp-source">
        <span class="opp-author">${opp.author}</span>
      </div>
      <blockquote class="opp-snippet">${opp.contentSnippet}</blockquote>
      <div class="opp-suggestion">
        <label class="field-label">Suggested reply <span class="advisory-tag">— Advisory · Edit before using</span></label>
        <div class="opp-draft">${opp.suggestedComment}</div>
        <div class="opp-reason field-hint">${opp.reason}</div>
      </div>
      <div class="opp-actions">
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
          <p>Review scored conversation opportunities from social platforms. Each card shows you why a thread is worth engaging with and a suggested comment to get started.</p>
          <strong>Why it matters</strong>
          <p>Showing up in the right conversations builds trust and generates leads without paid ads — but only if you engage authentically. These suggestions are a starting point, not a script.</p>
          <strong>What comes next</strong>
          <p>Approved replies enter your Review Queue before sending. Nothing goes out automatically.</p>
        </div>
      </div>

      <div class="mock-notice">
        <span class="mock-badge">MOCK DATA</span>
        This inbox shows example opportunities. Live social scanning starts after integrations are configured.
      </div>

      <div class="opp-filters">
        <button class="chip chip--active">All platforms</button>
        <button class="chip">Reddit</button>
        <button class="chip">X</button>
        <button class="chip">Facebook</button>
        <button class="chip">Instagram</button>
      </div>

      <div class="opportunities-list" id="opportunities-list">
        ${MOCK_OPPORTUNITIES.map(renderOpportunityCard).join('')}
      </div>
    </div>
  `;
}

export function bindOpportunitiesEvents(): void {
    document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('[data-opp-action]') as HTMLElement | null;
        if (!target) return;
        const action = target.dataset.oppAction;
        const oppId = target.dataset.oppId;
        if (!action || !oppId) return;

        const card = document.querySelector(`[data-opp-id="${oppId}"].opportunity-card`) as HTMLElement | null;

        if (action === 'approve') {
            if (card) {
                card.classList.add('opp-card--done');
                card.querySelector('.opp-actions')!.innerHTML =
                    '<span class="status-badge status-badge--green">✓ Sent to Review Queue</span>';
            }
        } else if (action === 'skip' || action === 'mute') {
            if (card) card.remove();
        }
    });
}
