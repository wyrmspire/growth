/**
 * Preview Feed — PREV-1
 * Sandbox publishing destination that shows how published content would appear
 * on different platforms (Meta, LinkedIn, X, Email).
 * Posts are rendered in platform-realistic cards with accurate formatting.
 */

const PLATFORM_ICONS: Record<string, string> = {
    meta: '📘',
    linkedin: '💼',
    x: '🐦',
    email: '📧',
};

const PLATFORM_LABELS: Record<string, string> = {
    meta: 'Meta / Facebook',
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    email: 'Email Newsletter',
};

const PLATFORM_LIMITS: Record<string, number> = {
    meta: 2200,
    linkedin: 3000,
    x: 280,
    email: 5000,
};

interface PreviewItem {
    id: string;
    channel: string;
    headline?: string;
    content: string;
    cta?: string;
    publishedAt: string;
    campaignLabel: string;
}

const MOCK_POSTS: PreviewItem[] = [
    {
        id: 'prev-001',
        channel: 'meta',
        headline: 'Stop losing clients to slow project scoping',
        content: 'Most design studios spend 3-5 days writing project proposals that clients never read past page 2.\n\nWe built a 3-question qualifier that cuts scoping time by 60% — and our close rate actually went up.\n\nHere\'s what we changed 👇',
        cta: 'Download our qualifier template →',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        campaignLabel: 'Design Studio Qualifier',
    },
    {
        id: 'prev-002',
        channel: 'linkedin',
        headline: 'The real cost of manual data entry',
        content: 'I spoke with 12 small business owners last month. One pattern keeps showing up:\n\nThey\'re spending 8-12 hours/week on tasks that could be automated in an afternoon.\n\nThe bottleneck isn\'t technology — it\'s knowing which 3 processes to automate first.\n\nHere\'s the framework we use with clients to find those quick wins.',
        cta: 'Comment "AUTOMATE" and I\'ll send the framework',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        campaignLabel: 'Automation Quick Wins',
    },
    {
        id: 'prev-003',
        channel: 'x',
        content: 'Hot take: Your business doesn\'t need more leads.\n\nIt needs a faster way to qualify the ones you already have.\n\n3 questions. 2 minutes. 60% fewer wasted proposals.',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        campaignLabel: 'Design Studio Qualifier',
    },
    {
        id: 'prev-004',
        channel: 'email',
        headline: 'Your weekly growth tip: Automate before you hire',
        content: 'Hi there,\n\nBefore you post that job listing for an admin assistant, try this:\n\n1. List every task someone does more than 3x per week\n2. Circle the ones that follow a predictable pattern\n3. Automate just those circled items first\n\nMost businesses find they can save 10-15 hours/week — enough to delay a hire by 6 months while growing faster.\n\nWe put together a step-by-step guide for the most common automations.',
        cta: 'Read the full guide →',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        campaignLabel: 'Automation Quick Wins',
    },
];

function formatTime(iso: string): string {
    const d = new Date(iso);
    const hours = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
}

function renderPreviewCard(post: PreviewItem): string {
    const icon = PLATFORM_ICONS[post.channel] || '📄';
    const label = PLATFORM_LABELS[post.channel] || post.channel;
    const charLimit = PLATFORM_LIMITS[post.channel] || 2200;
    const charUsed = post.content.length;
    const charClass = charUsed > charLimit ? 'char-over' : charUsed > charLimit * 0.9 ? 'char-warn' : 'char-ok';

    const headlineHtml = post.headline
        ? `<h3 class="preview-headline">${post.headline}</h3>`
        : '';
    const ctaHtml = post.cta
        ? `<div class="preview-cta">${post.cta}</div>`
        : '';

    const contentFormatted = post.content
        .split('\n')
        .map((line: string) => line.trim() === '' ? '<br>' : `<p>${line}</p>`)
        .join('');

    return `
    <div class="preview-card card preview-${post.channel}" data-preview-id="${post.id}">
      <div class="preview-card-header">
        <span class="preview-platform">${icon} ${label}</span>
        <span class="preview-time">${formatTime(post.publishedAt)}</span>
      </div>
      <div class="preview-campaign-tag">${post.campaignLabel}</div>
      <div class="preview-body">
        ${headlineHtml}
        <div class="preview-content">${contentFormatted}</div>
        ${ctaHtml}
      </div>
      <div class="preview-footer">
        <span class="preview-chars ${charClass}">${charUsed} / ${charLimit} chars</span>
        <div class="preview-actions">
          <button class="btn btn--ghost btn--sm" data-preview-action="edit" data-preview-id="${post.id}">Edit</button>
          <button class="btn btn--ghost btn--sm btn--muted" data-preview-action="remove" data-preview-id="${post.id}">Remove</button>
        </div>
      </div>
    </div>
  `;
}

export function renderPreviewFeedPage(): string {
    return `
    <div class="page-shell">
      <div class="page-heading">
        <h1 class="page-title">Preview Feed</h1>
        <p class="page-subtitle">
          See how your published content looks before it goes live. Each card simulates
          the platform's format, character limits, and styling.
        </p>
      </div>

      <div class="coach-block">
        <div class="coach-block-icon">📺</div>
        <div class="coach-block-body">
          <strong>What you do here</strong>
          <p>Review published content in context. See exactly how posts will appear on Meta, LinkedIn, X, and in email — with accurate character counts and formatting.</p>
          <strong>Why it matters</strong>
          <p>Catching formatting issues before publishing saves embarrassment and wasted ad spend. This is your final quality check.</p>
          <strong>What comes next</strong>
          <p>Approved posts from the Calendar land here automatically. You can edit or remove before going live.</p>
        </div>
      </div>

      <div class="mock-notice">
        <span class="mock-badge">PREVIEW</span>
        Showing sample posts. Published content from the Calendar will appear here once the pipeline is connected.
      </div>

      <div class="feed-filters">
        <button class="chip chip--active" data-feed-filter="all">All platforms</button>
        <button class="chip" data-feed-filter="meta">📘 Meta</button>
        <button class="chip" data-feed-filter="linkedin">💼 LinkedIn</button>
        <button class="chip" data-feed-filter="x">🐦 X</button>
        <button class="chip" data-feed-filter="email">📧 Email</button>
      </div>

      <div class="preview-feed-list" id="preview-feed-list">
        ${MOCK_POSTS.map(renderPreviewCard).join('')}
      </div>

      <div class="feed-empty" id="feed-empty" style="display:none;">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No published content yet</h3>
          <p>When you publish from the Calendar, your content will appear here in platform-accurate preview cards.</p>
        </div>
      </div>
    </div>
  `;
}

export function bindPreviewFeedEvents(): void {
    // Platform filter chips
    document.addEventListener('click', (e) => {
        const chip = (e.target as HTMLElement).closest('[data-feed-filter]') as HTMLElement | null;
        if (!chip) return;
        const filter = chip.dataset.feedFilter;
        if (!filter) return;

        // Toggle active chip
        document.querySelectorAll('[data-feed-filter]').forEach((c) => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');

        // Filter cards
        const cards = document.querySelectorAll('.preview-card') as NodeListOf<HTMLElement>;
        cards.forEach((card) => {
            if (filter === 'all') {
                card.style.display = '';
            } else {
                card.style.display = card.classList.contains(`preview-${filter}`) ? '' : 'none';
            }
        });
    });

    // Card actions (remove)
    document.addEventListener('click', (e) => {
        const actionBtn = (e.target as HTMLElement).closest('[data-preview-action]') as HTMLElement | null;
        if (!actionBtn) return;
        const action = actionBtn.dataset.previewAction;
        const id = actionBtn.dataset.previewId;
        if (!action || !id) return;

        if (action === 'remove') {
            const card = document.querySelector(`[data-preview-id="${id}"].preview-card`);
            if (card) card.remove();
        }
    });
}
