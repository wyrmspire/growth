import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderReviewPage(): string {
  const items = engine.getReviewItems();
  const notice = engine.getPageNotice('review');

  if (!items.length) {
    return `
      <div class="page-header">
        <h1>${tip('reviewQueue', 'Review Queue')}</h1>
        <p>Approve or reject content before it goes live.</p>
      </div>
      ${notice ? renderPageNotice(notice) : ''}
      <div class="card card-empty-state">
        <p class="page-emoji">Review</p>
        <p class="body-secondary">
          Nothing to review yet. <a href="#" data-nav="launcher">Launch a campaign</a> and send copy to review.
        </p>
      </div>
    `;
  }

  const pending = items.filter((item) => item.state === 'pending');
  const approved = items.filter((item) => item.state === 'approved');
  const rejected = items.filter((item) => item.state === 'rejected');

  return `
    <div class="page-header">
      <h1>${tip('reviewQueue', 'Review Queue')}</h1>
      <p>${pending.length} items waiting for review · ${approved.length} approved · ${rejected.length} rejected</p>
    </div>

    ${notice ? renderPageNotice(notice) : ''}

    ${pending.length > 0 ? `
      <div class="action-row action-row-top">
        <button class="btn btn-success" id="approve-all-btn">
          ${tip('approve', 'Approve All')} (${pending.length})
        </button>
      </div>
    ` : `
      <div class="action-row action-row-top">
        <button class="btn btn-primary" id="schedule-all-btn">
          ${tip('schedule', 'Schedule All for Publishing')}
        </button>
      </div>
    `}

    <div class="card-grid">
      ${items.map((item) => `
        <div class="card">
          <div class="card-header">
            <span class="card-title card-title-clamp">${item.label}</span>
            <span class="badge badge-${item.state}">${item.state}</span>
          </div>
          <p class="body-muted">
            ${item.kind === 'asset' ? tip('copy', 'Ad Copy') : item.kind === 'reply' ? tip('draftReply', 'Reply Draft') : tip('offer', 'Offer')}
          </p>
          ${item.state === 'pending' ? `
            <div class="action-row">
              <button class="btn btn-success btn-sm approve-btn" data-id="${item.id}">${tip('approve', 'Approve')}</button>
              <button class="btn btn-danger btn-sm reject-btn" data-id="${item.id}">${tip('reject', 'Reject')}</button>
            </div>
          ` : ''}
        </div>
      `).join('')}
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

export function bindReviewEvents(): void {
  document.querySelectorAll('.approve-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = (button as HTMLElement).dataset.id || '';
      engine.approveItem(id as any);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  });

  document.querySelectorAll('.reject-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = (button as HTMLElement).dataset.id || '';
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
