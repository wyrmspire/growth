import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';

export function renderDashboardPage(): string {
  const brief = engine.getCurrentBrief();

  if (!brief) {
    return `
      <div class="page-header">
        <h1>${tip('attribution', '📊 Campaign Dashboard')}</h1>
        <p>Track results, see what's working, and optimize your next campaign.</p>
      </div>
      <div class="card card-empty-state">
        <p class="page-emoji">📊</p>
        <p class="body-secondary">
          <a href="#" data-nav="launcher">Launch a campaign</a> to start seeing results.
        </p>
      </div>
    `;
  }

  const { attribution, funnel, variants, learning } = engine.getDashboard();

  return `
    <div class="page-header">
      <h1>${tip('attribution', '📊 Campaign Dashboard')}</h1>
      <p>Results for <strong>${brief.offerName}</strong></p>
    </div>

    <div class="metric-row">
      <div class="metric-tile" data-tip="cpl">
        <div class="metric-label has-tip">${tip('cpl', 'Cost Per Lead')}</div>
        <div class="metric-value metric-green">$${attribution.cpl.toFixed(2)}</div>
        <div class="metric-sub">lower is better</div>
      </div>
      <div class="metric-tile" data-tip="roas">
        <div class="metric-label has-tip">${tip('roas', 'Return on Ad Spend')}</div>
        <div class="metric-value metric-primary">${attribution.roas}x</div>
        <div class="metric-sub">revenue per $1 spent</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Total Spend</div>
        <div class="metric-value">$${attribution.totalSpend.toLocaleString()}</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Total Revenue</div>
        <div class="metric-value metric-green">$${attribution.totalRevenue.toLocaleString()}</div>
      </div>
    </div>

    <hr class="section-divider" />

    <h3 class="section-heading">${tip('funnel', '🔻 Funnel Conversion')}</h3>
    <div class="funnel-visual">
      ${funnel.map(row => `
        <div class="funnel-stage ${row.stage}" data-tip="${row.stage}">
          <div class="stage-name">${row.stage.charAt(0).toUpperCase() + row.stage.slice(1)}</div>
          <div class="stage-rate funnel-rate-${row.stage}">${row.rate}%</div>
          <div class="stage-count">${row.entered.toLocaleString()} → ${row.converted.toLocaleString()}</div>
        </div>
      `).join('')}
    </div>

    <hr class="section-divider" />

    <h3 class="section-heading">
      ${tip('channel', '📡 Performance by Channel')}
    </h3>
    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>${tip('channel', 'Channel')}</th>
            <th>${tip('impressions', 'Impressions')}</th>
            <th>${tip('clicks', 'Clicks')}</th>
            <th>Leads</th>
            <th>Spend</th>
            <th>Revenue</th>
            <th>${tip('roas', 'ROAS')}</th>
          </tr>
        </thead>
        <tbody>
          ${attribution.byChannel.map(row => {
    const roas = row.spend ? (row.revenue / row.spend).toFixed(1) : '—';
    return `
              <tr>
                <td><span class="badge badge-${row.channel === 'meta' ? 'scheduled' : row.channel === 'linkedin' ? 'approved' : 'pending'}">${row.channel}</span></td>
                <td>${row.impressions.toLocaleString()}</td>
                <td>${row.clicks.toLocaleString()}</td>
                <td>${row.leads}</td>
                <td>$${row.spend.toLocaleString()}</td>
                <td class="metric-green">$${row.revenue.toLocaleString()}</td>
                <td class="score-value">${roas}x</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>


    <hr class="section-divider" />

    <h3 class="section-heading">🧭 Learning Journey Activity</h3>
    <div class="metric-row">
      <div class="metric-tile">
        <div class="metric-label">Tracked page views</div>
        <div class="metric-value">${learning.totalPageViews}</div>
        <div class="metric-sub">across ${learning.uniquePages.length} page(s)</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Most visited page</div>
        <div class="metric-value">${learning.pageViews[0]?.pageId || '—'}</div>
        <div class="metric-sub">${learning.pageViews[0]?.views || 0} view(s)</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Top action</div>
        <div class="metric-value">${learning.actions[0]?.action || '—'}</div>
        <div class="metric-sub">${learning.actions[0]?.count || 0} trigger(s)</div>
      </div>
    </div>

    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>Learning page</th>
            <th>Views</th>
            <th>Top tracked actions</th>
          </tr>
        </thead>
        <tbody>
          ${(learning.pageViews.length ? learning.pageViews : [{ pageId: 'No learning telemetry yet', views: 0 }]).map((row) => {
            const pageActions = learning.actions.filter((action) => action.action.startsWith(`${row.pageId.split(' ')[0]}.`)).slice(0, 2);
            return `
              <tr>
                <td class="cell-capitalize">${row.pageId}</td>
                <td>${row.views}</td>
                <td>${pageActions.length ? pageActions.map((action) => `${action.action} (${action.count})`).join(' · ') : 'No tracked actions yet'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <hr class="section-divider" />

    <h3 class="section-heading">
      ${tip('variant', '🏆 Top Copy Variants')}
    </h3>
    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>${tip('channel', 'Channel')}</th>
            <th>${tip('impressions', 'Impressions')}</th>
            <th>${tip('clicks', 'Clicks')}</th>
            <th>${tip('conversionRate', 'Conversions')}</th>
            <th>${tip('score', 'Score')}</th>
          </tr>
        </thead>
        <tbody>
          ${variants.sort((a, b) => b.score - a.score).map((v, i) => `
            <tr>
              <td><span class="badge badge-${v.channel === 'meta' ? 'scheduled' : v.channel === 'linkedin' ? 'approved' : 'pending'}">${v.channel}</span></td>
              <td>${v.impressions.toLocaleString()}</td>
              <td>${v.clicks}</td>
              <td>${v.conversions}</td>
              <td class="score-value score-${v.score >= 80 ? 'high' : 'mid'}">${v.score}${i === 0 ? ' 🏆' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function bindDashboardEvents(): void {
  // Dashboard is read-only in mock mode
}
