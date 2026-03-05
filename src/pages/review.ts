import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderReviewPage(): string {
    const items = engine.getReviewItems();

    if (!items.length) {
        return `
      <div class="page-header">
        <h1>${tip('reviewQueue', '📋 Review Queue')}</h1>
        <p>Approve or reject content before it goes live.</p>
      </div>
      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
        <p style="font-size: 40px; margin-bottom: var(--space-md)">📭</p>
        <p style="color: var(--text-secondary)">
          Nothing to review yet. <a href="#" data-nav="launcher">Launch a campaign</a> and send copy to review.
        </p>
      </div>
    `;
    }

    const pending = items.filter(i => i.state === 'pending');
    const approved = items.filter(i => i.state === 'approved');
    const rejected = items.filter(i => i.state === 'rejected');

    return `
    <div class="page-header">
      <h1>${tip('reviewQueue', '📋 Review Queue')}</h1>
      <p>${pending.length} items waiting for review · ${approved.length} approved · ${rejected.length} rejected</p>
    </div>

    ${pending.length > 0 ? `
      <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md)">
        <button class="btn btn-success" id="approve-all-btn">
          ${tip('approve', '✓ Approve All')} (${pending.length})
        </button>
      </div>
    ` : `
      <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md)">
        <button class="btn btn-primary" id="schedule-all-btn">
          ${tip('schedule', '📅 Schedule All for Publishing')}
        </button>
      </div>
    `}

    <div class="card-grid">
      ${items.map(item => `
        <div class="card">
          <div class="card-header">
            <span class="card-title" style="font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              ${item.label}
            </span>
            <span class="badge badge-${item.state}">${item.state}</span>
          </div>
          <p style="color: var(--text-muted); font-size: 12px; margin-bottom: var(--space-md)">
            ${item.kind === 'asset' ? tip('copy', 'Ad Copy') : item.kind === 'reply' ? tip('draftReply', 'Reply Draft') : tip('offer', 'Offer')}
          </p>
          ${item.state === 'pending' ? `
            <div style="display: flex; gap: var(--space-sm)">
              <button class="btn btn-success btn-sm approve-btn" data-id="${item.id}">
                ${tip('approve', '✓ Approve')}
              </button>
              <button class="btn btn-danger btn-sm reject-btn" data-id="${item.id}">
                ${tip('reject', '✗ Reject')}
              </button>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function bindReviewEvents(): void {
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id || '';
            engine.approveItem(id as any);
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
        });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id || '';
            engine.rejectItem(id as any);
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
        });
    });

    const approveAllBtn = document.getElementById('approve-all-btn');
    if (approveAllBtn) {
        approveAllBtn.addEventListener('click', () => {
            engine.approveAll();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
        });
    }

    const scheduleBtn = document.getElementById('schedule-all-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            engine.scheduleAll();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
        });
    }
}
