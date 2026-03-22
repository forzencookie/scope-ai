# Fix: Information Pages

> **Flow:** [`docs/flows/information-pages.md`](../flows/information-pages.md)
> **Status:** 🟢 Mostly done — 2 missing tabs remain

## Architecture (Working)

- Catch-all `[...slug]/page.tsx` maps 5 slugs to 5 page components
- Each page uses `PageTabsLayout` with `?tab=` query params
- Tabs are feature-gated per company type via `hasFeature()`
- Sidebar nav items have `featureKey` — `nav-collapsible.tsx` filters via `hasFeature()` per company type ✅
- Lazy-loaded tab content components via `@/components/shared`
- All CRUD dialogs removed — pages are read-only as designed

## Fixed Issues

| Issue | Fix |
|-------|-----|
| Kvitton nav item → missing tab | Nav item removed with tracking comment ✅ |
| Förmåner nav URL `?tab=benefits` | Changed to `?tab=formaner` ✅ |
| Rapporter had 8 tab URLs for card grid | Simplified to single link ✅ |
| Årsmöte separate nav item | Removed — `bolagsstamma` covers both AB and Förening ✅ |
| Nav doesn't filter by company type | Already works — sidebar uses `hasFeature()` + `featureKey` ✅ |

## What Remains

### Missing tabs: Utdelning + Firmatecknare

`company-types.ts` defines these as features:
- `utdelning`: AB only
- `firmatecknare`: AB, HB, KB, Förening

But `ownership-page.tsx` has no tab configs for either, and `app-navigation.ts` has no nav items for them. Need:

1. Add nav items to `navAgare` in `app-navigation.ts` with correct `featureKey`
2. Add tab configs to `tabsByCompanyType` in `ownership-page.tsx`
3. Create placeholder read-only tab content components
4. Add lazy exports to `src/components/shared/index.ts`

### Current Ägare tabs vs what should exist

| Tab | AB | EF | HB/KB | Förening | Status |
|-----|----|----|-------|----------|--------|
| aktiebok | ✅ | — | — | — | Working |
| ägarinfo | — | ✅ | — | — | Working |
| delagare | — | — | ✅ | — | Working |
| medlemsregister | — | — | — | ✅ | Working |
| bolagsstamma | ✅ | — | — | ✅ | Working |
| **utdelning** | **needs** | — | — | — | **Missing** |
| **firmatecknare** | **needs** | — | **needs** | **needs** | **Missing** |

## Other Issues (Low Priority)

- Reports page has 3 hardcoded fake rows in "Recent Reports"
- "Fråga Scooby" buttons — not verified on priority pages
- Page overlays for table row clicks — not verified across all types

## Files

| File | Role |
|------|------|
| `src/data/app-navigation.ts` | Sidebar nav items |
| `src/components/pages/ownership-page.tsx` | Ägare (company-type-aware tabs) |
| `src/components/shared/index.ts` | Lazy exports for tab components |
| `src/lib/company-types.ts` | Feature keys and company type definitions |
