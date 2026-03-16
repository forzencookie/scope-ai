# 01 — Type Safety

| Field | Value |
|-------|-------|
| **Status** | ⬜ Not started |
| **Priority** | 🔴 Critical |
| **Phase** | 1 — Clean Foundation |
| **Dream State Section** | Section 8 — Load-Bearing Systems (type-safe DB layer) |
| **Thinking Mode** | 🟢 Medium |
| **Estimated LOC changed** | ~200 |

## Audit Findings

- ~17 `as any` casts from `.from('table_name' as any)` pattern — caused by stale/missing Supabase type generation
- `src/services/user-memory-service.ts` has `@ts-nocheck` — entire file is type-unchecked
- Scattered `as any` casts in services and API routes to silence type mismatches
- Total suppressors: ~374 across the codebase (target: ~35 truly unavoidable)

## Why

Type safety is the foundation. Every `as any` is a place where bugs hide and refactors break silently. The Supabase codegen alone fixes ~17 casts for free.

## What to Do

1. 🟢 **Run Supabase type generation:**
   ```bash
   npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
   ```
2. 🟢 **Remove `as any` casts** from all `.from('table_name' as any)` calls — the generated types should make them unnecessary.
3. 🟢 **Fix `user-memory-service.ts`:** Remove `@ts-nocheck`, add proper types, fix all resulting errors.
4. 🟢 **Audit remaining `as any` casts:** For each one, either fix with proper typing or document why it's truly unavoidable with an inline comment.
5. 🟢 **Remove unnecessary `eslint-disable` comments** — fix the underlying issue instead.
6. 🟢 **Run `tsc --noEmit`** to verify zero type errors.

## Files to Touch

- `src/types/supabase.ts` (regenerate)
- `src/services/user-memory-service.ts` (remove @ts-nocheck)
- All files with `.from('table_name' as any)` pattern (~17 files across `src/services/` and `src/app/api/`)
- All files with `eslint-disable` or `as any` that can be fixed

## Acceptance Criteria

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `@ts-nocheck` count is 0
- [ ] `as any` count is **zero** — if a type is unknown, define the type
- [ ] `eslint-disable` count is **zero** — fix the underlying issue, don't silence it
- [ ] Zero suppressors of any kind in the codebase

## Do NOT Touch

- Do not change any business logic or feature behavior
- Do not refactor function signatures or API contracts
- Do not add new dependencies
