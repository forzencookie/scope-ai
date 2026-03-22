# 01 — Type Safety

| Field | Value |
|-------|-------|
| **Status** | 🟡 Mostly done — 46 TS errors remain |
| **Priority** | 🔴 Critical |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 8 — Load-Bearing Systems (type-safe DB layer) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~200 |

## Progress (as of 2026-03-21)

Major cleanup already completed:
- **`as any` count: 2** (down from ~374). Remaining:
  - `src/components/ai/chat-message-list.tsx` line 223 — BalanceAuditCard `.component` check
  - `src/lib/validation.ts` — message role/content destructure
- **`@ts-nocheck` count: 0** (was 1 in `user-memory-service.ts`, now fixed)
- **`@ts-ignore` count: 0**
- **`eslint-disable` count: 0**

## Remaining Work

**46 active type errors** from `tsc --noEmit`. Key categories:
- Missing exports: `AuditResult`, `AuditCheck` from `bokforing/audit.ts`
- Missing exports: `VerificationEntry` from `verification-service.ts` (should be `VerificationRow`)
- Missing module: `@/components/settings` (import in `settings-items.tsx`)
- Missing module: `./types` in `use-tax-calculator.ts`
- Missing export: `MonthlyData` from `use-tax-calculator.ts`
- Missing properties: `employerContributionRate`, `employerContributionRateSenior` (tax service)
- Missing property: `user` on `AuthContext`
- Stripe webhook type mismatch: `"free"` tier doesn't exist in Stripe models

## Blocked By

~~**`docs/fix/database-schema.md`** — Schema must be cleaned before regenerating types.~~ **DONE** — schema fix is complete.

## What to Do

1. ~~Complete `fix/database-schema.md` first~~ ✅ Done
2. 🟢 **Fix 46 type errors** — resolve missing exports, stale imports, wrong property names
3. 🟢 **Remove last 2 `as any` casts** — define proper types for both cases
4. 🟢 **Run `tsc --noEmit`** to verify zero type errors

## Acceptance Criteria

- [x] `@ts-nocheck` count is 0
- [x] `@ts-ignore` count is 0
- [x] `eslint-disable` count is 0
- [ ] `as any` count is **zero** (2 remaining)
- [ ] `tsc --noEmit` passes with zero errors (46 remaining)

## Do NOT Touch

- Do not change any business logic or feature behavior
- Do not refactor function signatures or API contracts
- Do not add new dependencies
