# AI-Leverage Audit

> Full codebase audit: which files contain logic the AI should handle, which are dead, and which stay as code.
> See [`docs/flows/ai-first-philosophy.md`](../flows/ai-first-philosophy.md) for the reasoning behind these decisions.

## Summary

| Directory | Total Files | KEEP | AI-LEVERAGE | DEAD (deleted) | MISPLACED |
|-----------|------------|------|-------------|----------------|-----------|
| **hooks/** | 44 | 35 | 7 | ~~2~~ ✅ | 0 |
| **services/** | 50 | 48 | 2 | 0 | 0 |
| **lib/** (excl. ai-tools/) | 82 | 81 | 1 | ~~1~~ ✅ | 0 |
| **components/** | ~175 | majority | 5 | ~~47~~ ✅ | 0 |
| **providers/** | 7 | 7 | 0 | 0 | 0 |
| **types/** | 9 | 9 | 0 | ~~1~~ ✅ | 0 |
| **data/** | 10 | 10 | 0 | 0 | 0 |
| **app/** | 30+ | all | 0 | 0 | 0 |
| **scripts/** | 7 | 7 | 0 | 0 | 0 |

**Totals: ~15 AI-leverage candidates remaining, ~51 dead files deleted ✅, 0 misplaced logic**
**TypeScript errors: 0 ✅ (down from 106)**

---

## Category Definitions

- **KEEP** — Deterministic rules, CRUD, data fetching, UI state, legal invariants. Must stay as code.
- **AI-LEVERAGE** — Reasoning, calculation, estimation, or optimization logic that the AI can do better. Should be gutted and replaced with AI tool calls or moved to thin service wrappers that AI tools invoke.
- **DEAD** — Never imported anywhere. Delete.
- **MISPLACED** — Logic in the wrong architectural layer (none found — the app is well-layered).

---

## DEAD CODE — All Deleted ✅

All dead code has been removed across two cleanup rounds. Barrel exports updated. Zero dangling imports confirmed.

### Round 1 (earlier session) — 22 files
- `src/components/rapporter/dialogs/ink2.tsx`, `assistent.tsx`, `sru.tsx`, `rapport.tsx`
- `src/components/rapporter/arsredovisning.tsx`, `balansrakning.tsx`, `resultatrakning.tsx`, `ne-bilaga.tsx`, `inkomstdeklaration.tsx`
- `src/components/agare/action-wizard/` (10 files: index, board-change-form, configure-step, constants, dividend-form, generic-form, roadmap-form, step-complete, step-preview, step-select)
- `src/components/agare/firmatecknare.tsx`, `firmatecknare-logic.ts`
- `src/hooks/use-self-employment-tax.ts`

### Round 2 (this session) — 25+ files
- `src/hooks/use-navigation.ts` — zero imports
- `src/lib/ai-suggestion.ts` — zero imports, called non-existent endpoint
- `src/types/board-meeting.ts` — zero imports, superseded by `types/ownership.ts`
- `src/components/documents/` (entire directory) — `DocumentList` + `SignatureFlow`, never imported. Planned features never wired in.
- `src/components/shared/online-users.tsx` — `OnlineUsers`, `OnlineUsersBadge`, `EditConflictWarning`, never imported
- `src/components/installningar/integration-logos.tsx` — third-party integration logo display, never imported. NOT the user logo upload (that's in settings-overlay.tsx, untouched)
- `src/components/auth/feature-gate.tsx` — duplicate company-type gating, never exported from barrel. The ACTIVE `FeatureGate` (subscription-tier based) lives in `shared/upgrade-prompt.tsx`, untouched
- `src/components/settings/` (entire directory, ~17 components) — old settings UI primitives, superseded by `installningar/settings-overlay.tsx`. Zero imports for any of the 17 components

### Confirmed NOT dead (kept)
- `src/lib/ocr.ts` — actively used in `src/app/api/invoices/route.ts` for OCR number generation

---

## AI-LEVERAGE — Refined Decisions

> **The rule:** If it renders on page load → keep as deterministic code. If it generates a downloadable/sendable document → AI reasons first. See [AI-First Philosophy: Reasoning-Before-Output](../flows/ai-first-philosophy.md#the-reasoning-before-output-pattern).

### Hooks — DELETE (report generation, not page display)

These don't power instant page renders. They power generation flows the AI should own:

| File | Calculation Logic | Action | Why |
|------|------------------|--------|-----|
| `src/hooks/use-dynamic-tasks.ts` | Task generation from deadlines, transaction counts, payroll rules | **DELETE** | AI generates tasks with context, not hardcoded deadline logic |
| `src/hooks/use-dividends.ts` | ABL distributable equity (restricted vs free equity) | **GUT** — keep data fetch, delete ABL math | AI reasons about ABL compliance with explanation |
| `src/hooks/use-pending-bookings.ts` | Entry proposal logic in booking wizard | **GUT** — keep state management, AI populates `proposedEntries` | AI reasons about correct accounts |

### Hooks — KEEP (page display, AI enriches on top)

These power instant page renders. Keep the deterministic numbers, let AI add narrative:

| File | Calculation Logic | Action | Why |
|------|------------------|--------|-----|
| `src/hooks/use-company-statistics.ts` | KPIs (solidity, liquidity, profit margin) | **KEEP for display** — AI interprets | Users expect instant dashboard KPIs |
| `src/hooks/use-financial-metrics.ts` | Monthly revenue/expense/profit trends | **KEEP for display** — AI interprets | Trend charts need instant rendering |
| `src/hooks/use-financial-reports.ts` | Balance sheet, income statement orchestration | **KEEP** | Core accounting output — instant render, AI adds "your expenses are up 12%" |
| `src/hooks/use-vat-report.ts` | VAT box aggregation | **KEEP for display** — AI validates when generating momsdeklaration | Moms page shows summary instantly |
| `src/hooks/use-tax-parameters.ts` | Tax parameter fetching | **KEEP** | Pure data fetch with caching |
| `src/hooks/use-tax-period.ts` | Period selection + deadline derivation | **KEEP** | UI state management |
| `src/hooks/use-normalized-balances.ts` | Balance sign normalization per BAS class | **KEEP** | Deterministic accounting rule |

### Components — DELETE (AI tool replaces)

| File | Calculation Logic | Action | Why |
|------|------------------|--------|-----|
| `src/components/rapporter/k10/use-k10-calculation.ts` | K10 threshold: schablonregel, lönebaserat, räntebaserat, sparat utrymme | **DELETE** | Complex rule engine → AI K10 planning tool with reasoning |
| `src/components/rapporter/agi/use-employer-declaration.ts` | AGI: age from personnummer, contribution rates, period aggregation | **DELETE** | AI generates AGI with anomaly detection |
| `src/components/agare/utdelning/use-dividend-logic.ts` | Dividend tax blending (20% capital vs 32% income) | **DELETE** | AI dividend planning with tax optimization |
| `src/components/loner/egenavgifter/use-tax-calculator.ts` | Egenavgifter with reduced rates and karens | **GUT** — keep slider UI state, delete tax math | AI calculates on slider change |
| `src/components/rapporter/arsbokslut.tsx` | Year-end closing: P&L aggregation by account ranges | **GUT** — keep display, AI generates closing entries | Scooby reasons about completeness before closing |

### Services (2 files)

| File | Calculation Logic | AI Replacement |
|------|------------------|----------------|
| `src/services/tax-calculation-service.ts` | YTD profit + egenavgifter estimation, salary-vs-dividend comparison | AI does tax planning scenarios; service becomes thin data-fetcher |
| `src/services/company-statistics-service.ts` | KPI calculations (gross margin, operating margin, current ratio, ROE), trend analysis | AI interprets financial health with business context |

### Lib (2 files)

| File | Calculation Logic | AI Replacement |
|------|------------------|----------------|
| `src/lib/egenavgifter.ts` | Self-employment tax (7 components, karens reduction, reduced rates) | AI calculates tax components on-the-fly with rate data. Currently used by `tax-calculation-service.ts` only |
| `src/lib/formaner.ts` | Employee benefit tax impact (`calculateFormansvarde`, `calculateBenefitTaxImpact`) | Split: keep DB/catalog CRUD as code, move calculation to AI. Used by 5 files |

### Components (5 files)

| File | Calculation Logic | AI Replacement |
|------|------------------|----------------|
| `src/components/loner/egenavgifter/use-tax-calculator.ts` | Self-employed tax calculation with reduced rates and karens reductions | AI tool `calculate_egenavgifter` — component becomes display-only |
| `src/components/rapporter/k10/use-k10-calculation.ts` | K10 dividend threshold: schablonregel (2.75 × IBB × ownership%), lönebaserat utrymme (50% × salary × ownership%), räntebaserat, sparat utrymme | Complex rule engine → AI-driven K10 planning tool |
| `src/components/rapporter/arsbokslut.tsx` | Year-end closing: P&L aggregation by account ranges (3xxx revenue, 4xxx materials, 5-6xxx external, 7xxx personnel, 8xxx financial) | Scooby suggests closing entries via AI tool |
| `src/components/agare/utdelning/use-dividend-logic.ts` | Dividend tax blending (20% capital vs 32% income above gränsbelopp), effective rate calculation. **Confirmed: still has hardcoded `0.2` and `0.32` on lines 23, 28-29 — must come from `taxService.getTaxRates()`** | AI dividend planning tool with tax optimization |
| `src/components/rapporter/agi/use-employer-declaration.ts` | AGI: age extraction from personnummer, employer contribution rates (10.21% under 26/over 65, ~31.42% others), period aggregation | AI tool for AGI generation |

---

## KEEP — Deterministic Code That Stays

### Why These Stay (Quick Reference)

**Legal invariants (Swedish law):**
- `lib/bookkeeping/validation.ts` — Debit = credit, sequential verification numbering (BFL)
- `lib/bookkeeping/vat.ts` — VAT rate classification (25/12/6/0%)
- `lib/bookkeeping/entries/` — Double-entry templates (purchase, sales, salary)
- `services/verification-service.ts` — Gap-free numbering, period locking
- `services/correction-service.ts` — Correction verification per BFL §5:13

**Data access (CRUD):**
- All 48 KEEP services — pure DB access, validation at system boundaries
- All 35 KEEP hooks — data fetching, UI state, caching

**File format generation (binary specs):**
- `lib/generators/` — PDF, AGI XML, SIE, SRU, VAT XML, XBRL
- `lib/parsers/sie-parser.ts` — SIE4 import

**Tax law lookups (not reasoning):**
- `lib/swedish-tax-rules.ts` — Prisbasbelopp, inventarier thresholds
- `lib/tax-periods.ts` — Filing deadline calendar
- `data/accounts.ts` — BAS chart of accounts (500+ entries)

**AI infrastructure:**
- `lib/agents/scope-brain/` — Agent orchestration, prompt building, model selection
- `lib/ai/` — Model registry, tool types, context builder, reference data
- `lib/ai-schema.ts` — Normalizes stochastic AI output → strict types

**Security & infrastructure:**
- `lib/database/` — Supabase clients with RLS
- `lib/model-auth.ts` — Tier-based model access control
- `lib/rate-limiter.ts` — Request throttling
- `lib/stripe.ts` — Payment processing

**Processors (deterministic transforms, not reasoning):**
- `services/processors/vat/` — VAT box mapping, XML export
- `services/processors/tax/` — INK2 field mapping, SRU codes
- `services/processors/invoice-processor.ts` — Invoice → verification

---

## Execution Order

### Phase 1: Delete Dead Code ✅ Complete
~~Delete all files listed in the DEAD section. Update barrel exports (`index.ts` files) to remove references.~~

All 51 dead files deleted across two rounds. Barrel exports updated.

### Phase 2: Fix Remaining TypeScript Errors
~~The remaining errors collapse into ~6 root causes:~~ ✅ All resolved — `tsc --noEmit` passes clean.
1. `use-tax-parameters.ts` returns `{ rates }` wrapper — ~40 cascade errors
2. `VerificationEntry` renamed to `VerificationRow` — ~6 errors
3. Missing modules (processors/reports, annual-report-processor, ./types) — ~4 errors
4. `AuditResult`/`AuditCheck` not exported — ~4 errors
5. Misc type mismatches — ~15 errors

Fix root causes first, not individual errors.

### Phase 3: Migrate AI-Leverage Files
For each AI-LEVERAGE file:
1. Verify the corresponding AI tool exists (or create it)
2. Gut the calculation logic — component/hook becomes a thin display wrapper
3. Wire the component to call the AI tool via chat or directly invoke the service
4. Delete the hook/utility that held the calculation

**Priority order** (by impact):
1. `use-tax-calculator.ts` + `egenavgifter.ts` + `tax-calculation-service.ts` — same calculation in 3 layers
2. `use-k10-calculation.ts` — most complex rule engine
3. `use-employer-declaration.ts` — AGI age-based logic
4. `use-dividend-logic.ts` + `use-dividends.ts` — dividend tax optimization
5. `use-company-statistics.ts` + `company-statistics-service.ts` + `use-financial-metrics.ts` — KPI analysis

### Phase 4: Clean Up
- Remove unused imports left behind by deletions
- Verify all barrel exports are accurate
- Run full `tsc --noEmit` — target: 0 errors
