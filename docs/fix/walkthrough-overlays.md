# Fix: Walkthrough Overlays

> **Flow:** [`docs/flows/walkthrough-overlays.md`](../flows/walkthrough-overlays.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: user clicks a card in chat → walkthrough overlay takes over main content area. Reports auto-render as walkthroughs. Three response modes (chat, dynamic, fixed).

### What exists
- `ai-overlay-provider.tsx` — Intact and updated to support full-area overlay.
- `walkthrough-overlay.tsx` — Functional.
- `ai-overlay.tsx` — **RESTORED**. Replaces the narrow side panel.

### What's wrong
- ✅ **Side panel replaced the overlay** — Deleted `ai-side-panel.tsx` and restored `ai-overlay.tsx`.
- ✅ **Side panel references in provider** — Cleaned up naming (`isAIOverlayOpen` instead of `isSidePanelOpen`).

### What to do
1. ✅ Delete `ai-side-panel.tsx`
2. ✅ Create new `ai-overlay.tsx` that renders in main content area
3. ✅ Update `main-content-area.tsx` — swapped side panel for overlay
4. ✅ Clean up `ai-overlay-provider.tsx` — removed side panel naming/logic
5. ✅ Ensure three response modes work: Verified in `use-stream-parser.ts`.

## Acceptance Criteria
- [x] `ai-side-panel.tsx` deleted
- [x] AI output renders as overlay in main content area
- [x] Thinking, preview, and walkthrough states work
- [x] Accept/Edit/Cancel flow works
- [x] Sidebar stays visible during overlays
