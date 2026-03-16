/**
 * TEST-4 — Icons Component Tests
 * Tests navIcon() for all 11 NavIconId values, each named icon function,
 * and edge cases (unknown id, empty string).
 */
import { describe, expect, it } from 'vitest';
import {
    navIcon,
    iconSearch,
    iconMap,
    iconRocket,
    iconClipboard,
    iconCalendar,
    iconMessageCircle,
    iconBarChart,
    iconPalette,
    iconLink,
    iconRadar,
    iconMonitor,
    iconLayoutGrid,
    iconTrendingUp,
    iconFunnel,
    iconBroadcast,
    iconTrophy,
    iconCompass,
    iconZap,
    iconChevronDown,
    iconChevronRight,
    iconCheck,
    iconX,
    iconInfo,
    iconAlertTriangle,
    iconMenu,
    iconHelpCircle,
    iconChart,
    iconFlask,
    iconLightbulb,
} from '../../icons';
import type { NavIconId } from '../../icons';

// ─── navIcon() — all valid IDs ────────────────────────────────────────────────

const NAV_IDS: NavIconId[] = [
    'discovery',
    'strategy-workspace',
    'launcher',
    'review',
    'calendar',
    'comments',
    'dashboard',
    'style-studio',
    'integrations',
    'opportunities',
    'preview-feed',
    'projects',
];

describe('navIcon — all NavIconId values', () => {
    NAV_IDS.forEach((id) => {
        it(`navIcon("${id}") returns a non-empty SVG string`, () => {
            const svg = navIcon(id);
            expect(typeof svg).toBe('string');
            expect(svg.length).toBeGreaterThan(0);
            expect(svg).toContain('<svg');
        });
    });
});

describe('navIcon — edge cases', () => {
    it('returns empty string or fallback for unknown id', () => {
        // The function should not throw for unknown input
        expect(() => navIcon('nonexistent' as NavIconId)).not.toThrow();
    });
});

// ─── Individual icon functions ────────────────────────────────────────────────

const ICON_FNS = [
    ['iconSearch', iconSearch],
    ['iconMap', iconMap],
    ['iconRocket', iconRocket],
    ['iconClipboard', iconClipboard],
    ['iconCalendar', iconCalendar],
    ['iconMessageCircle', iconMessageCircle],
    ['iconBarChart', iconBarChart],
    ['iconPalette', iconPalette],
    ['iconLink', iconLink],
    ['iconRadar', iconRadar],
    ['iconMonitor', iconMonitor],
    ['iconLayoutGrid', iconLayoutGrid],
    ['iconTrendingUp', iconTrendingUp],
    ['iconFunnel', iconFunnel],
    ['iconBroadcast', iconBroadcast],
    ['iconTrophy', iconTrophy],
    ['iconCompass', iconCompass],
    ['iconZap', iconZap],
    ['iconChevronDown', iconChevronDown],
    ['iconChevronRight', iconChevronRight],
    ['iconCheck', iconCheck],
    ['iconX', iconX],
    ['iconInfo', iconInfo],
    ['iconAlertTriangle', iconAlertTriangle],
    ['iconMenu', iconMenu],
    ['iconHelpCircle', iconHelpCircle],
    ['iconChart', iconChart],
    ['iconFlask', iconFlask],
    ['iconLightbulb', iconLightbulb],
] as const;

describe('individual icon functions — return valid SVG', () => {
    ICON_FNS.forEach(([name, fn]) => {
        it(`${name}() returns a string containing <svg`, () => {
            const result = (fn as () => string)();
            expect(typeof result).toBe('string');
            expect(result).toContain('<svg');
        });

        it(`${name}() result is non-empty`, () => {
            const result = (fn as () => string)();
            expect(result.length).toBeGreaterThan(10);
        });
    });
});

// ─── SVG structure validation ────────────────────────────────────────────────

describe('SVG structure', () => {
    it('all nav icons have viewBox attribute', () => {
        NAV_IDS.forEach(id => {
            const svg = navIcon(id);
            expect(svg).toContain('viewBox="0 0 24 24"');
        });
    });

    it('all nav icons contain stroke attribute (stroke-based icons)', () => {
        NAV_IDS.forEach(id => {
            const svg = navIcon(id);
            expect(svg).toContain('stroke=');
        });
    });

    it('individual icons contain closing </svg> tag', () => {
        ICON_FNS.forEach(([, fn]) => {
            expect((fn as () => string)()).toContain('</svg>');
        });
    });
});
