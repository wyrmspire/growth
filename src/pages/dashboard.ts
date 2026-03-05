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
      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
        <p style="font-size: 40px; margin-bottom: var(--space-md)">📊</p>
        <p style="color: var(--text-secondary)">
          <a href="#" data-nav="launcher">Launch a campaign</a> to start seeing results.
        </p>
      </div>
    `;
    }

    const { attribution, funnel, variants } = engine.getDashboard();

    const stageColors: Record<string, string> = {
        awareness: 'var(--accent-blue)',
        consideration: 'var(--accent-amber)',
        decision: 'var(--accent-green)',
    };

    return `
    <div class="page-header">
      <h1>${tip('attribution', '📊 Campaign Dashboard')}</h1>
      <p>Results for <strong>${brief.offerName}</strong></p>
    </div>

    <div class="metric-row">
      <div class="metric-tile" data-tip="cpl">
        <div class="metric-label has-tip">${tip('cpl', 'Cost Per Lead')}</div>
        <div class="metric-value" style="color: var(--accent-green)">$${attribution.cpl.toFixed(2)}</div>
        <div class="metric-sub">lower is better</div>
      </div>
      <div class="metric-tile" data-tip="roas">
        <div class="metric-label has-tip">${tip('roas', 'Return on Ad Spend')}</div>
        <div class="metric-value" style="color: var(--accent-primary)">${attribution.roas}x</div>
        <div class="metric-sub">revenue per $1 spent</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Total Spend</div>
        <div class="metric-value">$${attribution.totalSpend.toLocaleString()}</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Total Revenue</div>
        <div class="metric-value" style="color: var(--accent-green)">$${attribution.totalRevenue.toLocaleString()}</div>
      </div>
    </div>

    <hr class="section-divider" />

    <h3 style="margin-bottom: var(--space-md)">${tip('funnel', '🔻 Funnel Conversion')}</h3>
    <div class="funnel-visual">
      ${funnel.map(row => `
        <div class="funnel-stage ${row.stage}" data-tip="${row.stage}">
          <div class="stage-name">${row.stage.charAt(0).toUpperCase() + row.stage.slice(1)}</div>
          <div class="stage-rate" style="color: ${stageColors[row.stage]}">${row.rate}%</div>
          <div class="stage-count">${row.entered.toLocaleString()} → ${row.converted.toLocaleString()}</div>
        </div>
      `).join('')}
    </div>

    <hr class="section-divider" />

    <h3 style="margin-bottom: var(--space-md)">
      ${tip('channel', '📡 Performance by Channel')}
    </h3>
    <div class="card" style="overflow-x: auto">
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
                <td style="color: var(--accent-green)">$${row.revenue.toLocaleString()}</td>
                <td style="font-weight: 700">${roas}x</td>
              </tr>
            `;
    }).join('')}
        </tbody>
      </table>
    </div>

    <hr class="section-divider" />

    <h3 style="margin-bottom: var(--space-md)">
      ${tip('variant', '🏆 Top Copy Variants')}
    </h3>
    <div class="card" style="overflow-x: auto">
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
              <td style="font-weight: 700; color: ${v.score >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'}">${v.score}${i === 0 ? ' 🏆' : ''}</td>
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
