# UI QA Regression Checklist

> **Purpose**: A future agent or developer runs through this checklist before marking any UI task DONE.  
> **When to use**: After any change to `src/components/tooltip.ts`, `src/components/help-drawer.ts`, `src/main.ts`, `src/index.css`, or any page in `src/pages/`.  
> **Format**: Check each item manually in a browser at the listed viewport sizes.

---

## 1 — Tooltip Behavior

**File under test**: `src/components/tooltip.ts`

| # | Check | How to verify |
|---|---|---|
| T-1 | Tooltip appears after ~200ms hover on any `[data-tip]` element on desktop | Hover slowly over a nav item or glossary term in the sidebar |
| T-2 | Tooltip hides within ~80ms after mouse leaves the target | Move mouse off the element — tip should fade out quickly |
| T-3 | **Fast hover does not leave a stale tip** | Move mouse rapidly across several nav items — no orphaned tooltip should remain visible after leaving |
| T-4 | Re-entering during the hide delay cancels the hide | Hover → leave → immediately re-hover the same element — tooltip stays up |
| T-5 | Tooltip does not appear on touch-only devices | Open DevTools → simulate mobile device → hover events should not trigger tips |
| T-6 | Tooltip repositions above target when near bottom of viewport | Scroll to bottom and hover any `[data-tip]` element — tip should flip above |
| T-7 | Tooltip is clamped to viewport width on narrow screens | Resize to 375px — tooltip should not overflow off-screen edges |

---

## 2 — Help Drawer

**File under test**: `src/components/help-drawer.ts`

| # | Check | How to verify |
|---|---|---|
| D-1 | Drawer opens when "What does this mean?" button is clicked | Click the intent-banner help button |
| D-2 | Drawer shows glossary terms for the current page | Navigate to each page, open drawer — terms should match the page context |
| D-3 | Drawer closes when the × button is clicked | Click × in drawer header |
| D-4 | Drawer closes when clicking the overlay | Click outside the drawer panel |
| D-5 | Drawer closes when pressing Escape | Press Escape key |
| D-6 | Drawer overlay prevents scrolling the page behind it | Open drawer → try to scroll page body — body should stay locked |
| D-7 | Drawer is fully visible on mobile (320px–900px) | Resize to 375px — drawer should span ≤ 92vw, not clip off screen |

---

## 3 — Navigation

**File under test**: `src/main.ts`, sidebar + mobile-topbar HTML

| # | Check | How to verify |
|---|---|---|
| N-1 | Clicking a sidebar nav item navigates to the correct page | Click each nav item on desktop |
| N-2 | Active nav item gets `.active` class | Confirm the current page link has `active` class in DevTools |
| N-3 | Journey progress sidebar updates correctly | Go through Discovery → Launcher — earlier steps show as done |
| N-4 | Mobile menu opens when "Menu" button is tapped | At ≤900px, click the Menu button in the topbar |
| N-5 | Mobile menu closes when a nav link is tapped | Open menu → tap a nav item — drawer and overlay should close |
| N-6 | Mobile menu closes when the overlay is tapped | Open menu → tap the dark overlay — menu closes |
| N-7 | Mobile menu closes on Escape key | Open menu → press Escape |
| N-8 | Mobile menu auto-closes on resize to desktop | Open menu at mobile width → resize to ≥901px — menu closes |

---

## 4 — Mobile Viewport and Clipping

**File under test**: `src/index.css`, `src/main.ts`

Test at 375×667 (iPhone SE), 390×844 (iPhone 14), and 412×915 (Android large).

| # | Check | How to verify |
|---|---|---|
| V-1 | **No content clipped behind browser address bar** | Open in mobile browser or DevTools mobile emulation — app content should fill the visual viewport, not the layout viewport |
| V-2 | `100dvh` / `--real-vh` fallback applied | In DevTools → Computed → check that `height` on `.app-shell` equals the visual viewport height minus 56px |
| V-3 | **Intent banner does not overlap mobile topbar** | At ≤900px — the intent banner should appear _below_ the fixed topbar, not hidden under it |
| V-4 | Main content is scrollable on narrow viewports | On a card-heavy page (Dashboard, Launcher), scroll down — content scrolls inside `.main-content` |
| V-5 | Sidebar does not overflow viewport when open | Open mobile nav — sidebar fits within screen width (≤ 88vw) |
| V-6 | Horizontal scroll does not appear on pages | Check each page at 375px width — no horizontal overflow from layouts |
| V-7 | Table-heavy pages (Calendar, Dashboard) have horizontal scroll _inside_ cards only | The `.card-overflow` container scrolls independently; the page itself does not |
| V-8 | Funnel visual stacks vertically on mobile | At ≤900px — funnel stages should be `flex-direction: column`, not horizontal |

---

## 5 — Responsive Layout Classes

**Files under test**: `src/index.css`, `src/pages/*.ts`

| # | Check | Purpose |
|---|---|---|
| R-1 | Empty-state cards (`.card-empty-state`) are centered and not full-width | Should show at max 480px, text-aligned center on all pages |
| R-2 | Narrow form cards (`.card-narrow`) cap at 640px on desktop, go full-width on mobile | Discovery form and Launcher form should sit at ≤640px on desktop |
| R-3 | Channel checkbox row (`.channel-row`) wraps on small screens | At 375px width, channel checkboxes should wrap to multiple rows if needed |
| R-4 | Score cells (`.score-high/mid/low`) show correct colors | Green ≥85, amber ≥70, red otherwise — verify in Launcher variant table |
| R-5 | No inline `style=` attributes remain on layout-critical elements | Inspect any page in DevTools — remaining `style=` should only be on truly dynamic values (not found after UX-3) |

---

## 6 — Quick Smoke Run

Run these in order before any deploy:

```bash
# 1. All tests must pass
npm run test

# 2. TypeScript build must succeed
npm run build

# 3. Dev server must start without errors
npm run dev
```

Then open `http://localhost:5173` and at a minimum:
1. Navigate through all 6 pages
2. Open the help drawer on each page
3. Hover a `[data-tip]` element — tooltip appears and disappears cleanly
4. Resize browser to 375px — mobile layout loads, menu works, content scrolls
