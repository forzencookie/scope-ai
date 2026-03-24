# Workstreams — What's Broken

> These are known bugs, debt, and code quality issues in the current codebase.
> Fix these first before building toward the vision.

## Completed

- **Mutation dialogs deleted** — 18 mutation dialogs removed across bokforing/agare/loner. Pages are now read-only. All 3 duplicate booking dialogs (`BookingWizardDialog`, `BookingDialog`, `NewTransactionDialog`) deleted.
- **Demo artifacts cleaned** — `bank.ts`, `upload-invoice/route.ts`, `kivra.svg` deleted. Dead imports cleared.
- **Database schema fix** — `docs/fix/database-schema.md` is complete. WS-01 is unblocked.
- **Architecture cleanup** — Services restructured into domain subdirectories. `use-cached-query.ts` deleted, all consumers migrated to React Query. Dead code removed from `types/ownership.ts`. Dead world map script deleted.
- **Route extraction** — Invoice numbering/VAT and månadsavslut logic moved from API routes into services.
- **Null/undefined boundary** — `nullToUndefined()` utility added. 40 `?? undefined` and 46 `|| undefined` fixed across ~40 files. Convention: `T | undefined` (matching React).
- **withAuth migration** — All 39 API routes migrated from manual `getAuthContext()` to `withAuth`/`withAuthParams` wrappers. New `requireAuthContext()` bridges auth types.
- **API response standardization** — Removed `success: true/false` from all routes. Data returned directly with HTTP status codes. Consistent `{ error }` for failures.
- **RPC type safety** — All `any` casts in service RPC calls replaced with proper types (account-service, closing-entry-service, verification-service, invoice-service, tax-calculation-service, board-service, ai-audit-service).
- **Zero-tolerance cleanup** — 0 `as any`, 0 `@ts-nocheck`, 0 `@ts-ignore`, 0 `eslint-disable`, 0 `_` prefix unused vars. All `any` in hooks/tools/schema also fixed.
- **Stale deadlines fixed** — Hardcoded 2024-2025 dates in `navigation.ts` replaced with dynamic calculation.
- **`company_members` table dropped** — Confusing overlap with domain tables. Auth now queries `companies.user_id` directly.
- **`pending_bookings` system removed** — Table, service (441 lines), hook (229 lines), API route, server actions all deleted. Booking routes now create verifications directly. Confirmation happens in Scooby chat UI, not a database staging table.
- **`activity_log` merged into `events`** — Table, service (211 lines), trigger function dropped. Hook (`use-activity-log.ts`) and UI (`activity-feed.tsx`) now query the `events` table. `audit.ts` inserts into `events`. AI summary tool uses `event-service`. Single unified timeline with hash chain integrity.

## Active Workstreams

| # | Issue | Thinking | Status |
|---|-------|----------|--------|
| 01 | [Type Safety](01-type-safety.md) — 0 type errors ✅, 0 `as any` ✅, 0 `@ts-nocheck`, 0 `@ts-ignore`, 0 `?? undefined`, 0 `|| undefined` (1 intentional). All RPC results typed. | 🟢 Medium | 🟢 Done |
| 02 | [Dead Code](02-dead-code-cleanup.md) — 1 stub tool remaining, disconnected model system | 🟢 Medium | 🟡 Nearly done |
| 03 | [Tool–Service Consistency](03-tool-service-consistency.md) — duplicate tool name fixed, service bypasses largely fixed, some direct Supabase in tools may remain | 🟢 Medium | 🟢 Mostly done |
| 04 | [Generator Fixes](04-generator-fixes.md) — SRU bug fixed, disconnected model ID system remains | 🟢 Medium | 🟡 Partially done |

**Dependency chain:** ~~`fix/database-schema.md` →~~ 01 → 02 → 03 → 04

## Fix Doc Status

| Doc | Status | Remaining |
|-----|--------|-----------|
| database-schema | ✅ Green | — |
| onboarding | ✅ Green | — |
| page-overlays | ✅ Green | — |
| payments | ✅ Green | — |
| settings | ✅ Green | — |
| walkthrough-overlays | ✅ Green | — |
| ai-interface | ✅ Green | All P0/P1/P2 fixed. Missing features (skills, editable cards) are future work |
| scooby-engine | ✅ Green | Architecture works. Memory, compaction, sub-agents are future features |
| service-ui-standardization | ✅ Green | `shares_count` chain is consistent. Zero `as any` |
| tools | ✅ Green | Registry, execution, confirmation all working. Missing tools are future features |
| ai-leverage-audit | ✅ Green | 0 TS errors, audit complete |
| architecture-audit | ✅ Green | Reference doc — issues tracked in individual fix docs |
| landing-page | ✅ Green | Dark theme ✅, forgot password ✅, Swedish navbar ✅, dead /users deleted ✅ |
| information-pages | 🟢 Mostly done | Utdelning + firmatecknare tabs added ✅. Low-priority: Scooby buttons |
| architecture-layer-violations | ✅ Green | 7 fixed. 1 deferred (`use-month-closing.ts` — needs new period service) |
| k10-dividend-calculation | ⬜ Future | New tools: `get_dividend_data`, `calculate_k10` |
| split-vat-bookings | ⬜ Future | Extend `create_receipt` for multi-VAT line items |

## Architecture Cleanup (completed)

| Area | What Changed |
|------|-------------|
| Service folders | 33 flat files → 8 domain subdirectories (`accounting/`, `tax/`, `payroll/`, `corporate/`, `invoicing/`, `reporting/`, `common/`, `company/`) with barrel re-exports |
| Hook violations | 4 hooks fixed to delegate to services instead of direct Supabase |
| Route extraction | Invoice creation + månadsavslut business logic extracted to services |
| `use-cached-query.ts` | Deleted. 6 consumers migrated to React Query (`useQuery`) |
| Dead code | `calculateEgenavgifter()` removed from `types/ownership.ts`, world map script deleted |
| Suppressors | 0 `@ts-nocheck`, 0 `@ts-ignore`, 0 `as any` across entire codebase |
