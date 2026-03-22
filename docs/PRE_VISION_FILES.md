# Pre-Vision Files — The Path from 707 to ~300

> The app has 707 files. With the AI-first vision clear, it should have ~300.
> This doc maps every file that can be deleted, merged, or gutted — and what replaces it.

---

## The Math

| Layer | Now | Target | Cut | How |
|-------|-----|--------|-----|-----|
| Components | 361 | ~120 | ~241 | Merge tiny files, delete calculators/dialogs, AI renders instead |
| Hooks | 48 | ~15 | ~33 | Delete calculators, collapse direct-DB hooks into service wrappers |
| Services | 56 | ~20 | ~36 | Core compliance stays, CRUD services merge by domain |
| Lib | 110 | ~70 | ~40 | AI tools + bookkeeping + generators stay. Delete calculation libs, trim agents |
| API routes | 72 | ~25 | ~47 | Gut inline logic, merge related routes, thin passthroughs only |
| Providers | 8 | 6 | 2 | Merge text-mode into chat-provider |
| Types | 9 | 5 | 4 | Merge small type files into index.ts |
| Data | 10 | 8 | 2 | Delete demo data (invoices.ts, receipts.ts, transactions.ts) |
| App pages | 33 | 15 | 18 | Merge legal pages, simplify routing |
| **Total** | **707** | **~284** | **~423** | |

---

## Phase 1: Immediate Deletes (no dependencies, safe today)

### Old Settings UI — 5 files, 700 lines
Already replaced by `src/components/installningar/settings-overlay.tsx`. Zero imports.

| File | Lines |
|------|-------|
| `src/components/settings/general-settings.tsx` | 207 |
| `src/components/settings/billing-settings.tsx` | 157 |
| `src/components/settings/integrations-settings.tsx` | 176 |
| `src/components/settings/notifications-settings.tsx` | 101 |
| `src/components/settings/index.ts` | 59 |

### Old Dialogs — 5 files, 1,074 lines
Pre-overlay era modals. Replace with page overlays or AI walkthrough overlays.

| File | Lines | Replace With |
|------|-------|-------------|
| `src/components/rapporter/dialogs/moms.tsx` | 381 | AI walkthrough overlay |
| `src/components/agare/dialogs/meeting-view.tsx` | 274 | Page overlay |
| `src/components/rapporter/dialogs/agi.tsx` | 179 | AI walkthrough overlay |
| `src/components/agare/dialogs/aktiebok-preview.tsx` | 128 | Page overlay |
| `src/components/agare/dialogs/utdelningsavi-preview.tsx` | 112 | AI walkthrough overlay |

### Dead/Legacy Stubs — 3 files, ~30 lines

| File | Lines | Why |
|------|-------|-----|
| `src/components/layout/ai-chat-panel.tsx` | 15 | Legacy stub, all logic in ChatProvider |
| `src/components/ai/pixel-mascots.tsx` | 11 | Dead — ASCII mascots removed |
| `src/data/navigation.ts` | 6 | Legacy, superseded by app-navigation.ts |

**Phase 1 total: 13 files, ~1,800 lines — delete today.**

---

## Phase 2: Calculator/Computation Logic → AI Tools

These compute business results the AI should own. Delete the calculation logic, keep minimal display shells where needed.

### Hooks to Delete (10 files, ~2,200 lines)

| File | Lines | Replace With |
|------|-------|-------------|
| `src/hooks/use-dynamic-tasks.ts` | 297 | AI generates tasks with context |
| `src/hooks/use-company-statistics.ts` | 312 | Thin hook → `company-statistics-service.ts` |
| `src/hooks/use-month-closing.ts` | 286 | New `period-service.ts` + thin hook |
| `src/hooks/use-activity-log.ts` | 305 | Thin hook → `activity-service.ts` (keep realtime sub) |
| `src/hooks/use-pending-bookings.ts` | 228 | AI populates proposed entries |
| `src/hooks/use-financial-reports.ts` | 180 | Thin hook → `reporting-service.ts` |
| `src/hooks/use-cached-query.ts` | 234 | Consolidate to React Query |
| `src/hooks/use-compliance.ts` | 120 | Thin hook → `shareholder-service.ts` |
| `src/hooks/use-verifications.ts` | 88 | Thin hook → `verification-service.ts` |
| `src/hooks/use-dividends.ts` | 70 | AI tool: `plan_dividend` |

> Each gets rebuilt as a ~30-line hook wrapping a service call. 10 files → 10 files but ~2,200 lines → ~300 lines.

### Component Calculators to Delete (14 files, ~2,770 lines)

| File | Lines | Replace With |
|------|-------|-------------|
| `src/components/rapporter/arsbokslut.tsx` | 380 | AI tool: closing entries with reasoning |
| `src/components/rapporter/agi/use-employer-declaration.ts` | 334 | AI tool: `generate_agi` |
| `src/components/agare/bolagsstamma/use-general-meetings.ts` | 239 | AI tool: `plan_meeting` + thin display |
| `src/components/rapporter/moms/use-vat-report.ts` | 199 | AI tool: `generate_vat_report` |
| `src/components/rapporter/k10/use-k10-calculation.ts` | 197 | AI tool: `plan_k10` |
| `src/components/agare/utdelning/use-dividend-logic.ts` | 174 | AI tool: `plan_dividend` |
| `src/components/agare/aktiebok/use-aktiebok-logic.ts` | 159 | Thin display hook + service |
| `src/lib/egenavgifter.ts` | 108 | AI tool: `calculate_egenavgifter` |
| `src/components/agare/delagare/use-partner-management.ts` | 94 | AI tool: `add_partner` |
| `src/components/agare/arsmote/use-arsmote-stats.ts` | 88 | Thin hook + service |
| `src/components/loner/egenavgifter/use-tax-calculator.ts` | 64 | AI calculates on demand |
| `src/components/agare/utdelning/dividend-calculator.tsx` | 52 | Chat-first: ask Scooby |
| `src/components/agare/medlemsregister/use-member-stats.ts` | 47 | Thin hook + service |
| `src/lib/formaner.ts` | 382 | Keep catalog data, AI does calculation |

### Lib Calculation Files (2 files, ~490 lines)

| File | Lines | Replace With |
|------|-------|-------------|
| `src/lib/egenavgifter.ts` | 108 | AI tool with rate data from tax-service |
| `src/lib/formaner.ts` | 382 | Keep catalog, delete calculation functions |

**Phase 2 total: 26 files deleted/gutted, ~5,460 lines removed.**

---

## Phase 3: Component Consolidation — The Big Cleanup

This is where most of the 707→300 reduction comes from. Many domain subdirectories have 5-10 tiny files (stats card, grid, empty state, types, constants, index) that should be 1-2 files.

### Agare: 33 files → ~10 files

| Current | Files | Merge Into |
|---------|-------|-----------|
| `aktiebok/` (6 files) | index, types, logic, grid, transactions-grid, stats | 1 file: `aktiebok.tsx` + uses service |
| `arsmote/` (4 files) | grid, details, next-card, stats | 1 file: `arsmote.tsx` |
| `bolagsstamma/` (7 files) | index, meetings, details, card, grid, stats, alert | 2 files: `bolagsstamma.tsx` + `meeting-detail.tsx` |
| `delagare/` (5 files) | index, logic, grid, stats, withdrawals | 1 file: `delagare.tsx` |
| `utdelning/` (7 files) | index, logic, calculator, table, stats, types, rules | 1 file: `utdelning.tsx` (display only, AI calculates) |
| `medlemsregister/` (2 files) | stats, logic | Inline into `medlemsregister.tsx` |
| `dialogs/` (3 files) | Already deleted in Phase 1 | — |
| Root files (3) | index, arsmote.tsx, medlemsregister.tsx | Keep |

**33 → 10 files. ~4,500 lines → ~1,500 lines.**

### Rapporter: 18 files → ~5 files

| Current | Files | Merge Into |
|---------|-------|-----------|
| `k10/` (5 files) | index, calculation, breakdown, history, stats | 1 file: `k10.tsx` (display only, AI calculates) |
| `agi/` (5 files) | index, declaration, grid, list, stats | 1 file: `agi.tsx` (display only) |
| `moms/` (4 files) | index, report, list, stats | 1 file: `moms.tsx` (display only) |
| `dialogs/` (2 files) | Already deleted in Phase 1 | — |
| Root (2 files) | arsbokslut (deleted Phase 2), constants | Merge constants into page |

**18 → 5 files. ~2,500 lines → ~600 lines.**

### Loner: 29 files → ~12 files

| Current | Files | Merge Into |
|---------|-------|-----------|
| `payslips/` (4 files) | index, table, stats, logic | 2 files: `payslips.tsx` + `payslips-table.tsx` |
| `team/` (4 files) | index, card, dossier, logic | 2 files: `team.tsx` + `employee-overlay.tsx` |
| `benefits/` (4 files) | index, section, row, logic | 1 file: `benefits.tsx` |
| `delagaruttag/` (4 files) | index, grid, stats, logic | 1 file: `delagaruttag.tsx` |
| `egenavgifter/` (5 files) | index, settings, result, trend, calculator | 1 file: `egenavgifter.tsx` (display, AI calculates) |
| Root (2 files) | constants, index | Merge |

**29 → 12 files. ~2,700 lines → ~1,200 lines.**

### Bokforing: 26 files → ~12 files

| Current | Files | Merge Into |
|---------|-------|-----------|
| `transaktioner/` (7 files) | index, types, logic, overlay, filters, stats, grid | 3 files: `transaktioner.tsx` + `transaction-overlay.tsx` + `transaction-table.tsx` |
| `verifikationer/` (7 files) | index, types, logic, account-view, dialog, grid, stats | 3 files: `verifikationer.tsx` + `verification-overlay.tsx` + `verification-table.tsx` |
| `fakturor/` (8 files) | index, logic, mappers, constants, types, card, stats, empty | 2 files: `fakturor.tsx` + `invoice-table.tsx` |
| `inventarier/` (4 files) | index, grid, stats, logic | 1 file: `inventarier.tsx` |

**26 → 12 files. ~2,900 lines → ~1,500 lines.**

### Handelser: 10 files → ~5 files

| Current | Files | Merge Into |
|---------|-------|-----------|
| manadsavslut + month-review-dialog | 2 files | 1 file: `manadsavslut.tsx` |
| kalender + day-detail + deadlines | 3 files | 1 file: `kalender.tsx` |
| roadmap | 1 file | Keep |
| event-list-item + badge + logic | 3 files | 1 file: inline into parent |

**10 → 5 files. ~1,800 lines → ~800 lines.**

### AI Blocks/Cards: 65 files → ~30 files

| Current | Files | Action |
|---------|-------|--------|
| `blocks/` 29 files | Many are 10-20 lines | Merge small blocks into groups: `layout-blocks.tsx`, `data-blocks.tsx`, `form-blocks.tsx` → ~8 files |
| `cards/` 22 files | Small domain cards | Merge into ~8 domain-grouped files |
| `previews/` 18 files | Already well-structured | Keep ~14 (merge small ones) |

**65 → 30 files.**

### Shared: 19 files → ~10 files

Merge `report-wizard-shell`, `bulk-action-toolbar`, `table-toolbar` into fewer layout helpers. Delete `kanban.tsx` if unused.

**Phase 3 total: ~130 files removed through consolidation.**

---

## Phase 4: API Route Gutting

72 routes → ~25. Many routes can be:
- **Merged** — e.g., `invoices/[id]/book`, `invoices/[id]/credit-note`, `invoices/[id]/pay` → single `invoices/[id]/route.ts` with action parameter
- **Gutted** — extract inline business logic to services, leave 30-line passthroughs
- **Deleted** — routes that duplicate what AI tools do

### Routes to merge or gut (47 routes removed)

**Merge pattern:** Related sub-routes collapse into parent.
- `receipts/[id]/route.ts` + `receipts/[id]/book/route.ts` + `receipts/processed/route.ts` → 1 route
- `invoices/route.ts` + `invoices/[id]/book` + `invoices/[id]/credit-note` + `invoices/[id]/pay` → 2 routes
- `supplier-invoices/[id]/book` + `supplier-invoices/[id]/status` + `supplier-invoices/processed` → 1 route
- `stripe/checkout` + `stripe/checkout/status` + `stripe/credits` + `stripe/portal` + `stripe/billing-history` → 2 routes
- `chat/booking` + `chat/extract-memories` + `chat/history` + `chat/history/[id]` + `chat/title` → merge into chat/route.ts handlers
- `transactions/route.ts` + `transactions/[id]` + `transactions/[id]/book` + `transactions/import` → 2 routes
- `reports/annual-report` + `reports/income-declaration` + `reports/k10` + `reports/vat` → 1 route with type param
- `user/profile` + `user/avatar` + `user/preferences` → 1 route

**Gut pattern:** Extract helpers to services.
- `monthly-review/route.ts` (366 lines → ~30)
- `manadsavslut/route.ts` (234 lines → ~30)
- `search/route.ts` (223 lines → ~30)
- `sie/export/route.ts` (304 lines → ~30, calls generator service)
- `sie/import/route.ts` (156 lines → ~30, calls parser service)
- `verifikationer/auto/route.ts` (287 lines → ~30)

**Phase 4 total: 72 → ~25 routes.**

---

## Phase 5: Service & Hook Consolidation

### Services: 56 → ~20

**Keep as-is (core compliance, in CORE_FILES.md):** 7 files
**Keep but slim:** ~8 domain services (invoice, pending-booking, account, board, tax-declaration, tax-calculation, event, benefit)
**Merge CRUD services by domain:**
- `company-service.ts` + `company-service.server.ts` → 1 file
- `settings-service.ts` + `settings-service.server.ts` → 1 file
- `activity-service.ts` + `roadmap-service.ts` → 1 file (both are simple logging)
- `receipt-service.ts` + `upload-service.ts` → 1 file
- `usage-service.ts` → merge into settings or billing
- `navigation.ts` → merge into a utils file or delete (AI navigates)

**Processors stay** (they're in CORE_FILES.md).

### Hooks: 48 → ~15

**Keep:** `use-chat.ts`, `use-auth.ts`, `use-mobile.ts`, `use-search.ts`, `use-subscription.ts`, `use-preferences.ts`, `use-tax-parameters.ts`, `use-tax-period.ts`, `use-account-balances.ts`, `use-normalized-balances.ts`, `use-table.ts`, `use-realtime.ts`, chat/ subfolder (4 files)
**Delete:** Everything in Phase 2 list + `use-async.ts`, `use-highlight.ts`, `use-last-updated.ts`, `use-file-capture.ts`, `use-transactions-query.ts` (464 lines — split into service + thin hook)

---

## Summary

| Phase | Files Removed | Effort |
|-------|--------------|--------|
| 1. Immediate deletes | 13 | 10 minutes |
| 2. Calculator → AI tools | 26 | 1-2 sessions (need AI tools built) |
| 3. Component consolidation | ~130 | 2-3 sessions (merge + test) |
| 4. API route gutting | ~47 | 1-2 sessions (extract to services) |
| 5. Service/hook consolidation | ~30 | 1 session |
| **Total** | **~423** | **707 → ~284 files** |

### What Gets Built Back

| New Thing | Count | Effort |
|-----------|-------|--------|
| AI tools (K10, dividends, AGI, egenavgifter, meetings, etc.) | ~8 | Medium |
| Thin service-backed hooks (replacing direct-DB hooks) | ~10 | Small (30 lines each) |
| Page overlays (replacing old dialogs) | ~3 | Small |
| AI walkthrough overlays (replacing report dialogs) | ~3 | Small |
| Service extractions from API routes | ~6 | Small |
