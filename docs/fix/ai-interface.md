# Fix: AI Interface

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: chat with Scooby, sidebar tasks, two-layer card system with inline editing, summary skills (/dag, /vecka, etc.), cascades, internet access.

### What exists
- Chat interface works (ChatProvider, ChatInput, message list)
- Basic tool calling works
- Deferred tool loading implemented
- Quick actions menu (/ commands) exists

### What's missing
- 🔵 **Summary skills** — /dag, /vecka, /månad, /kvartal, /år, /status don't exist. Need skill infrastructure, data aggregation queries, block-based output.
- 🔵 **Inline-editable cards** — two-layer card system doesn't exist. Cards are read-only. Need: editable field component, pencil/edit mode toggle, dotted underlines, auto-recalculation, card-to-overlay click flow.
- 🔵 **Sidebar tasks ("Att göra")** — doesn't exist. Need: task sources (system/AI/user), sidebar section, "Visa alla" tasks overlay.
- 🟢 **Cascades** — partially wired. Payroll → vacation accrual works. Invoice → pending booking, dividend → withholding tax need verification.
- 🔵 **"Gå till [sida]" with highlighting** — after confirming an action, navigate to the relevant page with the new item highlighted/scrolled-to.

### Suspicious / needs founder input
- `src/components/ai/ai-side-panel.tsx` — should be deleted (overlay restoration in `fix/walkthrough-overlays.md`)
- Old card components in `src/components/ai/cards/` — deprecated, blocked by workstream 02

## Acceptance Criteria
- [ ] Summary skills respond with real data from DB + memory
- [ ] Cards are inline-editable with pencil toggle and dotted underlines
- [ ] Sidebar shows 3-5 pending tasks with "Visa alla" overlay
- [ ] All cascades fire automatically on relevant actions
- [ ] "Gå till [sida]" navigates with item highlighted
