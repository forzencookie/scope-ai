# Fix: Page Overlays

> **Flow:** [`docs/flows/page-overlays.md`](../flows/page-overlays.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: click table row → overlay takes over main content area with read-only detail view. Replaces all dialogs. Settings also renders as overlay.

### What exists
- ✅ **Page overlay component** — `src/components/shared/page-overlay.tsx`. 
- ✅ **Settings overlay** — `SettingsOverlay` refactored and wired.
- ✅ **Transaction overlay** — `TransactionDetailsOverlay` added for booked transactions.
- ✅ **Verification overlay** — `VerifikationDetailsDialog` converted to PageOverlay.
- ✅ **Meeting overlay** — `MeetingViewDialog` converted to PageOverlay.
- ✅ **Employee overlay** — `EmployeeDossierOverlay` converted to PageOverlay.

## Acceptance Criteria
- [x] Page overlay component exists
- [x] Clicking any table row opens a page overlay (not a dialog)
- [x] Page overlays are read-only with "Tillbaka" and "Fråga Scooby"
- [x] Settings renders as overlay in main content area
- [x] Zero dialogs remain on data pages
