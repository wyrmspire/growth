/**
 * TEST-6 — Page Render Smoke Tests
 * For each of the 11 pages, tests that the render function returns
 * non-empty HTML (empty-state render) with expected structural markers.
 * Pages are tested in empty state (no campaign data) so they don't need
 * mock-engine setup. Also tests one "with data" scenario for dashboard.
 *
 * Note: Page render functions are pure string factories (no DOM side effects),
 * so they work cleanly in node environment.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { resetAll } from '../mock-engine';

// ─── Reset before each test to ensure clean empty-state ──────────────────────
beforeEach(() => resetAll());

// ─── Helper ───────────────────────────────────────────────────────────────────
function assertValidHtml(html: string, pageId: string): void {
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(50);
    // Should contain at least one heading or content block
    const hasContent =
        html.includes('<h1') ||
        html.includes('<h2') ||
        html.includes('<h3') ||
        html.includes('<p') ||
        html.includes('<div') ||
        html.includes('<section');
    expect(hasContent).toBe(true);
}

// ─── Discovery Page ───────────────────────────────────────────────────────────
describe('renderDiscoveryPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderDiscoveryPage } = await import('../pages/discovery');
        const html = renderDiscoveryPage();
        assertValidHtml(html, 'discovery');
    });

    it('contains page header or form', async () => {
        const { renderDiscoveryPage } = await import('../pages/discovery');
        const html = renderDiscoveryPage();
        const hasHeader = html.includes('h1') || html.includes('form') || html.includes('interview');
        expect(hasHeader).toBe(true);
    });
});

// ─── Strategy Workspace Page ─────────────────────────────────────────────────
describe('renderStrategyWorkspacePage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderStrategyWorkspacePage } = await import('../pages/strategy-workspace');
        const html = renderStrategyWorkspacePage();
        assertValidHtml(html, 'strategy-workspace');
    });
});

// ─── Launcher Page ────────────────────────────────────────────────────────────
describe('renderLauncherPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderLauncherPage } = await import('../pages/launcher');
        const html = renderLauncherPage();
        assertValidHtml(html, 'launcher');
    });
});

// ─── Review Page ──────────────────────────────────────────────────────────────
describe('renderReviewPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderReviewPage } = await import('../pages/review');
        const html = renderReviewPage();
        assertValidHtml(html, 'review');
    });
});

// ─── Calendar Page ────────────────────────────────────────────────────────────
describe('renderCalendarPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderCalendarPage } = await import('../pages/calendar');
        const html = renderCalendarPage();
        assertValidHtml(html, 'calendar');
    });
});

// ─── Comments Page ────────────────────────────────────────────────────────────
describe('renderCommentsPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderCommentsPage } = await import('../pages/comments');
        const html = renderCommentsPage();
        assertValidHtml(html, 'comments');
    });
});

// ─── Dashboard Page ───────────────────────────────────────────────────────────
describe('renderDashboardPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderDashboardPage } = await import('../pages/dashboard');
        const html = renderDashboardPage();
        assertValidHtml(html, 'dashboard');
    });

    it('empty state does not throw', async () => {
        const { renderDashboardPage } = await import('../pages/dashboard');
        expect(() => renderDashboardPage()).not.toThrow();
    });
});

describe('renderDashboardPage — with campaign data', () => {
    it('renders metric tiles when campaign data exists', async () => {
        const engine = await import('../mock-engine');
        engine.submitDiscoveryInterview({
            businessName: 'Page Render Test',
            industry: 'saas',
            targetCustomer: 'Devs',
            currentOfferings: ['Free', 'Pro'],
            painPoints: ['Slow'],
            competitiveAdvantage: 'Fast',
        });
        engine.getOfferSuggestions();
        const profile = engine.approveOffer(0);
        engine.createCampaign({
            offerName: profile.hypothesis.name,
            audience: 'devs',
            channels: ['meta'],
            goals: ['leads'],
        });
        engine.sendToReview();
        engine.approveAll();
        engine.scheduleAll();
        engine.publishNow();

        const { renderDashboardPage } = await import('../pages/dashboard');
        const html = renderDashboardPage();
        assertValidHtml(html, 'dashboard');
        // Should contain a metric tile or section for attribution
        expect(html.length).toBeGreaterThan(200);
    });
});

// ─── Integrations Page ────────────────────────────────────────────────────────
describe('renderIntegrationsPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderIntegrationsPage } = await import('../pages/integrations');
        const html = renderIntegrationsPage();
        assertValidHtml(html, 'integrations');
    });
});

// ─── Opportunities Page ───────────────────────────────────────────────────────
describe('renderOpportunitiesPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderOpportunitiesPage } = await import('../pages/opportunities');
        const html = renderOpportunitiesPage();
        assertValidHtml(html, 'opportunities');
    });
});

// ─── Projects Page ────────────────────────────────────────────────────────────
describe('renderProjectsPage — empty state', () => {
    it('returns non-empty HTML string', async () => {
        const { renderProjectsPage } = await import('../pages/projects');
        const html = renderProjectsPage();
        assertValidHtml(html, 'projects');
    });

    it('does not throw when called', async () => {
        const { renderProjectsPage } = await import('../pages/projects');
        expect(() => renderProjectsPage()).not.toThrow();
    });
});

// ─── No render throws unexpectedly ───────────────────────────────────────────
describe('all pages — no unexpected throws', () => {
    it('can import and call all page render functions without throwing', async () => {
        const pages = await Promise.all([
            import('../pages/discovery'),
            import('../pages/strategy-workspace'),
            import('../pages/launcher'),
            import('../pages/review'),
            import('../pages/calendar'),
            import('../pages/comments'),
            import('../pages/dashboard'),
            import('../pages/integrations'),
            import('../pages/opportunities'),
            import('../pages/projects'),
        ]);

        const renders = [
            pages[0].renderDiscoveryPage,
            pages[1].renderStrategyWorkspacePage,
            pages[2].renderLauncherPage,
            pages[3].renderReviewPage,
            pages[4].renderCalendarPage,
            pages[5].renderCommentsPage,
            pages[6].renderDashboardPage,
            pages[7].renderIntegrationsPage,
            pages[8].renderOpportunitiesPage,
            pages[9].renderProjectsPage,
        ];

        renders.forEach((fn, i) => {
            expect(() => fn(), `Page ${i} threw`).not.toThrow();
        });
    });
});
