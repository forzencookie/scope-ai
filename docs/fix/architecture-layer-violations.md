# Fix: Architecture Layer Violations

> **Flow:** All flows — this is a cross-cutting concern
> **Status:** ✅ Green — 1 deferred (`use-month-closing.ts`)

## The Rule

```
✅ Correct                          ❌ Wrong
Component                           Component
  → Hook (React state/query)          → createBrowserClient()
    → Service (business logic)           → supabase.from('table')
      → createBrowserClient()
        → Supabase
```

**Exceptions:** Realtime subscriptions and auth state listeners are acceptable in hooks.

## Fixed

| File | What Changed |
|------|-------------|
| `ai-chat-sidebar.tsx` | 387 → ~180 lines, consumes `useChatContext()` from ChatProvider |
| `use-ai-usage.ts` | Delegates to `usageService.getUsageDetails()`, zero Supabase imports |
| `use-activity-log.ts` | Removed 4 redundant company ID lookups, uses `useCompany()` context instead |
| `use-financial-reports.ts` | Added `accountService.getBalancesForPeriod()`, hook delegates to service |
| `use-company-statistics.ts` | Added `companyStatisticsService.getDashboardData()`, hook delegates to service |
| `use-dynamic-tasks.ts` | Added `invoiceService.getDraftCount/getOverdueCount()` + `payrollService.getPendingPayslipCount()` |
| `deadlines-list.tsx` | Created `taxCalendarService.getPendingDeadlines()`, component delegates to service |

## Deferred

| Hook | Why |
|------|-----|
| `use-month-closing.ts` | 287 lines, full CRUD on `financial_periods`. Largest refactor — defer until period service is needed for other features. |

## Not violations (removed from list)

| File | Why |
|------|-----|
| `ne-bilaga.tsx` | Does not exist in codebase |
| `use-realtime.ts` | Realtime is a valid exception |
| `use-compliance.ts` | Uses `shareholderService` + `boardService` correctly |
