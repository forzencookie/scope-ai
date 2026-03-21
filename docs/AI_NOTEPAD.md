# AI Notepad

> Cross-session context for AI agents working on this codebase.
> **Read this first.** Then read `CLAUDE.md` for codebase rules. Then start working.

---

## Last Updated: 2026-03-21

## What Is This App?

Scope AI is an **environment wrapped around an AI API key, tasked to do Swedish accounting.** The AI assistant (Scooby) handles all reasoning, calculations, and decisions. Code handles only deterministic invariants (double-entry bookkeeping, sequential numbering, file format generation). Read `docs/flows/ai-first-philosophy.md` for the full philosophy.

---

## What's Been Done

### Phase 1: Dead Code Cleanup ✅ COMPLETE
- Deleted **~51 dead files** across two rounds (old dialogs, wizards, calculators, unused components)
- Barrel exports cleaned in shared/index.ts, installningar/index.ts, rapporter/index.ts, agare/index.ts
- Zero dangling imports confirmed
- Full deletion list in `docs/fix/ai-leverage-audit.md` under "DEAD CODE — All Deleted"

### Sentinel Session: AI Chat Route + Architecture Fixes ✅ COMPLETE
- **Rewrote `src/app/api/chat/route.ts`** with Gate → Stream → Persist architecture:
  - Fixed company lookup crash (`.single()` without `.eq('id', companyId)` filter)
  - Added `extractMessageContent()` to handle Vercel AI SDK v4 `parts` format
  - Moved message persistence to `onFinish` callback (non-blocking stream)
  - Parallelized activity snapshot + memory injection with `Promise.all`
- **Rewrote `src/components/layout/ai-chat-sidebar.tsx`** — 387 lines → 180 lines:
  - Was a monolith: own `useChat()`, duplicate state, duplicate event listeners, inline 60-line SVG
  - Now a thin shell over shared `useChatContext()` from ChatProvider
- **Refactored `src/hooks/use-ai-usage.ts`** — 189 lines → 90 lines:
  - Eliminated duplicate Supabase queries (hook was reimplementing `usage-service.ts`)
  - Extended `src/services/usage-service.ts` with `getUsageDetails()` method
  - Hook now delegates entirely to service
- **Fixed `src/data/app-navigation.ts`** — 6 stale tab references:
  - `?tab=benefits` → `?tab=formaner`
  - Removed phantom Kvitton, Utdelning, Firmatecknare nav items
  - Collapsed Rapporter from 8 fake tab URLs to 1 link
- **Audited `app-sidebar.tsx`** — event listeners are fine (sidebar mode switching, not chat logic)
- **All changes type-check clean** — 0 new errors introduced (106 pre-existing errors remain)

### Sentinel Docs Created
- `docs/fix/architecture-layer-violations.md` — Tracks 10 hooks/components bypassing service layer (2 fixed, 8 pending)
- `docs/fix/ai-interface.md` — Rewritten with Gate → Stream → Persist analysis, P0/P1/P2 issues
- `docs/fix/scooby-engine.md` — Rewritten with token budget, tool index gap, memory filtering issues
- `docs/fix/information-pages.md` — Rewritten with actual nav-to-tab mismatch tables (Gemini had falsely marked "Complete")
- `docs/fix/tools.md` — Rewritten with confirmation flow gaps, missing tools list
- Added Propagation Rule to `CLAUDE.md` — 6-point dependency chain check

### Claudis Docs Created
- `docs/flows/ai-first-philosophy.md` — Foundational architecture principle + "Reasoning-Before-Output" pattern
- `docs/fix/ai-leverage-audit.md` — File-by-file audit of entire codebase (KEEP vs AI-LEVERAGE vs DEAD)
- `docs/fix/architecture-audit.md` — Original architecture audit (7 systemic issues)

---

## What To Do Next (in order)

### Phase 2: Fix 82 TypeScript Errors (6 root causes)

Run `npx tsc --noEmit` first to get current count. These 82 errors collapse into 6 root causes — fix the root, not individual errors:

**1. `use-tax-parameters.ts` return type (~40 errors)**
- File: `src/hooks/use-tax-parameters.ts`
- Problem: Hook returns `{ rates: TaxRates | null }` but ~15 consumer files destructure it expecting `TaxRates` directly
- Fix: Either change the hook's return signature OR update all consumers. Check which approach touches fewer files.
- Consumers to check: grep for `useAllTaxRates\|useTaxRates` across `src/`

**2. `VerificationEntry` → `VerificationRow` rename (~6 errors)**
- Problem: Type was renamed but some files still reference the old name
- Fix: Find-and-replace `VerificationEntry` → `VerificationRow` across all files that error
- Check: grep for `VerificationEntry` across `src/`

**3. Missing modules (~4 errors)**
- `processors/reports` — check if this module exists or was renamed/moved
- `annual-report-processor` — check if this exists or was deleted
- `./types` — some relative imports point to non-existent local type files
- `navPlatform` — check what this references
- Fix: For each, either create the missing module, update the import path, or remove dead code that references it

**4. `AuditResult`/`AuditCheck` not exported (~4 errors)**
- Problem: Types used but not exported from their source module
- Fix: Add the exports to the audit module, or check if the types were renamed

**5. Misc one-offs (~15 errors)**
- `AuthContext.user` — property access on auth context that doesn't match the type
- Stripe `"free"` tier — string literal not in the allowed union type
- Zod v4 API — method calls using old Zod API (likely `.parse()` vs `.safeParse()` or schema definition changes)
- `shareholder-service.ts` — missing `user_id` in insert
- `compliance.ts` — duplicate object keys
- `use-stream-parser.ts` — type mismatch in stream parsing
- Fix: Each is independent. Read the file, understand the error, fix it.

**6. Verify after fixes**
- Run `npx tsc --noEmit` — target: **0 errors**
- Run the app: `npm run dev` — verify no runtime errors

### Phase 3: Layer Fixes

After TypeScript errors are at 0:

- [ ] Extract `fetchActivitySnapshot()` + `fetchRelevantMemories()` from `src/app/api/chat/route.ts` to `src/lib/chat/` as standalone pure functions (they take a Supabase client, return context — not route-specific)
- [ ] Migrate remaining 8 hooks that call Supabase directly → delegate to services
- [ ] See `docs/fix/architecture-layer-violations.md` for the specific tracking list (2 done, 8 pending)
- [ ] See `docs/fix/architecture-audit.md` for the broader systemic issues

### Phase 4: AI-Leverage Migration

After layers are clean, migrate calculation logic from code to AI tools. **Priority order** (by duplication/impact):

**1. Egenavgifter triple-duplicate (highest priority)**
- Same tax calculation exists in 3 places: `src/lib/egenavgifter.ts` + `src/services/tax-calculation-service.ts` + `src/components/loner/egenavgifter/use-tax-calculator.ts`
- Action: Keep `egenavgifter.ts` as rate reference data. Gut `tax-calculation-service.ts` to thin data-fetcher. Gut `use-tax-calculator.ts` to keep slider UI state only, AI calculates on change.

**2. K10 dividend threshold**
- File: `src/components/rapporter/k10/use-k10-calculation.ts`
- Complex rule engine (schablonregel, lönebaserat, räntebaserat, sparat utrymme)
- Action: Delete hook, AI tool handles K10 planning with reasoning

**3. AGI employer declaration**
- File: `src/components/rapporter/agi/use-employer-declaration.ts`
- Age-based tax rate logic extracted from personnummer
- Action: Delete hook, AI tool generates AGI with anomaly detection

**4. Dividend planning**
- Files: `src/components/agare/utdelning/use-dividend-logic.ts` + `src/hooks/use-dividends.ts`
- Tax blending (20% capital vs 32% income above gränsbelopp)
- Action: Delete logic hooks, AI dividend planning tool with tax optimization

**5. KPI analysis**
- Files: `src/hooks/use-company-statistics.ts` + `src/services/company-statistics-service.ts` + `src/hooks/use-financial-metrics.ts`
- Financial ratios and trend analysis
- Action: KEEP for instant page display, AI adds narrative interpretation on top

**For each migration:**
1. Verify the corresponding AI tool exists in `src/lib/ai-tools/`
2. If not, create it
3. Gut the calculation — component/hook becomes thin display wrapper
4. Test that the overlay/page still renders correctly

### Phase 5: Final Cleanup

- [ ] Run `npx tsc --noEmit` — must be 0 errors
- [ ] Verify all barrel exports are accurate
- [ ] Update this notepad with results

---

## Key Architectural Rules

- **If it renders on page load** → deterministic code (instant display)
- **If it generates a downloadable/sendable document** → AI reasons first (quality gate)
- **Overlays are pure display** — they render whatever data they receive, don't care who assembled it
- **The AI-first differentiator**: AI doesn't just fetch and assemble data — it checks completeness, flags anomalies, and explains what it found before generating output. Traditional software can't do this.
- **Zero tolerance**: No `as any`, no `@ts-ignore`, no `eslint-disable`, no swallowed errors

## Key Docs
| Doc | Purpose | Author |
|-----|---------|--------|
| `CLAUDE.md` | Codebase rules — READ FIRST | Founder + Sentinel |
| `docs/flows/ai-first-philosophy.md` | WHY we make decisions | Claudis |
| `docs/fix/ai-leverage-audit.md` | File-by-file audit (what to keep, delete, migrate) | Claudis |
| `docs/fix/architecture-audit.md` | 7 systemic architecture issues (full picture) | Claudis |
| `docs/fix/architecture-layer-violations.md` | 10 hooks/components bypassing services (tracking: done vs pending) | Sentinel |
| `docs/fix/ai-interface.md` | Chat route architecture, Gate → Stream → Persist | Sentinel |
| `docs/fix/scooby-engine.md` | Token budget, tool discovery, memory filtering gaps | Sentinel |
| `docs/fix/information-pages.md` | Nav-to-tab mismatches (6 found, all fixed) | Sentinel |
| `docs/fix/tools.md` | Tool confirmation flow, missing tools | Sentinel |
| `docs/flows/` | Vision docs for each feature area | Mixed |
| `docs/fix/` | Execution plans for reaching the vision | Mixed |

## Agents

| Name | Model | Role |
|------|-------|------|
| **Sentinel** | Claude Opus 4.6 | Architecture auditor, code fixer. Did the chat route rewrite, sidebar refactor, layer violation fixes, and all fix doc rewrites. |
| **Claudis** | Claude Opus 4.6 | Philosophy architect, leverage auditor. Created AI-first philosophy, leverage audit, architecture audit, dead code cleanup. |

Previous Gemini model did an earlier audit but was unreliable — marked things "Complete" that weren't. Sentinel's fix docs corrected these. Trust Sentinel/Claudis docs over any earlier Gemini assessments.

## Key Decisions (don't re-litigate these)
- **Sentinel** reviewed the Claudis audit. Agreed with core approach. Added: don't gut hooks that power instant page displays (latency). Keep financial reports deterministic for instant render, AI adds narrative on top.
- **Claudis** pushed back on Sentinel about chat route helpers. Agreed: `extractMessageContent()` and `parseCompanyType()` stay in the route (request-specific parsing), but `fetchActivitySnapshot()` and `fetchRelevantMemories()` should extract to `src/lib/chat/` (reusable AI context builders, not route-specific). Sentinel conceded — captured in Phase 3.
- **Sentinel** identified 10 hooks/components bypassing service layer. Fixed 2 (`use-ai-usage.ts`, `ai-chat-sidebar.tsx`), documented remaining 8 in `docs/fix/architecture-layer-violations.md`.
- **Sentinel** found and fixed 6 stale navigation references (tab URLs pointing to nonexistent page tabs). Added Propagation Rule to `CLAUDE.md` to prevent recurrence.
- **Founder** confirmed: the differentiator is AI reasoning about data quality before output, not just assembling reports blindly.
- **Settings overlay** (`installningar/settings-overlay.tsx`) supersedes old `components/settings/` directory (deleted).
- **FeatureGate** in `shared/upgrade-prompt.tsx` (subscription-tier) is the active one. The company-type version in `auth/feature-gate.tsx` was dead (deleted).
- **Integration logos** was a third-party logo display, NOT the user logo upload feature (that's in settings-overlay, untouched).
