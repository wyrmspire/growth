/**
 * Inline SVG icon system — replaces emoji nav icons with clean, consistent SVGs.
 * Based on Lucide icon design language (24×24, stroke-based, 2px stroke).
 * Each function returns an SVG string ready for innerHTML injection.
 */

const S = (d: string, extra = ''): string =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;

// ─── Navigation Icons ────────────────────────────────────────────

export const iconSearch = () => S(
  '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
);

export const iconMap = () => S(
  '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>'
);

export const iconRocket = () => S(
  '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'
);

export const iconClipboard = () => S(
  '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'
);

export const iconCalendar = () => S(
  '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
);

export const iconMessageCircle = () => S(
  '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>'
);

export const iconBarChart = () => S(
  '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'
);

export const iconPalette = () => S(
  '<circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'
);

export const iconLink = () => S(
  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
);

export const iconRadar = () => S(
  '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/>'
);

export const iconMonitor = () => S(
  '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'
);

export const iconLayoutGrid = () => S(
  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'
);

export const iconTrendingUp = () => S(
  '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
);

export const iconFunnel = () => S(
  '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
);

export const iconBroadcast = () => S(
  '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>'
);

export const iconTrophy = () => S(
  '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'
);

export const iconCompass = () => S(
  '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'
);

export const iconZap = () => S(
  '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
);

// ─── Utility Icons ───────────────────────────────────────────────

export const iconChevronDown = () => S(
  '<polyline points="6 9 12 15 18 9"/>'
);

export const iconChevronRight = () => S(
  '<polyline points="9 18 15 12 9 6"/>'
);

export const iconCheck = () => S(
  '<polyline points="20 6 9 17 4 12"/>'
);

export const iconX = () => S(
  '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
);

export const iconInfo = () => S(
  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
);

export const iconAlertTriangle = () => S(
  '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
);

export const iconMenu = () => S(
  '<line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/>'
);

export const iconHelpCircle = () => S(
  '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
);

// ─── VIS-8: Additional Section / Page Header Icons ───────────────
// (iconFunnel, iconBroadcast, iconTrophy, iconCompass, iconZap
//  are already declared above alongside iconLayoutGrid etc.)

/** 📊 → chart bars — for dashboard analytics section headings */
export const iconChart = () => S(
  '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'
);

/** 🧪 → flask/beaker — for experiment / starter-example sections */
export const iconFlask = () => S(
  '<path d="M9 3h6"/><path d="M8.5 3 6 22h12L15.5 3"/><path d="m6 15h12"/>'
);

/** 💡 → lightbulb — for idea / offer / coaching block icons */
export const iconLightbulb = () => S(
  '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'
);

/** ⚙ → gear/cog — for Setup & Accounts page */
export const iconSettings = () => S(
  '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
);

// ─── Nav item → icon mapping ─────────────────────────────────────

export type NavIconId =
  | 'discovery'
  | 'strategy-workspace'
  | 'launcher'
  | 'review'
  | 'calendar'
  | 'comments'
  | 'dashboard'
  | 'style-studio'
  | 'integrations'
  | 'opportunities'
  | 'preview-feed'
  | 'projects'
  | 'setup';

const NAV_ICONS: Record<NavIconId, () => string> = {
  discovery: iconSearch,
  'strategy-workspace': iconMap,
  launcher: iconRocket,
  review: iconClipboard,
  calendar: iconCalendar,
  comments: iconMessageCircle,
  dashboard: iconBarChart,
  'style-studio': iconPalette,
  integrations: iconLink,
  opportunities: iconRadar,
  'preview-feed': iconMonitor,
  projects: iconLayoutGrid,
  setup: iconSettings,
};

export function navIcon(id: NavIconId): string {
  const fn = NAV_ICONS[id];
  return fn ? fn() : '';
}
