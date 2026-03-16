import './index.css';
import { attachTooltips } from './components/tooltip';
import { openDrawer } from './components/help-drawer';
import { safePage } from './components/error-boundary';
import * as engine from './mock-engine';
import { navIcon } from './icons';
import { renderDiscoveryPage, bindDiscoveryEvents } from './pages/discovery';
import { renderLauncherPage, bindLauncherEvents } from './pages/launcher';
import { renderReviewPage, bindReviewEvents } from './pages/review';
import { renderCalendarPage, bindCalendarEvents } from './pages/calendar';
import { renderCommentsPage, bindCommentsEvents } from './pages/comments';
import { renderDashboardPage, bindDashboardEvents } from './pages/dashboard';
import { renderStrategyWorkspacePage, bindStrategyWorkspaceEvents } from './pages/strategy-workspace';
import { renderStyleStudioPage, bindStyleStudioEvents } from './pages/style-studio';
import { renderIntegrationsPage, bindIntegrationsEvents } from './pages/integrations';
import { renderOpportunitiesPage, bindOpportunitiesEvents } from './pages/opportunities';
import { renderPreviewFeedPage, bindPreviewFeedEvents } from './pages/preview-feed';
import { renderProjectsPage, bindProjectsEvents } from './pages/projects';
import { renderSetupPage, bindSetupEvents } from './pages/setup';

type PageId = 'discovery' | 'launcher' | 'review' | 'calendar' | 'comments' | 'dashboard' | 'strategy-workspace' | 'style-studio' | 'integrations' | 'opportunities' | 'preview-feed' | 'projects' | 'setup';
const MOBILE_BREAKPOINT = 900;

// ── NAV-1: Sidebar section collapse state persisted across navigation ────────
// sessionStorage key → comma-separated list of collapsed section ids
const COLLAPSE_KEY = 'growthops_nav_collapsed';

type SectionId = 'journey' | 'tools' | 'research';

function getCollapsedSections(): Set<SectionId> {
  try {
    const stored = sessionStorage.getItem(COLLAPSE_KEY) || '';
    return new Set(stored.split(',').filter(Boolean) as SectionId[]);
  } catch {
    return new Set();
  }
}

function saveCollapsedSections(collapsed: Set<SectionId>): void {
  try {
    sessionStorage.setItem(COLLAPSE_KEY, Array.from(collapsed).join(','));
  } catch { /* noop */ }
}

function toggleSection(sectionId: SectionId): void {
  const collapsed = getCollapsedSections();
  if (collapsed.has(sectionId)) {
    collapsed.delete(sectionId);
  } else {
    collapsed.add(sectionId);
  }
  saveCollapsedSections(collapsed);
}

// Glossary keys shown in the help drawer for each page
const PAGE_HELP_KEYS: Record<PageId, string[]> = {
  discovery: ['businessDiscovery', 'offer', 'icp', 'offerHypothesis', 'confidence'],
  launcher: ['campaign', 'funnel', 'awareness', 'consideration', 'decision', 'copy', 'variant', 'channel', 'cta', 'generateCopy'],
  review: ['reviewQueue', 'approve', 'reject', 'copy', 'draftReply'],
  calendar: ['publishing', 'schedule', 'channelMeta', 'channelLinkedin', 'channelX', 'channelEmail'],
  comments: ['commentTriage', 'intentLead', 'intentSupport', 'intentObjection', 'intentSpam', 'draftReply', 'approve'],
  dashboard: ['attribution', 'cpl', 'roas', 'conversionRate', 'impressions', 'clicks', 'funnel'],
  'strategy-workspace': ['strategyWorkspace', 'offer', 'icp', 'offerHypothesis', 'confidence'],
  'style-studio': ['copy', 'variant', 'channel'],
  integrations: [],
  opportunities: ['commentTriage', 'intentLead', 'approve'],
  'preview-feed': ['publishing', 'channel', 'channelMeta', 'channelLinkedin', 'channelX', 'channelEmail'],
  projects: ['campaign', 'funnel', 'project', 'task', 'kanban'],
  setup: ['setupAccounts', 'apiKey', 'oauthToken', 'platformCredentials'],
};

// ── NAV-5: Journey steps — used for the progress breadcrumb bar ──────────────
const JOURNEY_STEPS: { id: PageId; label: string; description: string }[] = [
  { id: 'discovery', label: 'Discover', description: 'Define your business and choose what to promote' },
  { id: 'strategy-workspace', label: 'Strategise', description: 'Review your offer and confirm your campaign foundation' },
  { id: 'launcher', label: 'Launch', description: 'Create your campaign and generate ad copy' },
  { id: 'review', label: 'Review', description: 'Approve or reject content before it goes live' },
  { id: 'calendar', label: 'Schedule', description: 'Pick when your posts go live on each platform' },
  { id: 'comments', label: 'Respond', description: 'Handle comments and send approved replies' },
  { id: 'dashboard', label: 'Measure', description: 'See what worked and improve next time' },
  { id: 'projects', label: 'Plan', description: 'Manage tasks and project plans for campaign execution' },
];

// Set of pages that appear in the journey breadcrumb
const JOURNEY_PAGE_IDS = new Set<PageId>(JOURNEY_STEPS.map(s => s.id));

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
  tipKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'discovery', icon: 'discovery', label: 'Business Discovery', tipKey: 'businessDiscovery' },
  { id: 'strategy-workspace', icon: 'strategy-workspace', label: 'Strategy Workspace', tipKey: 'strategyWorkspace' },
  { id: 'launcher', icon: 'launcher', label: 'Campaign Launcher', tipKey: 'campaign' },
  { id: 'review', icon: 'review', label: 'Review Queue', tipKey: 'reviewQueue' },
  { id: 'calendar', icon: 'calendar', label: 'Publishing', tipKey: 'publishing' },
  { id: 'comments', icon: 'comments', label: 'Comment Ops', tipKey: 'commentTriage' },
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', tipKey: 'attribution' },
  { id: 'projects', icon: 'projects', label: 'Projects & Planning', tipKey: 'campaign' },
  { id: 'style-studio', icon: 'style-studio', label: 'Style Studio', tipKey: 'copy' },
  { id: 'setup', icon: 'setup', label: 'Setup & Accounts', tipKey: 'setupAccounts' },
  { id: 'preview-feed', icon: 'preview-feed', label: 'Preview Feed', tipKey: 'publishing' },
  { id: 'opportunities', icon: 'opportunities', label: 'Opportunities', tipKey: 'commentTriage' },
  { id: 'integrations', icon: 'integrations', label: 'Integrations', tipKey: 'attribution' },
];

// NAV-1 section groupings
const NAV_SECTIONS: { id: SectionId; label: string; items: NavItem[] }[] = [
  {
    id: 'journey',
    label: 'Campaign Journey',
    items: NAV_ITEMS.filter(i =>
      ['discovery', 'strategy-workspace', 'launcher', 'review', 'calendar', 'comments', 'dashboard', 'projects'].includes(i.id)
    ),
  },
  {
    id: 'tools',
    label: 'Tools',
    items: NAV_ITEMS.filter(i => ['style-studio', 'preview-feed', 'setup'].includes(i.id)),
  },
  {
    id: 'research',
    label: 'Research',
    items: NAV_ITEMS.filter(i => ['opportunities', 'integrations'].includes(i.id)),
  },
];

let currentPage: PageId = 'discovery';

function getNavItem(page: PageId): NavItem {
  return NAV_ITEMS.find((item) => item.id === page) || NAV_ITEMS[0];
}

// ── NAV-1: Render a collapsible nav section ──────────────────────────────────
function renderNavSection(
  section: typeof NAV_SECTIONS[0],
  collapsed: Set<SectionId>,
): string {
  const isCollapsed = collapsed.has(section.id);
  const chevron = `
    <svg class="section-chevron ${isCollapsed ? 'section-chevron--collapsed' : ''}"
         width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>`;

  const items = section.items.map(item => `
    <li class="nav-item-li">
      <a href="#" data-nav="${item.id}" data-tip="${item.tipKey}"
         class="${item.id === currentPage ? 'active' : ''}">
        <span class="nav-icon">${navIcon(item.id)}</span>
        ${item.label}
        ${item.id === currentPage ? '<span class="nav-active-dot"></span>' : ''}
      </a>
    </li>
  `).join('');

  return `
    <li class="nav-section">
      <button type="button"
              class="nav-section-header"
              data-section-toggle="${section.id}"
              aria-expanded="${!isCollapsed}"
              aria-controls="nav-section-${section.id}">
        <span class="nav-section-label">${section.label}</span>
        ${chevron}
      </button>
      <ul class="nav-section-items ${isCollapsed ? 'nav-section-items--collapsed' : ''}"
          id="nav-section-${section.id}"
          aria-hidden="${isCollapsed}">
        ${items}
      </ul>
    </li>
  `;
}

function renderSidebar(): string {
  const collapsed = getCollapsedSections();
  const stepIndex = JOURNEY_STEPS.findIndex(s => s.id === currentPage);
  return `
    <div class="sidebar-header-mobile">
      <span class="sidebar-mobile-title">Navigation</span>
      <button type="button" class="sidebar-close-btn" id="mobile-menu-close" aria-label="Close navigation">
        ✕
      </button>
    </div>
    <div class="sidebar-logo">
      <div class="logo-icon">G</div>
      GrowthOps
    </div>
    <ul class="sidebar-nav">
      ${NAV_SECTIONS.map(section => renderNavSection(section, collapsed)).join('')}
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="mobile-topbar-title">
        <span class="mobile-topbar-icon">${navIcon(active.id)}</span>
        <span id="mobile-current-page">${active.label}</span>
      </div>
      <span class="mobile-topbar-badge">Mock</span>
    </header>
  `;
}

// ── NAV-5: Progress breadcrumb bar ──────────────────────────────────────────
function renderBreadcrumb(): string {
  const isJourneyPage = JOURNEY_PAGE_IDS.has(currentPage);
  if (!isJourneyPage) return '';

  const currentIndex = JOURNEY_STEPS.findIndex(s => s.id === currentPage);

  const steps = JOURNEY_STEPS.map((step, i) => {
    const isCurrent = i === currentIndex;
    const isDone = i < currentIndex;
    let cls = 'breadcrumb-step';
    if (isCurrent) cls += ' breadcrumb-step--current';
    else if (isDone) cls += ' breadcrumb-step--done';

    const connector = i < JOURNEY_STEPS.length - 1
      ? `<span class="breadcrumb-connector ${isDone ? 'breadcrumb-connector--done' : ''}"></span>`
      : '';

    return `
      <li class="${cls}">
        <button type="button" class="breadcrumb-btn" data-nav="${step.id}" title="${step.description}">
          <span class="breadcrumb-num">${isDone
            ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : i + 1
          }</span>
          <span class="breadcrumb-label">${step.label}</span>
        </button>
        ${connector}
      </li>
    `;
  }).join('');

  return `
    <nav class="breadcrumb-bar" aria-label="Campaign journey progress">
      <ol class="breadcrumb-steps">
        ${steps}
      </ol>
    </nav>
  `;
}

const PAGE_RENDERERS: Record<PageId, () => string> = {
  discovery: renderDiscoveryPage,
  launcher: renderLauncherPage,
  review: renderReviewPage,
  calendar: renderCalendarPage,
  comments: renderCommentsPage,
  dashboard: renderDashboardPage,
  'strategy-workspace': renderStrategyWorkspacePage,
  'style-studio': renderStyleStudioPage,
  integrations: renderIntegrationsPage,
  opportunities: renderOpportunitiesPage,
  'preview-feed': renderPreviewFeedPage,
  projects: renderProjectsPage,
  setup: renderSetupPage,
};

const PAGE_BINDERS: Record<PageId, () => void> = {
  discovery: bindDiscoveryEvents,
  launcher: bindLauncherEvents,
  review: bindReviewEvents,
  calendar: bindCalendarEvents,
  comments: bindCommentsEvents,
  dashboard: bindDashboardEvents,
  'strategy-workspace': bindStrategyWorkspaceEvents,
  'style-studio': bindStyleStudioEvents,
  integrations: bindIntegrationsEvents,
  opportunities: bindOpportunitiesEvents,
  'preview-feed': bindPreviewFeedEvents,
  projects: bindProjectsEvents,
  setup: bindSetupEvents,
};

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateMobileTitle(): void {
  const label = getNavItem(currentPage).label;
  const titleEl = document.getElementById('mobile-current-page');
  if (titleEl) titleEl.textContent = label;
  // Update icon too
  const iconEl = document.querySelector('.mobile-topbar-icon');
  if (iconEl) iconEl.innerHTML = navIcon(currentPage);
}

// ── NAV-3: Animated mobile nav — close with transition then hide ─────────────
function closeMobileNav(): void {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobile-overlay');
  if (sidebar) sidebar.classList.add('sidebar--closing');
  if (overlay) overlay.classList.add('overlay--closing');

  setTimeout(() => {
    document.body.classList.remove('nav-open');
    if (sidebar) sidebar.classList.remove('sidebar--closing');
    if (overlay) overlay.classList.remove('overlay--closing');
  }, 280); // matches CSS transition duration
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
  if (main) {
    main.innerHTML = renderBreadcrumb() + safePage(PAGE_RENDERERS[page]);
  }

  updateMobileTitle();
  updateIntentBanner();
  engine.trackPageView(page);
  PAGE_BINDERS[page]();

  if (isMobileViewport()) {
    closeMobileNav();
  }

  // Bind section collapse toggles (NAV-1)
  bindSectionToggles();
}

// ── NAV-1: Section toggle binding ────────────────────────────────────────────
function bindSectionToggles(): void {
  document.querySelectorAll('[data-section-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = (btn as HTMLElement).dataset.sectionToggle as SectionId;
      toggleSection(sectionId);

      // Toggle in the DOM without re-rendering the full sidebar
      const itemsList = document.getElementById(`nav-section-${sectionId}`);
      const chevron = btn.querySelector('.section-chevron');
      const isNowCollapsed = getCollapsedSections().has(sectionId);

      if (itemsList) {
        if (isNowCollapsed) {
          itemsList.classList.add('nav-section-items--collapsed');
          itemsList.setAttribute('aria-hidden', 'true');
          // Animate height to 0
          itemsList.style.maxHeight = itemsList.scrollHeight + 'px';
          requestAnimationFrame(() => {
            itemsList.style.maxHeight = '0px';
          });
        } else {
          itemsList.classList.remove('nav-section-items--collapsed');
          itemsList.setAttribute('aria-hidden', 'false');
          // Animate height open
          const naturalHeight = itemsList.scrollHeight;
          itemsList.style.maxHeight = naturalHeight + 'px';
          itemsList.addEventListener('transitionend', () => {
            itemsList.style.maxHeight = '';
          }, { once: true });
        }
      }

      if (chevron) {
        chevron.classList.toggle('section-chevron--collapsed', isNowCollapsed);
      }

      btn.setAttribute('aria-expanded', String(!isNowCollapsed));
    });
  });
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

function setRealVh(): void {
  // JS-measured fallback: --real-vh equals the visual viewport height so
  // older browsers that lack dvh still avoid browser-chrome clipping.
  const vh = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
  document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}


function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Maintain --real-vh so dvh-lacking browsers avoid browser-chrome clipping
  setRealVh();
  window.addEventListener('resize', setRealVh);
  window.addEventListener('orientationchange', setRealVh);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setRealVh);
  }

  app.innerHTML = `
    <div class="intent-banner" id="intent-banner">
      <span class="intent-banner-icon">💡</span>
      <span id="intent-banner-text">You're setting up campaigns for your own business or a client's — not building a product to sell.</span>
      <button class="help-btn" id="help-btn" title="What does this mean?">What does this mean?</button>
    </div>
    ${renderMobileTopbar()}
    <div class="mobile-overlay" id="mobile-overlay" role="button" tabindex="-1" aria-label="Close navigation"></div>
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

  // Mobile nav open/close
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'mobile-menu-toggle' || target.closest('#mobile-menu-toggle')) {
      e.preventDefault();
      toggleMobileNav();
    }
    if (target.id === 'mobile-menu-close' || target.closest('#mobile-menu-close')) {
      e.preventDefault();
      closeMobileNav();
    }
  });

  // NAV-3: Touch-outside-to-close — clicking the overlay closes the nav
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'mobile-overlay') {
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
      // On desktop, just remove nav-open class immediately (no animation needed)
      document.body.classList.remove('nav-open');
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

  // INFRA-2: Register service worker for offline app-shell caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silently ignore — SW is an enhancement, not a requirement
      });
    });
  }

  // Start on discovery
  navigate('discovery');
}

document.addEventListener('DOMContentLoaded', init);
