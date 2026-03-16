# Fix: Walkthrough Overlays

> **Flow:** [`docs/flows/walkthrough-overlays.md`](../flows/walkthrough-overlays.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: user clicks a card in chat → walkthrough overlay takes over main content area. Reports auto-render as walkthroughs. Three response modes (chat, dynamic, fixed).

### What exists
- `ai-overlay-provider.tsx` — full state machine (thinking/complete/walkthrough states, accept/edit/hide, navigation, highlighting). The brain is intact.
- `walkthrough-overlay.tsx` — document renderer (audit-style + financial-style)
- Block rendering system — 23 composable primitives
- All event listeners work

### What's wrong
- 🔵 **Side panel replaced the overlay** — `ai-side-panel.tsx` renders in a narrow column next to chat instead of taking over the main content area. This was a wrong turn. The overlay needs to be restored.
- 🟢 **Side panel references in provider** — `isPinned`, `togglePin`, `isSidePanelOpen` are side panel concepts that need cleanup.

### What to do
1. 🟢 Delete `ai-side-panel.tsx`
2. 🔵 Create new `ai-overlay.tsx` that renders in main content area (like the original, adapted for current layout)
3. 🟢 Update `main-content-area.tsx` — swap side panel for overlay
4. 🟢 Clean up `ai-overlay-provider.tsx` — remove side panel naming
5. 🔵 Ensure three response modes work: chat (no overlay), dynamic walkthrough, fixed walkthrough

### Suspicious / needs founder input
- The old overlay was at `src/components/ai/ai-overlay.tsx` and was deleted in commit `e0a00f6`. The git history has the full implementation if needed as reference.

## Acceptance Criteria
- [ ] `ai-side-panel.tsx` deleted
- [ ] AI output renders as overlay in main content area
- [ ] Thinking, preview, and walkthrough states work
- [ ] Accept/Edit/Cancel flow works
- [ ] Sidebar stays visible during overlays
