# Fix: Settings

> **Flow:** [`docs/flows/settings.md`](../flows/settings.md)
> **Thinking:** 🟢 Medium
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: settings renders as overlay in main content area. Tabs for Företag, Profil, Språk, Billing.

### What exists
- Settings page exists with company info, profile, billing sections
- Currently renders as a regular page or uses dialogs

### What to do
- 🟢 Convert settings to render as an overlay in main content area (depends on overlay system from `fix/walkthrough-overlays.md`)
- 🟢 Verify all four sections work: Företag, Profil, Språk & Region, Billing
- 🟢 Settings is an exception — forms are fine here (user configuration, not accounting data)

## Acceptance Criteria
- [ ] Settings renders as overlay in main content area
- [ ] All four sections functional
- [ ] Company logo upload works and feeds into document generators
