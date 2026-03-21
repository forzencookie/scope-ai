# Fix: Information Pages

> **Flow:** [`docs/flows/information-pages.md`](../flows/information-pages.md)
> **Status:** Yellow — pages render but navigation is out of sync with components

## What the Flow Describes

5 page modules (Bokforing, Loner, Rapporter, Agare, Handelser) + Settings overlay. All read-only. Table rows open page overlays. "Fraga Scooby" buttons hand off to chat with context.

## Architecture (Working)

- Catch-all `[...slug]/page.tsx` maps 5 slugs to 5 page components
- Each page uses `PageTabsLayout` with `?tab=` query params
- Tabs are feature-gated per company type via `hasFeature()`
- Lazy-loaded tab content components via `@/components/shared`
- `main-content-area.tsx` renders pages with back button + page-tabs portal
- Page nav buttons on empty chat state match the 5 routes
- All CRUD dialogs removed — pages are read-only as designed

## What's Broken: Navigation vs Page Tab Mismatches

`src/data/app-navigation.ts` defines sidebar links with `?tab=` URLs. Several of these point to tabs that **don't exist** in the page components. Clicking these links shows the page but defaults to the first available tab — the user never reaches the intended content.

### Bokforing

| Nav item | Nav URL | Page tab key | Status |
|----------|---------|-------------|--------|
| Transaktioner | `?tab=transaktioner` | `transaktioner` | OK |
| Fakturor | `?tab=fakturor` | `fakturor` | OK |
| **Kvitton** | `?tab=kvitton` | **Does not exist** | BROKEN — nav links to a tab the page doesn't have |
| Inventarier | `?tab=inventarier` | `inventarier` | OK |
| Verifikationer | `?tab=verifikationer` | `verifikationer` | OK |

**Fix:** Either add a `kvitton` tab to `accounting-page.tsx` (flow doc says it should exist — "uploaded receipts with OCR status") or remove the nav item if receipts are not yet built.

### Loner

| Nav item | Nav URL | Page tab key | Status |
|----------|---------|-------------|--------|
| Lonekörning | `?tab=lonebesked` | `lonebesked` | OK |
| **Formaner** | `?tab=benefits` | `formaner` | BROKEN — nav uses `benefits`, page uses `formaner` |
| Team | `?tab=team` | `team` | OK |
| Egenavgifter | `?tab=egenavgifter` | `egenavgifter` | OK |
| Delagaruttag | `?tab=delagaruttag` | `delagaruttag` | OK |

**Fix:** Change nav URL from `?tab=benefits` to `?tab=formaner` in `app-navigation.ts:149`.

### Rapporter

| Nav item | Nav URL | Page tab key | Status |
|----------|---------|-------------|--------|
| All 8 items | `?tab=resultatrakning` etc. | **No tabs exist** | MISMATCH — page is a card grid, not tabbed |

Reports page renders a grid of report cards with "Generera" buttons. The nav defines 8 tab URLs but the page ignores `?tab=` entirely.

**Fix:** Keep the card grid (better UX for reports — users pick which to generate, not browse data). Simplify Rapporter nav to a single link `/dashboard/rapporter` instead of 8 tab URLs. OR keep the 8 nav items but have the page scroll-to/highlight the matching card when `?tab=` is present.

### Agare

| Nav item | Nav URL | Page tab key (AB) | Status |
|----------|---------|-------------------|--------|
| Aktiebok | `?tab=aktiebok` | `aktiebok` | OK |
| Delagare | `?tab=delagare` | Not in AB tabs | BROKEN for AB (exists for HB/KB) |
| **Utdelning** | `?tab=utdelning` | **Does not exist** | BROKEN — no company type has this tab |
| Medlemsregister | `?tab=medlemsregister` | Only for Forening | OK (feature-gated) |
| Moten & Protokoll | `?tab=bolagsstamma` | `bolagsstamma` | OK |
| **Arsmote** | `?tab=arsmote` | Only for Forening | Partial — nav shows for all types |
| **Firmatecknare** | `?tab=firmatecknare` | **Does not exist** | BROKEN — no company type has this tab |

Ownership page is correctly company-type-aware (different tabs for AB vs EF vs HB vs Forening). But the nav shows ALL tabs regardless of company type.

**Fix:**
1. Filter Agare nav items by company type (like the page component does)
2. Add `utdelning` tab for AB (flow doc says it should exist)
3. Add `firmatecknare` tab for AB (flow doc says it should exist)
4. Gate `arsmote` and `medlemsregister` nav items to Forening only
5. Gate `delagare` nav item to HB/KB only

### Handelser

Events page uses button-based view toggle (not `?tab=` URL params). Inconsistent with other pages but functional.

## Other Issues

### Reports page mock data
`reports-page.tsx` "Recent Reports" section has 3 hardcoded fake rows. "Visa hela arkivet" button has no onClick handler.

### "Fraga Scooby" buttons
Flow doc says priority locations: unbooked transactions, overdue invoices, employee cards, verification detail overlays, partner/member overlays. Status needs verification — Gemini marked this as done but needs confirmation.

### Page overlays for table row clicks
Flow doc says every table row click opens a page overlay. Needs verification across all table types.

## Root Cause

Features were consolidated and tabs were restructured, but `app-navigation.ts` was never updated to match. The navigation file is the **single source of truth for what the sidebar shows**, and it's stale. This is exactly the kind of drift that happens when changes aren't propagated to all affected files.

## Files

| File | Role |
|------|------|
| `src/data/app-navigation.ts` | Sidebar nav items — **source of mismatches** |
| `src/app/dashboard/[...slug]/page.tsx` | Catch-all route -> page component mapping |
| `src/components/pages/accounting-page.tsx` | Bokforing (4 tabs, missing kvitton) |
| `src/components/pages/payroll-page.tsx` | Loner (5 tabs, correct) |
| `src/components/pages/reports-page.tsx` | Rapporter (card grid, no tabs) |
| `src/components/pages/events-page.tsx` | Handelser (button toggle) |
| `src/components/pages/ownership-page.tsx` | Agare (company-type-aware tabs) |
| `src/components/loner/constants.ts` | Payroll tab definitions |
| `src/components/layout/main-content-area.tsx` | Page rendering + back button |
| `src/lib/company-types.ts` | Feature keys and company type definitions |

## Execution Order

1. Fix nav `?tab=benefits` -> `?tab=formaner` (1-line fix)
2. Filter Agare nav items by company type
3. Simplify Rapporter nav to single link or add card highlighting
4. Add missing tabs: Kvitton (Bokforing), Utdelning + Firmatecknare (Agare)
5. Replace mock data in reports-page recent section
6. Verify "Fraga Scooby" buttons exist on priority pages
7. Verify page overlays work for all table row clicks
