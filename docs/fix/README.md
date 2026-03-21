# Fix — Execution Plans

> Assessments of what's broken and what to build/change to reach the vision in `docs/flows/`.
> Read `docs/AI_NOTEPAD.md` for current progress and phase ordering.
> Read the flow (vision) first, then read the fix (what to do).

## Current Phase: Phase 2 — Fix TypeScript Errors

See `docs/AI_NOTEPAD.md` for the full phase plan. Summary:
- Phase 1: Dead code purge — **DONE** (51 files deleted)
- **Phase 2: Fix 106 TypeScript errors (6 root causes)** — UP NEXT
- Phase 3: Layer fixes (hooks → services, extract chat helpers)
- Phase 4: AI-leverage migration (gut calculation logic, let AI handle it)
- Phase 5: Final cleanup (0 errors, all exports clean)

## Fix Docs

### Cross-Cutting (Architecture)

| Fix | Scope | Status |
|-----|-------|--------|
| [architecture-audit.md](architecture-audit.md) | 7 systemic issues across entire codebase (full picture) | ✅ Assessed |
| [architecture-layer-violations.md](architecture-layer-violations.md) | 10 hooks/components bypassing service layer (2 fixed, 8 pending) | 🟡 In progress |
| [ai-leverage-audit.md](ai-leverage-audit.md) | File-by-file: KEEP vs AI-LEVERAGE vs DEAD for entire codebase | ✅ Assessed, Phase 1 executed |
| [service-ui-standardization.md](service-ui-standardization.md) | Data contract drift between service and UI layers | 🟡 Assessed |
| [database-schema.md](database-schema.md) | Schema gaps and missing tables | ⬜ Not started |

### Feature Areas

| Fix | Flow | Status |
|-----|------|--------|
| [ai-interface.md](ai-interface.md) | [AI Interface](../flows/ai-interface.md) | 🟡 Chat route rewritten, remaining items pending |
| [scooby-engine.md](scooby-engine.md) | [Scooby Engine](../flows/scooby-engine.md) | 🟡 Assessed — tool index, memory filtering, core memory gaps |
| [tools.md](tools.md) | [Tools](../flows/tools.md) | 🟡 Assessed — confirmation flow, missing tools |
| [information-pages.md](information-pages.md) | [Information Pages](../flows/information-pages.md) | ✅ Nav mismatches fixed (6/6) |
| [walkthrough-overlays.md](walkthrough-overlays.md) | [Walkthrough Overlays](../flows/walkthrough-overlays.md) | ⬜ Not started |
| [page-overlays.md](page-overlays.md) | [Page Overlays](../flows/page-overlays.md) | ⬜ Not started |
| [settings.md](settings.md) | [Settings](../flows/settings.md) | ⬜ Not started |
| [payments.md](payments.md) | [Payments](../flows/payments.md) | ⬜ Not started |
| [onboarding.md](onboarding.md) | [Onboarding](../flows/onboarding.md) | ⬜ Not started |
| [landing-page.md](landing-page.md) | [Landing Page](../flows/landing-page.md) | ⬜ Not started |

### Specialized

| Fix | Scope | Status |
|-----|-------|--------|
| [ai-driven-k10-dividends.md](ai-driven-k10-dividends.md) | K10 dividend threshold calculation → AI tool | ⬜ Not started (Phase 4) |
| [smart-vat-extraction.md](smart-vat-extraction.md) | VAT extraction logic → AI tool | ⬜ Not started (Phase 4) |
