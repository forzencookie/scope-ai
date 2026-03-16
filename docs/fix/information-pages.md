# Fix: Information Pages

> **Flow:** [`docs/flows/information-pages.md`](../flows/information-pages.md)
> **Thinking:** 🔵 Ultrathink
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: pages are read-only data displays. No create/edit/delete dialogs. All mutations through chat.

### What exists
- All pages exist with tables, stat cards, filters
- Pages have CRUD dialogs (create, edit, delete)
- `src/components/agare/` — 56 files, most over-engineered with CRUD dialogs. `meeting-view.tsx` is 1,477 lines.

### What's missing
- 🔵 **Remove all CRUD dialogs** — pages must be stripped to read-only. Every create/edit action needs a corresponding AI tool (verify tools exist first).
- 🟢 **"Fråga Scooby" button** — on pages where a user might want to act on something, add a button that jumps to chat with context prefilled.
- 🟢 **Simplify bloated components** — with dialogs removed, many components shrink dramatically.

### Suspicious / needs founder input
- Are there any pages where a form is still appropriate? (Settings is already an exception per `flows/settings.md`)
- Some `agare/` components may be entirely redundant if the governance features are documentation-only

### Depends on
- `fix/page-overlays.md` — detail views replace dialogs
- `fix/tools.md` — AI tools must exist for every action that was previously a dialog

## Acceptance Criteria
- [ ] No page has a create/edit dialog
- [ ] Every former dialog action has a corresponding AI tool
- [ ] Pages are read-only data displays
- [ ] "Fråga Scooby" available on relevant pages
