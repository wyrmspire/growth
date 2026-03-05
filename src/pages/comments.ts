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
      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
        <p style="font-size: 40px; margin-bottom: var(--space-md)">💬</p>
        <p style="color: var(--text-secondary)">
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

    <h3 style="margin-bottom: var(--space-md)">Incoming Comments</h3>

    <div class="card">
      ${commentItems.map(item => {
        const reply = replies.find(r => r.commentId === item.commentId);
        const aiNote = engine.getAIReplyNote(item.commentId as string);
        return `
          <div class="comment-item">
            <div class="comment-avatar">${item.comment.authorName.charAt(0)}</div>
            <div class="comment-body">
              <div class="comment-author">
                ${item.comment.authorName}
                <span class="badge badge-${item.intent}" style="margin-left: var(--space-sm)">
                  ${tip(`intent${item.intent.charAt(0).toUpperCase() + item.intent.slice(1)}`, item.intent)}
                </span>
              </div>
              <div class="comment-text">${item.comment.body}</div>
              ${reply ? `
                <div class="reply-box">
                  <strong>${tip('draftReply', '💡 Suggested Reply')}:</strong> ${reply.body}
                  <div style="margin-top: var(--space-xs); font-size: 11px; color: var(--text-muted)">
                    ${tip('confidence', 'Confidence')}: ${Math.round(reply.confidence * 100)}%
                  </div>
                  ${aiNote ? `
                  <div style="margin-top: var(--space-sm); padding: var(--space-sm); background: rgba(139, 92, 246, 0.05); border-radius: 6px; font-size: 12px">
                    <strong>🤖 Strategy:</strong> <em>${aiNote.strategy}</em><br/>
                    <strong>💡 Coaching:</strong> <em>${aiNote.coaching}</em>
                  </div>` : ''}
                </div>
                <div class="comment-actions">
                  <button class="btn btn-success btn-sm">${tip('approve', '✓ Approve & Send')}</button>
                  <button class="btn btn-ghost btn-sm">✏️ Edit</button>
                  <button class="btn btn-danger btn-sm">${tip('reject', '✗ Discard')}</button>
                </div>
              ` : item.intent === 'spam' ? `
                <div style="font-size: 11px; color: var(--text-muted); margin-top: var(--space-sm)">
                  ${tip('intentSpam', '🚫 Flagged as spam')} — no reply generated
                </div>
              ` : ''}
            </div>
          </div>
        `;
    }).join('')}
    </div>

    <div style="margin-top: var(--space-lg)">
      <button class="btn btn-success" id="send-all-replies-btn">
        ✉️ Approve & Send All Replies
      </button>
    </div>
  `;
}

export function bindCommentsEvents(): void {
    const pullBtn = document.getElementById('pull-comments-btn');
    if (pullBtn) {
        pullBtn.addEventListener('click', async () => {
            pullBtn.textContent = '⏳ Pulling...';
            (pullBtn as HTMLButtonElement).disabled = true;
            await engine.pullCommentsAI();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
        });
    }

    const sendAllBtn = document.getElementById('send-all-replies-btn');
    if (sendAllBtn) {
        sendAllBtn.addEventListener('click', () => {
            engine.sendReplies();
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
        });
    }
}
