import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';
import { toastSuccess, toastWarning, toastInfo } from '../components/toast';

export function renderCommentsPage(): string {
  const brief = engine.getCurrentBrief();
  const commentItems = engine.getCommentItems();
  const replies = engine.getCommentReplies();
  const advisory = engine.getCommentsAdvisory();
  const notice = engine.getPageNotice('comments');
  const loading = engine.isCommentsLoading();

  if (!brief) {
    return `
      <div class="page-header">
        <h1>${tip('commentTriage', 'Comment Operations')}</h1>
        <p>Manage incoming comments, classify intent, and draft replies.</p>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">Reply</p>
        <p class="body-secondary">
          <a href="#" data-nav="launcher">Launch a campaign</a> first to start receiving comments.
        </p>
      </div>
    `;
  }

  if (loading || !commentItems.length) {
    return `
      <div class="page-header">
        <h1>${tip('commentTriage', 'Comment Operations')}</h1>
        <p>Loading comment suggestions and reply coaching.</p>
      </div>
      ${notice ? renderPageNotice(notice) : ''}
      <div class="card card-empty-state">
        <p class="page-emoji">Loading</p>
        <p class="body-secondary">Pulling comments and preparing draft replies. This stays review-first even when the AI coach is available.</p>
      </div>
    `;
  }

  const intentEmoji: Record<string, string> = {
    lead: 'Lead',
    support: 'Support',
    objection: 'Objection',
    spam: 'Spam',
  };

  const intentCounts = commentItems.reduce((acc, item) => {
    acc[item.intent] = (acc[item.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `
    <div class="page-header">
      <h1>${tip('commentTriage', 'Comment Operations')}</h1>
      <p>${commentItems.length} comments pulled · ${replies.length} replies drafted</p>
    </div>

    <div class="coach-block">
      <div class="coach-block-icon">Guide</div>
      <div class="coach-block-body">
        <strong>What you do here</strong>
        <p>Review incoming comments, see the suggested response strategy, and decide what should actually be sent.</p>
        <strong>Why it matters</strong>
        <p>Comments are where reputation and conversion meet. Fast responses are useful, but only if they stay accurate and on-brand.</p>
        <strong>What comes next</strong>
        <p>Approve the replies you want, then keep an eye on the Dashboard to see how campaign activity turns into leads.</p>
      </div>
    </div>

    ${notice ? renderPageNotice(notice) : ''}
    ${advisory ? renderAdvisory(advisory) : ''}

    <div class="metric-row">
      ${Object.entries(intentCounts).map(([intent, count]) => `
        <div class="metric-tile" data-tip="intent${intent.charAt(0).toUpperCase() + intent.slice(1)}">
          <div class="metric-label has-tip">${intentEmoji[intent] || ''}</div>
          <div class="metric-value">${count}</div>
        </div>
      `).join('')}
    </div>

    <h3 class="section-heading">Incoming Comments</h3>

    <div class="card">
      ${commentItems.map((item) => {
        const reply = replies.find((draft) => draft.commentId === item.commentId);
        const replyState = engine.getReplyCoachState(item.commentId);
        const reviewState = reply ? engine.getReplyReviewState(reply.id) : 'missing';
        const alreadySent = reply ? engine.isReplySent(reply.id) : false;
        const sendLabel = reviewState === 'approved' ? 'Send Reply' : tip('approve', 'Approve & Send');
        return `
          <div class="comment-item">
            <div class="comment-avatar">${item.comment.authorName.charAt(0)}</div>
            <div class="comment-body">
              <div class="comment-author">
                ${item.comment.authorName}
                <span class="badge badge-${item.intent} badge-inline">
                  ${tip(`intent${item.intent.charAt(0).toUpperCase() + item.intent.slice(1)}`, item.intent)}
                </span>
              </div>
              <div class="comment-text">${item.comment.body}</div>
              ${reply ? `
                <div class="reply-box">
                  <strong>${tip('draftReply', 'Suggested Reply')}:</strong> ${reply.body}
                  <div class="body-note">${tip('confidence', 'Confidence')}: ${Math.round(reply.confidence * 100)}%</div>
                </div>
                ${replyState ? `
                  <div class="advisor-panel advisor-panel--compact">
                    <div class="advisor-panel-header">
                      <span class="badge badge-approved">${replyState.source}</span>
                      <span class="badge badge-${advisoryPhaseClass(replyState.phase)}">${replyState.phase}</span>
                    </div>
                    <p class="advisor-panel-summary">${replyState.strategy}</p>
                    <ul class="advisor-panel-list">
                      <li>${replyState.coachingNote}</li>
                      <li>Human approval is required before any reply is sent.</li>
                    </ul>
                  </div>
                ` : ''}
                <div class="comment-actions">
                  <button class="btn btn-success btn-sm comment-approve-send-btn" data-reply-id="${reply.id}" ${alreadySent ? 'disabled' : ''}>${alreadySent ? 'Sent' : sendLabel}</button>
                  <button class="btn btn-ghost btn-sm comment-edit-btn" data-reply-id="${reply.id}">Edit</button>
                  <button class="btn btn-danger btn-sm comment-discard-btn" data-reply-id="${reply.id}" ${reviewState === 'rejected' ? 'disabled' : ''}>${reviewState === 'rejected' ? 'Discarded' : tip('reject', 'Discard')}</button>
                </div>
                ${alreadySent ? '<div class="body-note">Reply already sent.</div>' : reviewState === 'rejected' ? '<div class="body-note">Reply discarded. It will stay out of send actions until re-approved from the review queue.</div>' : reviewState === 'approved' ? '<div class="body-note">Reply approved and ready to send.</div>' : ''}
              ` : item.intent === 'spam' ? `
                <div class="body-note">${tip('intentSpam', 'Flagged as spam')} - no reply generated</div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="action-row action-row-bottom">
      <button class="btn btn-success" id="send-all-replies-btn">
        Approve & Send All Replies
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

function advisoryPhaseClass(
  phase: NonNullable<ReturnType<typeof engine.getCommentsAdvisory>>['phase'] | NonNullable<ReturnType<typeof engine.getReplyCoachState>>['phase'],
): string {
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

function renderAdvisory(advisory: NonNullable<ReturnType<typeof engine.getCommentsAdvisory>>): string {
  return `
    <div class="advisor-panel">
      <div class="advisor-panel-header">
        <span class="badge badge-approved">${advisory.source}</span>
        <span class="badge badge-${advisoryPhaseClass(advisory.phase)}">${advisory.phase}</span>
      </div>
      <h3 class="advisor-panel-title">Reply advisory state</h3>
      <p class="advisor-panel-summary">${advisory.summary}</p>
      <ul class="advisor-panel-list">
        ${advisory.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
  `;
}

export function bindCommentsEvents(): void {
  if (!engine.getCommentItems().length && !engine.isCommentsLoading()) {
    void engine.ensureCommentsLoaded().then(() => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  }

  document.querySelectorAll('.comment-approve-send-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const replyId = (button as HTMLElement).dataset.replyId || '';
      engine.trackLearningAction('comments.approve-send-reply', 'comments', { replyId });
      engine.sendReply(replyId as any);
      toastSuccess('Reply sent.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  });

  document.querySelectorAll('.comment-discard-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const replyId = (button as HTMLElement).dataset.replyId || '';
      engine.trackLearningAction('comments.discard-reply', 'comments', { replyId });
      engine.discardReply(replyId as any);
      toastWarning('Reply discarded.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  });

  document.querySelectorAll('.comment-edit-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const replyId = (button as HTMLElement).dataset.replyId || '';
      engine.trackLearningAction('comments.edit-placeholder-clicked', 'comments', { replyId });
      engine.explainReplyEditUnavailable(replyId as any);
      toastInfo('Inline edit is not available yet. Use Discard and re-generate from the Review Queue.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  });

  const sendAllBtn = document.getElementById('send-all-replies-btn');
  if (sendAllBtn) {
    sendAllBtn.addEventListener('click', () => {
      engine.trackLearningAction('comments.send-all-replies', 'comments');
      engine.sendReplies();
      toastSuccess('All approved replies sent.');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  }
}
