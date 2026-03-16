/**
 * Dashboard Page — DASH-1 through DASH-6
 * Premium campaign analytics with animated counters, sparklines, SVG funnel,
 * journey completion ring, clipboard export, and zero emoji in headers.
 */

import { tip } from '../components/tooltip';
import * as engine from '../mock-engine';
import { animateCounter } from '../components/counter';
import { renderSparkline } from '../components/sparkline';
import { toastSuccess, toastError } from '../components/toast';
import {
  buildResearchDashboardSummary,
  getSeedResearchRecords,
  sentenceCase,
} from '../../modules/social-scout/src/research-store';
import {
  iconBarChart,
  iconClipboard,
  iconFunnel,
  iconBroadcast,
  iconTrophy,
  iconCompass,
  iconTrendingUp,
} from '../icons';

const researchSummary = buildResearchDashboardSummary(getSeedResearchRecords());

// ─── Journey step IDs for completion ring ─────────────────────────────────────
const JOURNEY_PAGE_IDS = ['discovery', 'strategy-workspace', 'launcher', 'review', 'calendar', 'comments', 'dashboard'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the best-performing channel by ROAS */
function topChannel(byChannel: { channel: string; spend: number; revenue: number }[]): string {
  if (!byChannel.length) return '—';
  return [...byChannel].sort((a, b) => (b.revenue / Math.max(b.spend, 1)) - (a.revenue / Math.max(a.spend, 1)))[0].channel;
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function renderMetricTile(opts: {
  label: string;
  tipKey: string;
  valueId: string;
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub: string;
  colorClass?: string;
  sparkValues?: number[];
  sparkColor?: string;
}): string {
  const sparkHtml = opts.sparkValues && opts.sparkValues.length >= 2
    ? `<div class="metric-sparkline">${renderSparkline(opts.sparkValues, { color: opts.sparkColor || 'currentColor' })}</div>`
    : '';

  return `
    <div class="metric-tile" data-tip="${opts.tipKey}">
      <div class="metric-label has-tip">${tip(opts.tipKey, opts.label)}</div>
      <div class="metric-tile-body">
        <div
          class="metric-value ${opts.colorClass || ''}"
          id="${opts.valueId}"
          data-target="${opts.target}"
          data-prefix="${opts.prefix || ''}"
          data-suffix="${opts.suffix || ''}"
          data-decimals="${opts.decimals ?? 0}"
        >—</div>
        ${sparkHtml}
      </div>
      <div class="metric-sub">${opts.sub}</div>
    </div>
  `;
}

/** DASH-3: Premium tapered SVG funnel */
function renderPremiumFunnel(funnel: { stage: string; entered: number; converted: number; rate: number }[]): string {
  if (!funnel.length) return '<p class="body-muted">No funnel data yet — launch and schedule content first.</p>';

  const gradients = [
    { id: 'funnelGrad0', from: '#3B82F6', to: '#14B8A6' },  // blue → teal
    { id: 'funnelGrad1', from: '#14B8A6', to: '#22C55E' },  // teal → green
    { id: 'funnelGrad2', from: '#22C55E', to: '#EAB308' },  // green → gold
  ];

  const svgW = 420;
  const stageH = 72;
  const totalH = funnel.length * stageH + 20;
  const baseHalfW = svgW / 2 - 20;
  const minHalfW = 60;

  const stages = funnel.map((row, i) => {
    const topHW = baseHalfW - (i / funnel.length) * (baseHalfW - minHalfW);
    const botHW = baseHalfW - ((i + 1) / funnel.length) * (baseHalfW - minHalfW);
    const cy = i * stageH;
    const cx = svgW / 2;
    const grad = gradients[i] || gradients[gradients.length - 1];
    return {
      ...row,
      topHW,
      botHW,
      cy,
      cx,
      grad,
    };
  });

  const defsBlock = gradients.map((g, i) => `
    <linearGradient id="${g.id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${g.from};stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:${g.to};stop-opacity:0.9"/>
    </linearGradient>
  `).join('');

  const stagesBlock = stages.map((s, i) => {
    const tl = `${s.cx - s.topHW},${s.cy}`;
    const tr = `${s.cx + s.topHW},${s.cy}`;
    const br = `${s.cx + s.botHW},${s.cy + stageH}`;
    const bl = `${s.cx - s.botHW},${s.cy + stageH}`;
    const label = s.stage.charAt(0).toUpperCase() + s.stage.slice(1);
    return `
      <polygon
        points="${tl} ${tr} ${br} ${bl}"
        fill="url(#${s.grad.id})"
        class="funnel-premium-segment"
        style="animation-delay: ${0.12 * i}s;"
      />
      <text x="${s.cx}" y="${s.cy + stageH / 2 - 8}" text-anchor="middle" class="funnel-label-stage">${label}</text>
      <text x="${s.cx}" y="${s.cy + stageH / 2 + 8}" text-anchor="middle" class="funnel-label-rate">${s.rate}%</text>
      <text x="${s.cx}" y="${s.cy + stageH / 2 + 24}" text-anchor="middle" class="funnel-label-count">${s.entered.toLocaleString()} → ${s.converted.toLocaleString()}</text>
    `;
  }).join('');

  return `
    <div class="funnel-premium">
      <svg width="100%" viewBox="0 0 ${svgW} ${totalH}" preserveAspectRatio="xMidYMid meet" class="funnel-svg" aria-label="Campaign funnel">
        <defs>${defsBlock}</defs>
        ${stagesBlock}
      </svg>
    </div>
  `;
}

/** DASH-4: Learning journey completion ring */
function renderJourneyRing(learning: { uniquePages: string[] }): string {
  const visited = JOURNEY_PAGE_IDS.filter(id => learning.uniquePages.includes(id)).length;
  const total   = JOURNEY_PAGE_IDS.length;
  const pct     = total > 0 ? Math.round((visited / total) * 100) : 0;

  const r  = 40;
  const cx = 54;
  const cy = 54;
  const circumference = 2 * Math.PI * r;
  const dashArray  = circumference;
  const dashOffset = circumference * (1 - pct / 100);

  return `
    <div class="journey-ring-wrap">
      <svg width="108" height="108" viewBox="0 0 108 108" class="journey-ring-svg" aria-label="Journey completion ${pct}%">
        <!-- Track -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-card)" stroke-width="8"/>
        <!-- Progress arc -->
        <circle
          class="journey-ring-arc"
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="var(--accent-primary)"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="${dashArray.toFixed(2)}"
          stroke-dashoffset="${dashOffset.toFixed(2)}"
          transform="rotate(-90 ${cx} ${cy})"
          style="transition: stroke-dashoffset 0.8s ease;"
        />
        <!-- Center text -->
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" class="ring-label-big">${visited}/${total}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="ring-label-small">steps</text>
      </svg>
      <div class="journey-ring-legend">
        <div class="ring-legend-title">Journey Progress</div>
        <div class="ring-legend-sub">${pct}% complete</div>
        <div class="ring-legend-detail">${total - visited} step${total - visited !== 1 ? 's' : ''} remaining</div>
      </div>
    </div>
  `;
}

// ─── Main renders ─────────────────────────────────────────────────────────────

export function renderDashboardPage(): string {
  const brief = engine.getCurrentBrief();

  if (!brief) {
    return `
      <div class="page-header">
        <h1>${tip('attribution', `${iconBarChart()} Campaign Dashboard`)}</h1>
        <p>Track results, see what's working, and optimize your next campaign.</p>
      </div>
      <div class="card card-empty-state">
        <div class="page-emoji" aria-hidden="true">${iconTrendingUp()}</div>
        <p class="body-secondary">
          <a href="#" data-nav="launcher">Launch a campaign</a> to start seeing results.
        </p>
      </div>
    `;
  }

  const { attribution, funnel, variants, learning } = engine.getDashboard();
  const trends = engine.getDashboardTrends();
  const topChan = topChannel(attribution.byChannel);

  return `
    <div class="page-header">
      <h1>${tip('attribution', `${iconBarChart()} Campaign Dashboard`)}</h1>
      <p>Results for <strong>${brief.offerName}</strong></p>
    </div>

    <!-- DASH-5: Export summary button -->
    <div class="action-row" style="margin-bottom: var(--space-lg);">
      <button class="btn btn--ghost btn--sm" id="dash-copy-summary">
        <span class="nav-icon">${iconClipboard()}</span> Copy Summary
      </button>
    </div>

    <!-- DASH-1 & DASH-2: Animated metric tiles with sparklines -->
    <div class="metric-row">
      ${renderMetricTile({
        label: 'Cost Per Lead',     tipKey: 'cpl',  valueId: 'dash-cpl',
        target: attribution.cpl,   prefix: '$',     decimals: 2,
        sub: 'lower is better',    colorClass: 'metric-green',
        sparkValues: trends.cpl,   sparkColor: 'var(--color-success)',
      })}
      ${renderMetricTile({
        label: 'Return on Ad Spend', tipKey: 'roas', valueId: 'dash-roas',
        target: attribution.roas,    suffix: 'x',    decimals: 1,
        sub: 'revenue per $1 spent', colorClass: 'metric-primary',
        sparkValues: trends.roas,    sparkColor: 'var(--accent-primary)',
      })}
      ${renderMetricTile({
        label: 'Total Spend',     tipKey: 'impressions', valueId: 'dash-spend',
        target: attribution.totalSpend,                  prefix: '$',
        sub: 'campaign investment',
        sparkValues: trends.spend, sparkColor: 'var(--text-secondary)',
      })}
      ${renderMetricTile({
        label: 'Total Revenue',         tipKey: 'conversionRate', valueId: 'dash-revenue',
        target: attribution.totalRevenue,                          prefix: '$',
        sub: 'attributed revenue',      colorClass: 'metric-green',
        sparkValues: trends.revenue,    sparkColor: 'var(--color-success)',
      })}
    </div>

    <hr class="section-divider" />

    <!-- DASH-3: Premium funnel -->
    <h3 class="section-heading">${tip('funnel', `${iconFunnel()} Funnel Conversion`)}</h3>
    ${renderPremiumFunnel(funnel)}

    <hr class="section-divider" />

    <!-- Performance by Channel -->
    <h3 class="section-heading">
      ${tip('channel', `${iconBroadcast()} Performance by Channel`)}
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

    <!-- Research Signals -->
    <h3 class="section-heading">${iconBroadcast()} Research Opportunity Signals</h3>
    <div class="metric-row">
      <div class="metric-tile">
        <div class="metric-label">Captured signals</div>
        <div class="metric-value" id="dash-signals"
             data-target="${researchSummary.totalRecords}" data-prefix="" data-suffix="" data-decimals="0">—</div>
        <div class="metric-sub">local research records in repo</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Active review queue</div>
        <div class="metric-value metric-primary" id="dash-active-queue"
             data-target="${researchSummary.activeRecords}" data-prefix="" data-suffix="" data-decimals="0">—</div>
        <div class="metric-sub">new + reviewing opportunities</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Average score</div>
        <div class="metric-value">${researchSummary.averageScore}</div>
        <div class="metric-sub">weighted advisory priority</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Top score</div>
        <div class="metric-value metric-green">${researchSummary.highestScore}</div>
        <div class="metric-sub">best current signal</div>
      </div>
    </div>

    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>Platform mix</th>
            <th>Records</th>
            <th>What it tells you</th>
          </tr>
        </thead>
        <tbody>
          ${researchSummary.platformCounts.map((row) => `
            <tr>
              <td class="cell-capitalize">${sentenceCase(row.platform)}</td>
              <td>${row.count}</td>
              <td>${row.count > 1 ? 'Enough repeated signal to compare language patterns.' : 'Only one captured signal so far — keep researching before overcommitting.'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>Top opportunity</th>
            <th>Status</th>
            <th>Score</th>
            <th>Pain point</th>
            <th>Suggested next move</th>
          </tr>
        </thead>
        <tbody>
          ${researchSummary.topOpportunities.map((row) => `
            <tr>
              <td>${row.platform} · ${row.id}</td>
              <td>${row.status}</td>
              <td class="score-value score-${row.total >= 35 ? 'high' : 'mid'}">${row.total}</td>
              <td>${row.painPoint}</td>
              <td>${row.recommendedAction}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <p class="body-secondary">This research summary is advisory and local-only. It helps you decide what to study or test next; it does not approve outreach or trigger any outbound action.</p>

    <hr class="section-divider" />

    <!-- DASH-4: Learning journey ring + activity table -->
    <h3 class="section-heading">${tip('', `${iconCompass()} Learning Journey Activity`)}</h3>
    <div class="dash-journey-row">
      ${renderJourneyRing(learning)}
      <div class="metric-row dash-journey-tiles">
        <div class="metric-tile">
          <div class="metric-label">Tracked page views</div>
          <div class="metric-value" id="dash-pageviews"
               data-target="${learning.totalPageViews}" data-prefix="" data-suffix="" data-decimals="0">—</div>
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

    <!-- DASH-6: Top Copy Variants with SVG trophy icon -->
    <h3 class="section-heading">
      ${tip('variant', `${iconTrophy()} Top Copy Variants`)}
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
              <td class="score-value score-${v.score >= 80 ? 'high' : 'mid'}">${v.score}${i === 0 ? ' ' + iconTrophy() : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- W4: Publishing Activity Feed -->
    <hr class="section-divider" />
    <h3 class="section-heading">
      ${tip('publishHistory', `${iconBroadcast()} Publishing Activity`)}
    </h3>
    <div class="card card-overflow">
      <table class="data-table">
        <thead>
          <tr>
            <th>${tip('channel', 'Channel')}</th>
            <th>Status</th>
            <th>Time</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          ${engine.getPublishHistory().length ? engine.getPublishHistory().map(entry => {
            let statusLabel = entry.state === 'scheduled' ? 'Scheduled' : entry.state === 'dispatched' ? 'Sent' : 'Failed';
            let statusClass = entry.state === 'scheduled' ? 'badge-pending' : entry.state === 'dispatched' ? 'badge-approved' : 'badge-rejected';
            
            // Format time nicely
            const d = new Date(entry.runAt);
            const timeStr = isNaN(d.getTime()) ? entry.runAt : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            return `
            <tr>
              <td><span class="badge badge-${entry.channel === 'meta' ? 'scheduled' : entry.channel === 'linkedin' ? 'approved' : 'pending'}">${entry.channel}</span></td>
              <td><span class="badge ${statusClass}">${statusLabel}</span></td>
              <td class="body-secondary" style="font-size:12px">${timeStr}</td>
              <td class="cell-truncate" style="max-width:300px;font-size:12px">${entry.assetLabel}</td>
            </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="4" style="text-align:center;color:var(--text-muted);padding:var(--space-md)">
                No publishing activity yet.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Hidden data for export -->
    <div
      id="dash-export-data"
      style="display:none"
      data-offer="${brief.offerName}"
      data-cpl="${attribution.cpl.toFixed(2)}"
      data-roas="${attribution.roas}"
      data-spend="${attribution.totalSpend}"
      data-revenue="${attribution.totalRevenue}"
      data-top-channel="${topChan}"
      data-signals="${researchSummary.totalRecords}"
      data-avg-score="${researchSummary.averageScore}"
    ></div>
  `;
}


// ─── Event binding ────────────────────────────────────────────────────────────

export function bindDashboardEvents(): void {
  // DASH-1: Animate all metric tiles with data-target on page load
  const animatableEls = document.querySelectorAll<HTMLElement>('[data-target]');
  animatableEls.forEach((el) => {
    const target = parseFloat(el.dataset.target || '0');
    if (isNaN(target)) return;

    animateCounter(el, target, 1200, {
      prefix: el.dataset.prefix || '',
      suffix: el.dataset.suffix || '',
      decimals: el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : undefined,
    });
  });

  // DASH-5: Copy summary to clipboard
  const copyBtn = document.getElementById('dash-copy-summary');
  const exportEl = document.getElementById('dash-export-data') as HTMLElement | null;
  if (copyBtn && exportEl) {
    copyBtn.addEventListener('click', async () => {
      const d = exportEl.dataset;
      const funnelData = engine.getDashboard().funnel;
      const funnelText = funnelData.map(f =>
        `  ${f.stage.charAt(0).toUpperCase() + f.stage.slice(1)}: ${f.rate}%`
      ).join('\n');

      const text = [
        `GrowthOps Campaign Report`,
        `=========================`,
        `Campaign:      ${d['offer']}`,
        `CPL:           $${d['cpl']}  |  ROAS: ${d['roas']}x`,
        `Total Spend:   $${Number(d['spend']).toLocaleString()}`,
        `Total Revenue: $${Number(d['revenue']).toLocaleString()}`,
        ``,
        `Funnel Conversion:`,
        funnelText,
        ``,
        `Top Channel:   ${d['topChannel']} by ROAS`,
        `Research:      ${d['signals']} signals captured, avg score ${d['avgScore']}`,
        ``,
        `Generated by GrowthOps OS`,
      ].join('\n');

      try {
        await navigator.clipboard.writeText(text);
        toastSuccess('Dashboard summary copied to clipboard.');
      } catch {
        // Fallback for environments without clipboard API
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity  = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          toastSuccess('Dashboard summary copied to clipboard.');
        } catch {
          toastError('Could not copy to clipboard. Please copy manually.');
        }
      }
    });
  }
}
