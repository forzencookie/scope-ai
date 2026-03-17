# Workstreams — What's Broken

> These are known bugs, debt, and code quality issues in the current codebase.
> Fix these first before building toward the vision.

## Completed

- **Mutation dialogs deleted** — 18 mutation dialogs removed across bokforing/agare/loner. Pages are now read-only. All 3 duplicate booking dialogs (`BookingWizardDialog`, `BookingDialog`, `NewTransactionDialog`) deleted.
- **Demo artifacts cleaned** — `bank.ts`, `upload-invoice/route.ts`, `kivra.svg` deleted. Dead imports cleared.

## Active Workstreams

| # | Issue | Thinking | Status |
|---|-------|----------|--------|
| 01 | [Type Safety](01-type-safety.md) — 374 suppressors, stale Supabase types, `@ts-nocheck` on critical files | 🟢 Medium | ⬜ Not started |
| 02 | [Dead Code](02-dead-code-cleanup.md) — ~1,500 LOC deprecated cards, 3 stub tools, disconnected model system | 🟢 Medium | 🟡 In progress |
| 03 | [Tool–Service Consistency](03-tool-service-consistency.md) — 8 files with 15+ service bypasses, duplicate tool name, inconsistent validation | 🟢 Medium | ⬜ Not started |
| 04 | [Generator Fixes](04-generator-fixes.md) — SRU bug (phone vs orgnr), disconnected model ID system | 🟢 Medium | ⬜ Not started |

**Dependency chain:** `fix/database-schema.md` → 01 → 02 → 03 → 04

WS-01 (Type Safety) is **blocked** by the database schema fix — no point regenerating types for a wrong schema. Start with `docs/fix/database-schema.md` (drop dead tables, replace `corporate_documents` with `meetings`, recreate `dividends`, extend `partners`/`members`), then work 01 → 02 → 03 → 04 in order.

After these are done, the codebase is clean. Then move to `docs/fix/` to build toward the vision.
