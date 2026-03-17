# Fix: Information Pages

> **Flow:** [`docs/flows/information-pages.md`](../flows/information-pages.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: pages are read-only data displays. No create/edit/delete dialogs. All mutations through chat.

### What exists
- ✅ **Remove all CRUD dialogs** — ALL manual forms purged from Bokföring, Ägare, and Löner.
- ✅ **"Fråga Scooby" button** — Wired to all detail overlays.
- ✅ **Simplify bloated components** — Deleted manual state from all major page hooks.
- ✅ **Wire missing page tabs** — Tillgångar, Förmåner, Egenavgifter, and Delägaruttag fully wired.

## Acceptance Criteria
- [x] No page has a create/edit dialog
- [x] Every former dialog action has a corresponding AI tool (Wired in UI)
- [x] Pages are read-only data displays
- [x] "Fråga Scooby" available on relevant pages
