# Fix: Settings

> **Flow:** [`docs/flows/settings.md`](../flows/settings.md)
> **Thinking:** 🟢 Medium
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: settings renders as overlay in main content area. Tabs for Företag, Profil, Språk, Billing.

### What exists
- ✅ **[FIXED]** Settings refactored from Dialog to `PageOverlay`. Renders inside `MainContentArea`.
- ✅ All four sections functional within the overlay layout.
- ✅ Navigation keeps chat context active.

## Acceptance Criteria
- [x] Settings renders as overlay in main content area
- [x] All four sections functional
- [x] Company logo upload works and feeds into document generators
