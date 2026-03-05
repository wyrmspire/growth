import './index.css';
import { attachTooltips } from './components/tooltip';
import { openDrawer } from './components/help-drawer';
import * as engine from './mock-engine';
import { renderDiscoveryPage, bindDiscoveryEvents } from './pages/discovery';
import { renderLauncherPage, bindLauncherEvents } from './pages/launcher';
import { renderReviewPage, bindReviewEvents } from './pages/review';
import { renderCalendarPage, bindCalendarEvents } from './pages/calendar';
import { renderCommentsPage, bindCommentsEvents } from './pages/comments';
import { renderDashboardPage, bindDashboardEvents } from './pages/dashboard';

type PageId = 'discovery' | 'launcher' | 'review' | 'calendar' | 'comments' | 'dashboard';
const MOBILE_BREAKPOINT = 900;

// Glossary keys shown in the help drawer for each page
const PAGE_HELP_KEYS: Record<PageId, string[]> = {
  discovery: ['businessDiscovery', 'offer', 'icp', 'offerHypothesis', 'confidence'],
  launcher: ['campaign', 'funnel', 'awareness', 'consideration', 'decision', 'copy', 'variant', 'channel', 'cta', 'generateCopy'],
  review: ['reviewQueue', 'approve', 'reject', 'copy', 'draftReply'],
  calendar: ['publishing', 'schedule', 'channelMeta', 'channelLinkedin', 'channelX', 'channelEmail'],
  comments: ['commentTriage', 'intentLead', 'intentSupport', 'intentObjection', 'intentSpam', 'draftReply', 'approve'],
  dashboard: ['attribution', 'cpl', 'roas', 'conversionRate', 'impressions', 'clicks', 'funnel'],
};

// Journey steps — used for the progress bar
const JOURNEY_STEPS: { id: PageId; label: string; description: string }[] = [
  { id: 'discovery', label: 'Discover', description: 'Define your business and choose what to promote' },
  { id: 'launcher', label: 'Launch', description: 'Create your campaign and generate ad copy' },
  { id: 'review', label: 'Review', description: 'Approve or reject content before it goes live' },
  { id: 'calendar', label: 'Schedule', description: 'Pick when your posts go live on each platform' },
  { id: 'comments', label: 'Respond', description: 'Handle comments and send approved replies' },
  { id: 'dashboard', label: 'Measure', description: 'See what worked and improve next time' },
];

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
  tipKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'discovery', icon: '🔍', label: 'Business Discovery', tipKey: 'businessDiscovery' },
  { id: 'launcher', icon: '🚀', label: 'Campaign Launcher', tipKey: 'campaign' },
  { id: 'review', icon: '📋', label: 'Review Queue', tipKey: 'reviewQueue' },
  { id: 'calendar', icon: '📅', label: 'Publishing', tipKey: 'publishing' },
  { id: 'comments', icon: '💬', label: 'Comment Ops', tipKey: 'commentTriage' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', tipKey: 'attribution' },
];

let currentPage: PageId = 'discovery';

function getNavItem(page: PageId): NavItem {
  return NAV_ITEMS.find((item) => item.id === page) || NAV_ITEMS[0];
}

function renderSidebar(): string {
  const stepIndex = JOURNEY_STEPS.findIndex(s => s.id === currentPage);
  return `
    <div class="sidebar-header-mobile">
      <span class="sidebar-mobile-title">Navigation</span>
      <button type="button" class="sidebar-close-btn" id="mobile-menu-close" aria-label="Close navigation">
        Close
      </button>
    </div>
    <div class="sidebar-logo">
      <div class="logo-icon">G</div>
      GrowthOps OS
    </div>
    <ul class="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <li>
          <a href="#" data-nav="${item.id}" data-tip="${item.tipKey}"
             class="${item.id === currentPage ? 'active' : ''}">
            <span class="nav-icon">${item.icon}</span>
            ${item.label}
          </a>
        </li>
      `).join('')}
    </ul>
    <div class="sidebar-journey">
      <div class="journey-label">Your progress</div>
      ${JOURNEY_STEPS.map((step, i) => `
        <div class="journey-step ${i < stepIndex ? 'done' : i === stepIndex ? 'current' : ''}">
          <span class="journey-dot"></span>
          <span class="journey-step-name">${step.label}</span>
        </div>
      `).join('')}
    </div>
    <div class="mock-badge" data-tip="mockMode">
      &#9888; Mock Mode
    </div>
  `;
}

function renderMobileTopbar(): string {
  const active = getNavItem(currentPage);
  return `
    <header class="mobile-topbar" id="mobile-topbar">
      <button type="button" class="mobile-menu-btn" id="mobile-menu-toggle" aria-label="Open navigation">
        Menu
      </button>
      <div class="mobile-topbar-title">
        <span class="mobile-topbar-icon">${active.icon}</span>
        <span id="mobile-current-page">${active.label}</span>
      </div>
      <span class="mobile-topbar-badge">Mock</span>
    </header>
  `;
}

const PAGE_RENDERERS: Record<PageId, () => string> = {
  discovery: renderDiscoveryPage,
  launcher: renderLauncherPage,
  review: renderReviewPage,
  calendar: renderCalendarPage,
  comments: renderCommentsPage,
  dashboard: renderDashboardPage,
};

const PAGE_BINDERS: Record<PageId, () => void> = {
  discovery: bindDiscoveryEvents,
  launcher: bindLauncherEvents,
  review: bindReviewEvents,
  calendar: bindCalendarEvents,
  comments: bindCommentsEvents,
  dashboard: bindDashboardEvents,
};

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateMobileTitle(): void {
  const label = getNavItem(currentPage).label;
  const titleEl = document.getElementById('mobile-current-page');
  if (titleEl) titleEl.textContent = label;
}

function closeMobileNav(): void {
  document.body.classList.remove('nav-open');
}

function openMobileNav(): void {
  document.body.classList.add('nav-open');
}

function toggleMobileNav(): void {
  if (document.body.classList.contains('nav-open')) {
    closeMobileNav();
    return;
  }
  openMobileNav();
}

function navigate(page: PageId): void {
  currentPage = page;

  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');

  if (sidebar) sidebar.innerHTML = renderSidebar();
  if (main) main.innerHTML = PAGE_RENDERERS[page]();

  updateMobileTitle();
  updateIntentBanner();
  PAGE_BINDERS[page]();

  if (isMobileViewport()) {
    closeMobileNav();
  }
}

function updateIntentBanner(): void {
  // Show different guidance depending on how far into the journey the user is
  const banner = document.getElementById('intent-banner-text');
  if (!banner) return;
  const hasInterview = !!engine.getCurrentInterview();
  const hasBrief = !!engine.getCurrentBrief();
  if (!hasInterview) {
    banner.textContent = 'You\'re setting up campaigns for your own business or a client\'s — not building a product to sell.';
  } else if (!hasBrief) {
    banner.textContent = 'Great start! Next: create a campaign to promote the offer you just approved.';
  } else {
    banner.textContent = 'You\'re running a real campaign. Every approval you make goes into your publishing queue.';
  }
}

function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="intent-banner" id="intent-banner">
      <span class="intent-banner-icon">💡</span>
      <span id="intent-banner-text">You're setting up campaigns for your own business or a client's — not building a product to sell.</span>
      <button class="help-btn" id="help-btn" title="What does this mean?">What does this mean?</button>
    </div>
    ${renderMobileTopbar()}
    <button class="mobile-overlay" id="mobile-overlay" aria-label="Close navigation"></button>
    <div class="app-shell">
      <nav class="sidebar" id="sidebar"></nav>
      <main class="main-content" id="main"></main>
    </div>
  `;

  // Navigation handler
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-nav]');
    if (target) {
      e.preventDefault();
      const page = (target as HTMLElement).dataset.nav as PageId;
      if (page && PAGE_RENDERERS[page]) {
        navigate(page);
      }
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'mobile-menu-toggle') {
      e.preventDefault();
      toggleMobileNav();
    }
    if (target.id === 'mobile-menu-close' || target.id === 'mobile-overlay') {
      e.preventDefault();
      closeMobileNav();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      closeMobileNav();
    }
  });

  // Custom navigation events (from pages)
  window.addEventListener('navigate', ((e: CustomEvent) => {
    const page = e.detail as PageId;
    if (page && PAGE_RENDERERS[page]) {
      navigate(page);
    }
  }) as EventListener);

  // Help drawer button
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'help-btn' || target.closest('#help-btn')) {
      e.preventDefault();
      openDrawer(PAGE_HELP_KEYS[currentPage]);
    }
  });

  // Init tooltips
  attachTooltips();

  // Start on discovery
  navigate('discovery');
}

document.addEventListener('DOMContentLoaded', init);
