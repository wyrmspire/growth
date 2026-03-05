import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderCommentsPage(): string {
  const brief = engine.getCurrentBrief();

  if (!brief) {
    return `
      <div class="page-header">
        <h1>${tip('commentTriage', '💬 Comment Operations')}</h1>
        <p>Manage incoming comments, classify intent, and draft replies.</p>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">💬</p>
        <p class="body-secondary">
          <a href="#" data-nav="launcher">Launch a campaign</a> first to start receiving comments.
        </p>
      </div>
    `;
  }

  let commentItems: ReturnType<typeof engine.pullComments> = [];
  try {
    commentItems = engine.pullComments();
  } catch { /* already pulled */ }

  const replies = engine.getCommentReplies();

  const intentEmoji: Record<string, string> = {
    lead: '🟢',
    support: '🔵',
    objection: '🟡',
    spam: '🔴',
  };

  const intentCounts = commentItems.reduce((acc, item) => {
    acc[item.intent] = (acc[item.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `
    <div class="page-header">
      <h1>${tip('commentTriage', '💬 Comment Operations')}</h1>
      <p>${commentItems.length} comments pulled · ${replies.length} replies drafted</p>
    </div>

    <div class="metric-row">
      ${Object.entries(intentCounts).map(([intent, count]) => `
        <div class="metric-tile" data-tip="intent${intent.charAt(0).toUpperCase() + intent.slice(1)}">
          <div class="metric-label has-tip">${intentEmoji[intent] || ''} ${intent}</div>
          <div class="metric-value">${count}</div>
        </div>
      `).join('')}
    </div>

    <h3 class="section-heading">Incoming Comments</h3>

    <div class="card">
      ${commentItems.map(item => {
    const reply = replies.find(r => r.commentId === item.commentId);
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
                  <strong>${tip('draftReply', '💡 Suggested Reply')}:</strong> ${reply.body}
                  <div class="body-note">
                    ${tip('confidence', 'Confidence')}: ${Math.round(reply.confidence * 100)}%
                  </div>
                </div>
                <div class="comment-actions">
                  <button class="btn btn-success btn-sm">${tip('approve', '✓ Approve & Send')}</button>
                  <button class="btn btn-ghost btn-sm">✏️ Edit</button>
                  <button class="btn btn-danger btn-sm">${tip('reject', '✗ Discard')}</button>
                </div>
              ` : item.intent === 'spam' ? `
                <div class="body-note">
                  ${tip('intentSpam', '🚫 Flagged as spam')} — no reply generated
                </div>
              ` : ''}
            </div>
          </div>
        `;
  }).join('')}
    </div>

    <div class="action-row action-row-bottom">
      <button class="btn btn-success" id="send-all-replies-btn">
        ✉️ Approve & Send All Replies
      </button>
    </div>
  `;
}

export function bindCommentsEvents(): void {
  const sendAllBtn = document.getElementById('send-all-replies-btn');
  if (sendAllBtn) {
    sendAllBtn.addEventListener('click', () => {
      engine.sendReplies();
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
    });
  }
}
