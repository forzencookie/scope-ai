# Fix: Page Overlays

> **Flow:** [`docs/flows/page-overlays.md`](../flows/page-overlays.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: click table row → overlay takes over main content area with read-only detail view. Replaces all dialogs. Settings also renders as overlay.

### What exists
- Pages have tables with clickable rows
- Clicking rows currently opens dialogs (large modals)

### What's missing
- 🔵 **Page overlay component** — doesn't exist. Need a new component that renders in main content area (same pattern as walkthrough overlay) with: header, key fields, related items, "Tillbaka" + "Fråga Scooby" buttons.
- 🔵 **Settings overlay** — settings currently uses dialogs. Need to convert to overlay in main content area.
- 🟢 **Remove all page dialogs** — every dialog that opens from a table row click should be replaced with the page overlay.

### Depends on
- `fix/walkthrough-overlays.md` should be done first — establishes the overlay pattern in main content area that page overlays reuse.

## Acceptance Criteria
- [ ] Page overlay component exists
- [ ] Clicking any table row opens a page overlay (not a dialog)
- [ ] Page overlays are read-only with "Tillbaka" and "Fråga Scooby"
- [ ] Settings renders as overlay in main content area
- [ ] Zero dialogs remain on data pages
