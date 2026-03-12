import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderCalendarPage(): string {
  const entries = engine.getCalendar();

  if (!entries.length) {
    return `
      <div class="page-header">
        <h1>${tip('publishing', '📅 Publishing Calendar')}</h1>
        <p>See when your approved content is scheduled to go live.</p>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">📅</p>
        <p class="body-secondary">
          No scheduled posts yet. ${tip('reviewQueue', 'Approve content first')}, then ${tip('schedule', 'schedule')} it here.
        </p>
      </div>
    `;
  }

  const dispatched = entries.filter(e => e.state === 'dispatched').length;
  const scheduled = entries.filter(e => e.state === 'scheduled').length;

  return `
    <div class="page-header">
      <h1>${tip('publishing', '📅 Publishing Calendar')}</h1>
      <p>${entries.length} posts · ${dispatched} published · ${scheduled} scheduled</p>
    </div>

    ${scheduled > 0 ? `
      <div class="action-row action-row-top">
        <button class="btn btn-success" id="publish-now-btn">
          ⚡ Publish All Now
        </button>
      </div>
    ` : ''}

    <div class="metric-row">
      ${['meta', 'linkedin', 'x', 'email'].map(ch => {
    const count = entries.filter(e => e.channel === ch).length;
    if (!count) return '';
    return `
          <div class="metric-tile">
            <div class="metric-label" data-tip="channel${ch.charAt(0).toUpperCase() + ch.slice(1)}">${ch}</div>
            <div class="metric-value channel-${ch}">${count}</div>
            <div class="metric-sub">posts</div>
          </div>
        `;
  }).join('')}
    </div>

    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>${tip('channel', 'Channel')}</th>
            <th>Content</th>
            <th>${tip('schedule', 'Scheduled For')}</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(e => `
            <tr>
              <td><span class="badge badge-${e.channel === 'meta' ? 'scheduled' : e.channel === 'linkedin' ? 'approved' : 'pending'}">${e.channel}</span></td>
              <td class="cell-truncate">${e.assetLabel}</td>
              <td class="cell-meta">${new Date(e.runAt).toLocaleString()}</td>
              <td><span class="badge badge-${e.state}">${e.state}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function bindCalendarEvents(): void {
  const publishBtn = document.getElementById('publish-now-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      engine.trackLearningAction('calendar.publish-all-now', 'calendar');
      engine.publishNow();
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
    });
  }
}
