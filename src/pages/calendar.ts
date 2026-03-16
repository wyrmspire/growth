/**
 * calendar.ts — Publishing Calendar page
 *
 * CAL-1: Three switchable views (Day / Week / List) — default Week
 * CAL-2: Color-coded optimal posting-window bands (Day + Week only)
 * CAL-3: Conflict detection — 2+ posts on the same channel within 30 minutes
 * CAL-4: Timezone display in header (Intl.DateTimeFormat)
 * CAL-5: Polished empty state with skeleton week grid + posting-window bands
 * CAL-6: Toast integration for "Publish All Now" and view toggle
 */

import { tip } from '../components/tooltip';
import { toastSuccess, toastInfo, toastError } from '../components/toast';
import * as engine from '../mock-engine';
import type { PublishCalendarEntry } from '../../modules/core/src/types';
import { iconCalendar, iconZap, iconBroadcast } from '../icons';

// ── Session-persistent view selection ────────────────────────────────────────
type CalendarView = 'day' | 'week' | 'list';
const CAL_VIEW_KEY = 'growthops_cal_view';

function getCalendarView(): CalendarView {
  try {
    const stored = sessionStorage.getItem(CAL_VIEW_KEY) as CalendarView | null;
    if (stored === 'day' || stored === 'week' || stored === 'list') return stored;
  } catch { /* noop */ }
  return 'week';
}

function saveCalendarView(view: CalendarView): void {
  try { sessionStorage.setItem(CAL_VIEW_KEY, view); } catch { /* noop */ }
}

// ── Timezone detection ────────────────────────────────────────────────────────
function getTimezoneLabel(): { label: string; ok: boolean } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const m = String(Math.abs(offset) % 60).padStart(2, '0');
    return { label: `${tz} (UTC${sign}${h}:${m})`, ok: true };
  } catch {
    return { label: 'UTC (timezone detection unavailable)', ok: false };
  }
}

// ── Conflict detection (CAL-3) ────────────────────────────────────────────────
function detectConflicts(entries: PublishCalendarEntry[]): Set<string> {
  const conflictIds = new Set<string>();
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.channel !== b.channel) continue;
      const diffMs = Math.abs(new Date(a.runAt).getTime() - new Date(b.runAt).getTime());
      if (diffMs <= 30 * 60 * 1000) {
        conflictIds.add(a.jobId);
        conflictIds.add(b.jobId);
      }
    }
  }
  return conflictIds;
}

// ── Posting-window definitions (CAL-2) ────────────────────────────────────────
interface PostingWindow {
  channel: string;
  label: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23 exclusive
  color: string;     // HSL color string (used at 0.08 opacity in background)
  textColor: string;
}

const POSTING_WINDOWS: PostingWindow[] = [
  { channel: 'meta',     label: 'Meta (evenings)',   startHour: 18, endHour: 21, color: '--accent-blue',   textColor: 'var(--accent-blue)' },
  { channel: 'linkedin', label: 'LinkedIn (mornings)',startHour: 7,  endHour: 10, color: '--accent-green',  textColor: 'var(--accent-green)' },
  { channel: 'x',        label: 'X (midday)',         startHour: 11, endHour: 14, color: '--text-secondary', textColor: 'var(--text-secondary)' },
  { channel: 'email',    label: 'Email (business AM)',startHour: 9,  endHour: 11, color: '--accent-primary', textColor: 'var(--accent-primary)' },
];

// Calendar operates over the hours 8am … 22pm (hour slots)
const CAL_START_HOUR = 8;
const CAL_END_HOUR   = 22;
const TOTAL_HOURS    = CAL_END_HOUR - CAL_START_HOUR;

// ── Channel badge colours ─────────────────────────────────────────────────────
function channelBadgeClass(ch: string): string {
  return ch === 'meta' ? 'badge-scheduled'
       : ch === 'linkedin' ? 'badge-approved'
       : ch === 'email' ? 'badge-dispatched'
       : 'badge-pending';
}

// ── Posting-window legend HTML ────────────────────────────────────────────────
function renderWindowLegend(): string {
  const items = POSTING_WINDOWS.map(w => `
    <span class="cal-legend-item">
      <span class="cal-legend-dot" style="background:${w.textColor}"></span>
      <span>${w.label}</span>
    </span>
  `).join('');
  return `
    <div class="cal-legend">
      <span class="cal-legend-title">Optimal posting windows:</span>
      ${items}
    </div>
  `;
}

// ── Day-level posting-window band SVG overlay ─────────────────────────────────
function renderWindowBands(): string {
  const bands = POSTING_WINDOWS.map(w => {
    const startPct = ((w.startHour - CAL_START_HOUR) / TOTAL_HOURS) * 100;
    const widthPct = ((w.endHour - w.startHour) / TOTAL_HOURS) * 100;
    return `
      <div class="cal-window-band" style="
        left:${startPct.toFixed(2)}%;
        width:${widthPct.toFixed(2)}%;
        background:var(${w.color},currentColor);
      " aria-hidden="true" title="${w.label}"></div>
    `;
  }).join('');
  return `<div class="cal-window-bands">${bands}</div>`;
}

// ── Hour label helper ─────────────────────────────────────────────────────────
function fmtHour(h: number): string {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

// ── Entry card used across all views ─────────────────────────────────────────
function renderEntryCard(
  e: PublishCalendarEntry,
  conflictIds: Set<string>,
  compact = false,
): string {
  const isConflict = conflictIds.has(e.jobId);
  const conflictBadge = isConflict
    ? `<span class="conflict-badge" title="⚠ 2+ posts on ${e.channel} within 30 min — consider spacing out">conflict</span>`
    : '';
  const time = new Date(e.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (compact) {
    return `
      <div class="cal-entry cal-entry--${e.state}${isConflict ? ' cal-entry--conflict' : ''}" title="${e.assetLabel}">
        <span class="badge ${channelBadgeClass(e.channel)} cal-entry-channel">${e.channel}</span>
        <span class="cal-entry-time">${time}</span>
        ${conflictBadge}
      </div>
    `;
  }
  return `
    <div class="cal-entry cal-entry--${e.state}${isConflict ? ' cal-entry--conflict' : ''}">
      <div class="cal-entry-header">
        <span class="badge ${channelBadgeClass(e.channel)}">${e.channel}</span>
        <span class="badge badge-${e.state}">${e.state}</span>
        ${conflictBadge}
      </div>
      <div class="cal-entry-label">${e.assetLabel}</div>
      <div class="cal-entry-time-row"><span style="opacity:.5">⏱</span> ${time}</div>
    </div>
  `;
}

// ── View toggle buttons ───────────────────────────────────────────────────────
function renderViewToggle(active: CalendarView): string {
  const views: CalendarView[] = ['day', 'week', 'list'];
  const labels: Record<CalendarView, string> = { day: 'Day', week: 'Week', list: 'List' };
  return `
    <div class="cal-view-toggle" role="group" aria-label="Calendar view">
      ${views.map(v => `
        <button class="cal-view-btn${v === active ? ' cal-view-btn--active' : ''}"
                id="cal-view-${v}" data-cal-view="${v}" type="button">
          ${labels[v]}
        </button>
      `).join('')}
    </div>
  `;
}

// ── CAL-1: Day view ───────────────────────────────────────────────────────────
function renderDayView(entries: PublishCalendarEntry[], conflicts: Set<string>): string {
  // Find the "active" day — first scheduled day, else today
  const upcoming = entries
    .filter(e => e.state === 'scheduled')
    .sort((a, b) => a.runAt.localeCompare(b.runAt));
  const today = upcoming[0]
    ? new Date(upcoming[0].runAt)
    : new Date();
  today.setHours(0, 0, 0, 0);

  const dayEntries = entries.filter(e => {
    const d = new Date(e.runAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const dayLabel = today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const rows = Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = CAL_START_HOUR + i;
    const slotEntries = dayEntries.filter(e => new Date(e.runAt).getHours() === hour);
    const windowForHour = POSTING_WINDOWS.find(w => hour >= w.startHour && hour < w.endHour);
    const bgStyle = windowForHour
      ? `background: var(${windowForHour.color}, var(--accent-primary)) / 0.06; opacity:1;`
      : '';
    return `
      <div class="cal-day-row${windowForHour ? ' cal-day-row--window' : ''}" style="${bgStyle}">
        <div class="cal-day-hour">${fmtHour(hour)}</div>
        <div class="cal-day-slot">
          ${slotEntries.length
            ? slotEntries.map(e => renderEntryCard(e, conflicts, false)).join('')
            : '<div class="cal-day-empty"></div>'}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="cal-day-label">${dayLabel}</div>
    ${renderWindowBands()}
    <div class="calendar-day-view cal-day-grid">
      ${rows}
    </div>
    ${renderWindowLegend()}
  `;
}

// ── CAL-1: Week view ──────────────────────────────────────────────────────────
function renderWeekView(entries: PublishCalendarEntry[], conflicts: Set<string>): string {
  // Build Mon-Sun columns for the current ISO week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const cols = days.map(day => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86400_000;
    const dayEntries = entries.filter(e => {
      const t = new Date(e.runAt).getTime();
      return t >= dayStart && t < dayEnd;
    }).sort((a, b) => a.runAt.localeCompare(b.runAt));

    const isToday = day.toDateString() === new Date().toDateString();
    const hasScheduled = dayEntries.some(e => e.state === 'scheduled');

    return `
      <div class="cal-week-col${isToday ? ' cal-week-col--today' : ''}">
        <div class="cal-week-col-header">
          <span class="cal-week-day">${day.toLocaleDateString([], { weekday: 'short' })}</span>
          <span class="cal-week-date${isToday ? ' cal-week-date--today' : ''}">${day.getDate()}</span>
          ${hasScheduled ? '<span class="cal-week-has-posts"></span>' : ''}
        </div>
        <div class="cal-week-col-body">
          ${dayEntries.length
            ? dayEntries.map(e => renderEntryCard(e, conflicts, true)).join('')
            : '<div class="cal-week-empty">—</div>'}
        </div>
      </div>
    `;
  }).join('');

  // Posting-window column-highlight (subtle background on columns matching windows)
  const postingWindowNote = `
    <div class="cal-week-window-row" aria-hidden="true">
      ${days.map(day => {
        const windows = POSTING_WINDOWS
          .map(w => `<span class="cal-week-window-badge" style="color:var(${w.color},currentColor)">${w.channel}</span>`)
          .join('');
        return `<div class="cal-week-window-cell">${windows}</div>`;
      }).join('')}
    </div>
  `;

  return `
    <div class="calendar-week-view cal-week-grid">
      ${cols}
    </div>
    ${renderWindowLegend()}
  `;
}

// ── CAL-1: List view ──────────────────────────────────────────────────────────
function renderListView(entries: PublishCalendarEntry[], conflicts: Set<string>): string {
  // Group by date
  const byDate = new Map<string, PublishCalendarEntry[]>();
  entries
    .slice()
    .sort((a, b) => a.runAt.localeCompare(b.runAt))
    .forEach(e => {
      const key = new Date(e.runAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const group = byDate.get(key) || [];
      group.push(e);
      byDate.set(key, group);
    });

  const groups = Array.from(byDate.entries()).map(([dateLabel, group]) => `
    <div class="cal-list-group">
      <div class="cal-list-date-header">${dateLabel}</div>
      ${group.map(e => {
        const isConflict = conflicts.has(e.jobId);
        const time = new Date(e.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="cal-list-row${isConflict ? ' cal-list-row--conflict' : ''}">
            <div class="cal-list-time">${time}</div>
            <div class="cal-list-channel">
              <span class="badge ${channelBadgeClass(e.channel)}">${e.channel}</span>
            </div>
            <div class="cal-list-label">${e.assetLabel}</div>
            <div class="cal-list-status">
              <span class="badge badge-${e.state}">${e.state}</span>
              ${isConflict ? `<span class="conflict-badge">conflict</span>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  return `
    <div class="calendar-list-view">
      ${groups}
    </div>
  `;
}

// ── CAL-5: Empty state ────────────────────────────────────────────────────────
function renderEmptyState(): string {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7) + i);
    return d;
  });

  const skeletonCols = days.map(day => {
    const isToday = day.toDateString() === now.toDateString();
    return `
      <div class="cal-week-col${isToday ? ' cal-week-col--today' : ''}">
        <div class="cal-week-col-header">
          <span class="cal-week-day">${day.toLocaleDateString([], { weekday: 'short' })}</span>
          <span class="cal-week-date${isToday ? ' cal-week-date--today' : ''}">${day.getDate()}</span>
        </div>
        <div class="cal-week-col-body">
          ${isToday ? `
            <div class="cal-entry skeleton-entry">
              <div class="skeleton-line" style="width:60%"></div>
              <div class="skeleton-line" style="width:40%;margin-top:4px"></div>
            </div>
          ` : '<div class="cal-week-empty">—</div>'}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>${tip('publishing', `${iconCalendar()} Publishing Calendar`)}</h1>
      <p>See when your approved content is scheduled to go live.</p>
    </div>

    <div class="coach-block" style="margin-bottom:var(--space-xl)">
      <div class="coach-block-icon">${iconCalendar()}</div>
      <div class="coach-block-body">
        <span class="coach-what"><strong>Nothing scheduled yet.</strong></span>
        <span class="coach-why">Posts appear here once you've approved content in the Review Queue and clicked "Schedule All for Publishing".</span>
        <span class="coach-next">→ <a href="#" data-nav="review">Head to Review Queue</a> to approve content, then schedule it here.</span>
      </div>
    </div>

    <div class="cal-empty-preview">
      <div class="cal-empty-label">This week at a glance — posting windows shown</div>
      ${renderWindowBands()}
      <div class="calendar-week-view cal-week-grid cal-week-grid--skeleton">
        ${skeletonCols}
      </div>
      ${renderWindowLegend()}
    </div>
  `;
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderCalendarPage(): string {
  const entries = engine.getCalendar();

  if (!entries.length) {
    return renderEmptyState();
  }

  const view = getCalendarView();
  const conflicts = detectConflicts(entries);
  const dispatched = entries.filter(e => e.state === 'dispatched').length;
  const scheduled = entries.filter(e => e.state === 'scheduled').length;
  const tz = getTimezoneLabel();

  let viewHtml: string;
  if (view === 'day') {
    viewHtml = renderDayView(entries, conflicts);
  } else if (view === 'list') {
    viewHtml = renderListView(entries, conflicts);
  } else {
    viewHtml = renderWeekView(entries, conflicts);
  }

  return `
    <div class="page-header">
      <h1>${tip('publishing', `${iconCalendar()} Publishing Calendar`)}</h1>
      <p>
        ${entries.length} posts · ${dispatched} published · ${scheduled} scheduled ·
        <span class="cal-tz-label${!tz.ok ? ' cal-tz-label--warn' : ''}" title="Times are shown in your local timezone">
          🌐 ${tz.label}
        </span>
      </p>
    </div>

    <div class="cal-toolbar">
      ${scheduled > 0 ? `
        <button class="btn btn-success" id="publish-now-btn">
          <span class="nav-icon">${iconZap()}</span> Publish All Now
        </button>
      ` : ''}
      ${renderViewToggle(view)}
    </div>

    <div class="metric-row">
      ${(['meta', 'linkedin', 'x', 'email'] as const).map(ch => {
        const count = entries.filter(e => e.channel === ch).length;
        if (!count) return '';
        return `
          <div class="metric-tile">
            <div class="metric-label">${ch}</div>
            <div class="metric-value channel-${ch}">${count}</div>
            <div class="metric-sub">posts</div>
          </div>
        `;
      }).join('')}
    </div>

    ${conflicts.size > 0 ? `
      <div class="status-banner status-banner--error" role="alert">
        <strong>⚠ Scheduling conflicts detected</strong>
        <span>${Math.ceil(conflicts.size / 2)} pair(s) of posts scheduled within 30 minutes on the same channel. Items are marked with a <span class="conflict-badge">conflict</span> badge.</span>
      </div>
    ` : ''}

    <div id="cal-view-panel">
      ${viewHtml}
    </div>
  `;
}

// ── Event binding ─────────────────────────────────────────────────────────────
export function bindCalendarEvents(): void {
  // Publish All Now
  const publishBtn = document.getElementById('publish-now-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      try {
        engine.trackLearningAction('calendar.publish-all-now', 'calendar');
        engine.publishNow();
        toastSuccess('All scheduled posts published.');
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
      } catch (err) {
        toastError(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

  // View toggle buttons
  document.querySelectorAll('[data-cal-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = (btn as HTMLElement).dataset.calView as CalendarView;
      if (!view) return;
      const prev = getCalendarView();
      if (view === prev) return;
      saveCalendarView(view);
      const labels: Record<CalendarView, string> = { day: 'day', week: 'week', list: 'list' };
      toastInfo(`Switched to ${labels[view]} view`);
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
    });
  });
}
