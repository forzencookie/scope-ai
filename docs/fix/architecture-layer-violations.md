# Fix: Architecture Layer Violations

> **Flow:** All flows — this is a cross-cutting concern
> **Status:** Yellow — pattern established, bulk of files remain

## The Problem

The app architecture requires: `Components → Hooks → Services → Supabase`

But 10 files bypass the service layer and create their own Supabase clients directly:
- 8 hooks in `src/hooks/`
- 2 components in `src/components/`

This creates duplicate data-fetching logic, makes it impossible to enforce business rules in one place, and means the same Supabase queries exist in both hooks AND services.

## What's Been Fixed

### `ai-chat-sidebar.tsx` — Monolith → Thin Shell
- **Was:** 387 lines, created its own `useChat()` instance, duplicate state for textarea/files/mentions, duplicate event listeners, inline 60-line SVG
- **Now:** ~180 lines, consumes `useChatContext()` from shared ChatProvider, zero duplicate logic

### `use-ai-usage.ts` → `usage-service.ts`
- **Was:** Hook created `createBrowserClient()` and queried `ai_usage`, `profiles`, `user_credits` tables directly (duplicating what `usage-service.ts` already does)
- **Now:** Hook calls `usageService.getUsageDetails()`, service extended with `UsageDetails` type including raw counts and period dates
- 189 lines → 90 lines, zero Supabase imports in hook

## What Needs Fixing

### P1: Hooks with direct Supabase access

| Hook | Lines | What it does directly | Existing service? | Fix |
|------|-------|-----------------------|-------------------|-----|
| `use-month-closing.ts` | 287 | Full CRUD on `financial_periods` + optimistic UI | No | Create `period-service.ts`, extract queries |
| `use-activity-log.ts` | 306 | Company ID lookup (3x), realtime subscription | Yes (`activity-service.ts`) | Move company lookup to service, keep realtime in hook |
| `use-realtime.ts` | 296 | Supabase channels + presence | No | Create `realtime-service.ts` for channel setup |
| `use-financial-reports.ts` | ~200 | Queries financial reports | Yes (`reporting-service.ts`) | Delegate to service |
| `use-company-statistics.ts` | ~200 | Queries stats tables | Yes (`company-statistics-service.ts`) | Delegate to service |
| `use-dynamic-tasks.ts` | ~150 | Queries dynamic tasks | No | Create service or use event-service |
| `use-compliance.ts` | 121 | `.update()` on shareholders | Yes (`shareholder-service.ts`) | Use shareholder service |

### P2: Components with direct Supabase access

| Component | Lines | What it does directly | Fix |
|-----------|-------|-----------------------|-----|
| `deadlines-list.tsx` | ~100 | Queries `tax_calendar` table | Create hook wrapping `tax-service.ts` |
| `ne-bilaga.tsx` | 462 | Queries via `supabase.rpc()` in `useNECalculation()` | Extract to `tax-declaration-service.ts` |

### P2: Standalone functions with Supabase

| Function | File | Fix |
|----------|------|-----|
| `checkPeriodLocked()` | `use-month-closing.ts:34` | Move to period service |
| `logActivity()` | `use-activity-log.ts:244` | Already delegates to `activityService.logActivity()` but creates its own client for user/company lookup |

## Architecture Rules

```
✅ Correct                          ❌ Wrong
Component                           Component
  → Hook (React state/query)          → createBrowserClient()
    → Service (business logic)           → supabase.from('table')
      → createBrowserClient()
        → Supabase
```

**Exceptions where Supabase in hooks is acceptable:**
- Realtime subscriptions (channel setup is inherently client-side)
- Auth state listeners (`onAuthStateChange`)

## Execution Order

1. ~~`use-ai-usage.ts` → delegate to `usage-service.ts`~~ ✅ DONE
2. `use-financial-reports.ts` → delegate to `reporting-service.ts`
3. `use-company-statistics.ts` → delegate to `company-statistics-service.ts`
4. `use-compliance.ts` → use `shareholder-service.ts` for mutations
5. `use-month-closing.ts` → extract to new `period-service.ts`
6. `deadlines-list.tsx` → create hook wrapping service
7. `ne-bilaga.tsx` → extract RPC call to service
8. `use-activity-log.ts` → eliminate duplicate company lookups
9. `use-dynamic-tasks.ts` → create service or use existing
10. `use-realtime.ts` → leave as-is (realtime is acceptable in hooks)

## Files

| File | Role |
|------|------|
| `src/hooks/use-ai-usage.ts` | ✅ Fixed — delegates to usage-service |
| `src/services/usage-service.ts` | ✅ Extended with `getUsageDetails()` |
| `src/components/layout/ai-chat-sidebar.tsx` | ✅ Fixed — thin shell over ChatProvider |
| All other hooks/components listed above | Pending |
