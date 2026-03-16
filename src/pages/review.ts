/**
 * review.ts — Review Queue page
 *
 * REV-1: Side-by-side copy + platform preview layout
 * REV-2: Bulk select / batch approve / batch reject with floating action bar
 * REV-3: Per-item review notes (persisted in mock-engine)
 * REV-4: Status-transition animations (approving / rejecting CSS classes → re-render after 400ms)
 * REV-5: Decision audit trail expansion ("History ▾" toggle)
 * CAL-6: Toast integration
 */

import { tip } from '../components/tooltip';
import { toastSuccess, toastWarning, toastError, toastInfo } from '../components/toast';
import * as engine from '../mock-engine';

// ── Platform preview templates (REV-1) ───────────────────────────────────────
function renderMetaPreview(label: string): string {
  const headline = label.split(' - ')[2]?.replace(/\.\.\.$/, '') || label;
  const charCount = headline.length;
  const charClass = charCount > 2200 ? 'char-over' : charCount > 2000 ? 'char-warn' : 'char-ok';
  return `
    <div class="review-preview review-preview-meta">
      <div class="review-preview-header">
        <div class="review-preview-avatar meta-avatar">📘</div>
        <div>
          <div class="review-preview-author">Your Page</div>
          <div class="review-preview-platform-tag">Sponsored</div>
        </div>
      </div>
      <div class="review-preview-body">${headline}</div>
      <div class="review-preview-cta-bar">
        <span class="review-preview-cta-btn">Learn More</span>
      </div>
      <div class="review-preview-footer">
        <span class="${charClass}">${charCount}/2200 chars</span>
      </div>
    </div>
  `;
}

function renderLinkedInPreview(label: string): string {
  const headline = label.split(' - ')[2]?.replace(/\.\.\.$/, '') || label;
  const charCount = headline.length;
  const charClass = charCount > 3000 ? 'char-over' : charCount > 2800 ? 'char-warn' : 'char-ok';
  return `
    <div class="review-preview review-preview-linkedin">
      <div class="review-preview-header">
        <div class="review-preview-avatar linkedin-avatar">in</div>
        <div>
          <div class="review-preview-author">Your Company</div>
          <div class="review-preview-platform-tag">LinkedIn · Sponsored</div>
        </div>
      </div>
      <div class="review-preview-body">${headline}</div>
      <div class="review-preview-hashtags">#marketing #growth #business</div>
      <div class="review-preview-footer">
        <span class="${charClass}">${charCount}/3000 chars</span>
      </div>
    </div>
  `;
}

function renderXPreview(label: string): string {
  const headline = label.split(' - ')[2]?.replace(/\.\.\.$/, '') || label;
  const charCount = headline.length;
  const charClass = charCount > 280 ? 'char-over' : charCount > 240 ? 'char-warn' : 'char-ok';
  return `
    <div class="review-preview review-preview-x">
      <div class="review-preview-header">
        <div class="review-preview-avatar x-avatar">𝕏</div>
        <div>
          <div class="review-preview-author">@yourhandle</div>
          <div class="review-preview-platform-tag">X (Twitter)</div>
        </div>
      </div>
      <div class="review-preview-body">${headline}</div>
      <div class="review-preview-footer">
        <span class="${charClass}">${charCount}/280 chars</span>
      </div>
    </div>
  `;
}

function renderInstagramPreview(label: string): string {
  const headline = label.split(' - ')[2]?.replace(/\.\.\.$/, '') || label;
  const charCount = headline.length;
  const charClass = charCount > 2200 ? 'char-over' : charCount > 2000 ? 'char-warn' : 'char-ok';
  return `
    <div class="review-preview review-preview-instagram">
      <div class="review-preview-header">
        <div class="review-preview-avatar instagram-avatar">IG</div>
        <div class="review-preview-author">your_brand</div>
      </div>
      <div class="review-preview-image-placeholder">
        <div class="image-icon">🖼️</div>
      </div>
      <div class="review-preview-ig-actions">
        <span>❤️</span> <span>💬</span> <span>↗️</span>
      </div>
      <div class="review-preview-body">
        <strong>your_brand</strong> ${headline}
      </div>
      <div class="review-preview-footer">
        <span class="${charClass}">${charCount}/2200 chars</span>
      </div>
    </div>
  `;
}

function renderEmailPreview(label: string): string {
  const headline = label.split(' - ')[2]?.replace(/\.\.\.$/, '') || label;
  const charCount = headline.length;
  const charClass = charCount > 5000 ? 'char-over' : charCount > 4500 ? 'char-warn' : 'char-ok';
  return `
    <div class="review-preview review-preview-email">
      <div class="review-preview-subject">
        <span class="review-preview-subject-label">Subject:</span>
        ${headline}
      </div>
      <div class="review-preview-body review-preview-email-body">
        <div class="review-preview-preheader">${headline.slice(0, 60)}…</div>
        <div class="review-preview-email-cta">View offer →</div>
      </div>
      <div class="review-preview-footer">
        <span class="${charClass}">${charCount}/5000 chars</span>
      </div>
    </div>
  `;
}

function renderPlatformPreview(item: { label: string; kind: string }): string {
  const ch = item.label.split(' - ')[0]?.trim().toLowerCase() || '';
  if (ch === 'linkedin') return renderLinkedInPreview(item.label);
  if (ch === 'x') return renderXPreview(item.label);
  if (ch === 'instagram') return renderInstagramPreview(item.label);
  if (ch === 'email') return renderEmailPreview(item.label);
  // default: meta
  return renderMetaPreview(item.label);
}

// ── Audit trail expansion (REV-5) ─────────────────────────────────────────────
function renderAuditTrail(itemId: string): string {
  const audit = engine.getDecisionAudit(itemId);
  if (!audit || !audit.auditEntries.length) {
    return `
      <details class="review-audit">
        <summary class="review-audit-toggle">History ▾</summary>
        <div class="review-audit-body review-audit-empty">No decisions recorded yet.</div>
      </details>
    `;
  }

  const entries = audit.auditEntries.map(entry => {
    const dt = new Date(entry.decidedAt).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const icon = entry.decision === 'approved' ? '✅' : '❌';
    const note = entry.notes ? ` — <em>${entry.notes}</em>` : '';
    return `
      <div class="review-audit-entry">
        <span class="review-audit-icon">${icon}</span>
        <span>${entry.reviewerId} <strong>${entry.decision}</strong> on ${dt}${note}</span>
      </div>
    `;
  }).join('');

  return `
    <details class="review-audit">
      <summary class="review-audit-toggle">History ▾ (${audit.auditEntries.length})</summary>
      <div class="review-audit-body">${entries}</div>
    </details>
  `;
}

// ── Single review item card ───────────────────────────────────────────────────
function renderReviewItem(
  item: ReturnType<typeof engine.getReviewItems>[number],
  selected: boolean,
): string {
  const note = engine.getReviewNote(item.id);
  const channelLabel = item.label.split(' - ')[0]?.trim() || '';

  return `
    <div class="review-item" data-item-id="${item.id}" id="review-item-${item.id}">
      <div class="review-item-check">
        <input type="checkbox" class="review-checkbox" data-id="${item.id}"
               id="chk-${item.id}" ${selected ? 'checked' : ''} aria-label="Select ${item.label}">
      </div>

      <div class="review-item-content">
        <!-- Left: copy metadata -->
        <div class="review-item-copy">
          <div class="review-item-header">
            <span class="card-title">${channelLabel || item.label}</span>
            <span class="badge badge-${item.state}">${item.state}</span>
          </div>
          <p class="body-muted" style="margin-bottom:var(--space-sm)">
            ${item.kind === 'asset' ? tip('copy', 'Ad Copy')
              : item.kind === 'reply' ? tip('draftReply', 'Reply Draft')
              : tip('offer', 'Offer')}
          </p>
          <div class="body-secondary" style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-sm)">
            ${item.label}
          </div>

          ${item.state === 'pending' ? `
            <!-- Review notes (REV-3) -->
            <div class="review-note-wrap">
              <textarea
                class="form-input review-note-input"
                id="note-${item.id}"
                data-note-id="${item.id}"
                rows="2"
                placeholder="Add a note (optional)"
              >${note}</textarea>
            </div>

            <!-- Per-item actions -->
            <div class="action-row" style="margin-top:var(--space-sm)">
              <button class="btn btn-success btn-sm approve-btn" data-id="${item.id}">
                ${tip('approve', '✓ Approve')}
              </button>
              <button class="btn btn-danger btn-sm reject-btn" data-id="${item.id}">
                ${tip('reject', '✗ Reject')}
              </button>
            </div>
          ` : ''}

          ${renderAuditTrail(item.id)}
        </div>

        <!-- Right: platform preview (REV-1) -->
        <div class="review-item-preview">
          ${renderPlatformPreview(item)}
        </div>
      </div>
    </div>
  `;
}

// ── Page notice ───────────────────────────────────────────────────────────────
function renderPageNotice(notice: NonNullable<ReturnType<typeof engine.getPageNotice>>): string {
  return `
    <div class="status-banner status-banner--${notice.type}">
      <strong>${notice.type === 'error' ? 'Action needed' : 'Heads up'}</strong>
      <span>${notice.message}</span>
    </div>
  `;
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderReviewPage(): string {
  const items = engine.getReviewItems();
  const notice = engine.getPageNotice('review');

  if (!items.length) {
    return `
      <div class="page-header">
        <h1>${tip('reviewQueue', '🔍 Review Queue')}</h1>
        <p>Approve or reject content before it goes live.</p>
      </div>
      ${notice ? renderPageNotice(notice) : ''}
      <div class="card card-empty-state">
        <p class="page-emoji">🔍</p>
        <p class="body-secondary">
          Nothing to review yet. <a href="#" data-nav="launcher">Launch a campaign</a> and send copy to review.
        </p>
      </div>
    `;
  }

  const pending  = items.filter(i => i.state === 'pending');
  const approved = items.filter(i => i.state === 'approved');
  const rejected = items.filter(i => i.state === 'rejected');

  return `
    <div class="page-header">
      <h1>${tip('reviewQueue', '🔍 Review Queue')}</h1>
      <p>${pending.length} items waiting for review · ${approved.length} approved · ${rejected.length} rejected</p>
    </div>

    ${notice ? renderPageNotice(notice) : ''}

    <!-- Batch header row (REV-2) -->
    <div class="review-batch-header">
      <label class="review-select-all-wrap">
        <input type="checkbox" id="review-select-all" aria-label="Select all">
        <span class="body-muted">Select all</span>
      </label>

      ${pending.length > 0 ? `
        <div class="action-row">
          <button class="btn btn-success" id="approve-all-btn">
            ${tip('approve', 'Approve All')} (${pending.length})
          </button>
          <button class="btn btn-danger btn-ghost" id="reject-all-btn">
            Reject All (${pending.length})
          </button>
        </div>
      ` : `
        <div class="action-row">
          <button class="btn btn-primary" id="schedule-all-btn">
            ${tip('schedule', 'Schedule All for Publishing')}
          </button>
        </div>
      `}
    </div>

    <!-- Floating batch action bar (REV-2 — shown when items are selected) -->
    <div class="review-batch-bar" id="review-batch-bar" hidden>
      <span class="review-batch-count" id="batch-count-label">0 selected</span>
      <button class="btn btn-success btn-sm" id="batch-approve-btn">Approve</button>
      <button class="btn btn-danger btn-sm" id="batch-reject-btn">Reject</button>
    </div>

    <!-- Item list -->
    <div class="review-list" id="review-list">
      ${items.map(item => renderReviewItem(item, false)).join('')}
    </div>
  `;
}

// ── Event binding ─────────────────────────────────────────────────────────────
export function bindReviewEvents(): void {

  // ── REV-4: animated transition helper ──────────────────────────────────────
  function animateAndRerender(itemId: string, animClass: string): void {
    const card = document.getElementById(`review-item-${itemId}`);
    if (card) {
      card.classList.add(animClass);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
      }, 420); // wait for animation
    } else {
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    }
  }

  // ── Note auto-save (REV-3) ─────────────────────────────────────────────────
  document.querySelectorAll<HTMLTextAreaElement>('.review-note-input').forEach(textarea => {
    textarea.addEventListener('change', () => {
      const itemId = textarea.dataset.noteId || '';
      engine.setReviewNote(itemId, textarea.value);
    });
  });

  // ── Per-item approve ───────────────────────────────────────────────────────
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id || '';
      // Save note if dirty
      const noteEl = document.getElementById(`note-${id}`) as HTMLTextAreaElement | null;
      if (noteEl) engine.setReviewNote(id, noteEl.value);
      engine.trackLearningAction('review.approve-item', 'review', { itemId: id });
      engine.approveItem(id as any);
      toastSuccess('Item approved.');
      animateAndRerender(id, 'review-item--approving');
    });
  });

  // ── Per-item reject ────────────────────────────────────────────────────────
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id || '';
      const noteEl = document.getElementById(`note-${id}`) as HTMLTextAreaElement | null;
      if (noteEl) engine.setReviewNote(id, noteEl.value);
      engine.trackLearningAction('review.reject-item', 'review', { itemId: id });
      engine.rejectItem(id as any);
      toastWarning('Item rejected.');
      animateAndRerender(id, 'review-item--rejecting');
    });
  });

  // ── Approve All ────────────────────────────────────────────────────────────
  const approveAllBtn = document.getElementById('approve-all-btn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', () => {
      engine.trackLearningAction('review.approve-all', 'review');
      engine.approveAll();
      toastSuccess('All items approved.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }

  // ── Reject All ─────────────────────────────────────────────────────────────
  const rejectAllBtn = document.getElementById('reject-all-btn');
  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', () => {
      engine.trackLearningAction('review.reject-all', 'review');
      engine.rejectAll();
      toastWarning('All items rejected.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }

  // ── Schedule All ───────────────────────────────────────────────────────────
  const scheduleBtn = document.getElementById('schedule-all-btn');
  if (scheduleBtn) {
    scheduleBtn.addEventListener('click', () => {
      engine.trackLearningAction('review.schedule-all', 'review');
      engine.scheduleAll();
      toastSuccess('All approved items scheduled for publishing.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
    });
  }

  // ── REV-2: Select all checkbox ─────────────────────────────────────────────
  const selectAllChk = document.getElementById('review-select-all') as HTMLInputElement | null;
  function updateBatchBar(): void {
    const checked = [...document.querySelectorAll<HTMLInputElement>('.review-checkbox')].filter(c => c.checked);
    const bar = document.getElementById('review-batch-bar');
    const label = document.getElementById('batch-count-label');
    if (bar) bar.hidden = checked.length === 0;
    if (label) label.textContent = `${checked.length} selected`;
  }

  if (selectAllChk) {
    selectAllChk.addEventListener('change', () => {
      document.querySelectorAll<HTMLInputElement>('.review-checkbox').forEach(chk => {
        chk.checked = selectAllChk.checked;
      });
      updateBatchBar();
    });
  }

  document.querySelectorAll('.review-checkbox').forEach(chk => {
    chk.addEventListener('change', () => {
      updateBatchBar();
      if (selectAllChk) {
        const all = [...document.querySelectorAll<HTMLInputElement>('.review-checkbox')];
        selectAllChk.checked = all.length > 0 && all.every(c => c.checked);
        selectAllChk.indeterminate = all.some(c => c.checked) && !all.every(c => c.checked);
      }
    });
  });

  // ── REV-2: Batch approve ───────────────────────────────────────────────────
  const batchApproveBtn = document.getElementById('batch-approve-btn');
  if (batchApproveBtn) {
    batchApproveBtn.addEventListener('click', () => {
      const checked = [...document.querySelectorAll<HTMLInputElement>('.review-checkbox:checked')];
      let count = 0;
      checked.forEach(chk => {
        const id = chk.dataset.id || '';
        if (id) {
          const noteEl = document.getElementById(`note-${id}`) as HTMLTextAreaElement | null;
          if (noteEl) engine.setReviewNote(id, noteEl.value);
          engine.trackLearningAction('review.batch-approve', 'review', { itemId: id });
          engine.approveItem(id as any);
          count++;
        }
      });
      toastSuccess(`${count} item${count !== 1 ? 's' : ''} approved`);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }

  // ── REV-2: Batch reject ────────────────────────────────────────────────────
  const batchRejectBtn = document.getElementById('batch-reject-btn');
  if (batchRejectBtn) {
    batchRejectBtn.addEventListener('click', () => {
      const checked = [...document.querySelectorAll<HTMLInputElement>('.review-checkbox:checked')];
      let count = 0;
      checked.forEach(chk => {
        const id = chk.dataset.id || '';
        if (id) {
          const noteEl = document.getElementById(`note-${id}`) as HTMLTextAreaElement | null;
          if (noteEl) engine.setReviewNote(id, noteEl.value);
          engine.trackLearningAction('review.batch-reject', 'review', { itemId: id });
          engine.rejectItem(id as any);
          count++;
        }
      });
      toastWarning(`${count} item${count !== 1 ? 's' : ''} rejected`);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
    });
  }
}
