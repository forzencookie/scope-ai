# Architecture Audit — Full Codebase Balance Report

> **Date:** 2026-03-21
> **Scope:** Every `.ts`/`.tsx` file across `src/app`, `src/components`, `src/providers`, `src/hooks`, `src/services`, `src/lib`, `src/data`, `src/types`, `scripts/`, `supabase/`
> **Stats:** 270 files, 111,313 lines of TypeScript

---

## Executive Summary

The codebase has strong foundations — zero `as any` in production code, good bookkeeping engine, proper dual-service pattern started — but **the layers are leaking into each other**. Business logic lives in API routes, hooks query the database directly, providers contain domain rules, types files export functions, and three different files define Swedish tax rates. The app needs **layer discipline**, not a rewrite.

**The core problem:** Code does the right thing, but in the wrong place.

---

## The 7 Systemic Issues

### 1. API Routes Contain Business Logic (Should Be Thin)

API routes should do 3 things: authenticate, call a service, return the result. Instead, many routes are mini-applications.

| Route | Lines | What's Inline That Shouldn't Be |
|-------|-------|---------------------------------|
| `api/chat/route.ts` | 438 | Context building, activity snapshots, memory injection, company type parsing |
| `api/invoices/route.ts` | 165 | Invoice numbering, VAT calculation, OCR generation |
| `api/payroll/payslips/route.ts` | 138 | Tax rate math, employer contribution calc, pending booking creation |
| `api/manadsavslut/route.ts` | 80+ | Fiscal month calculation, financial summaries |
| `api/monthly-review/route.ts` | 366 | Status variant maps, verification/invoice queries |
| `api/onboarding/status/route.ts` | 142 | Read-modify-write onboarding state |
| `api/transactions/route.ts` | 107 | `formatTransaction()` helper defined inline |

**Helper functions defined inside API routes:**
- `extractMessageContent()` — `api/chat/route.ts`
- `parseCompanyType()` — `api/chat/route.ts`
- `fetchActivitySnapshot()` — `api/chat/route.ts`
- `fetchRelevantMemories()` — `api/chat/route.ts`
- `formatTransaction()` — `api/transactions/route.ts`
- `getFiscalMonths()` — `api/manadsavslut/route.ts`

**Inline types defined in API routes:**
- `MonthlySummary`, `Section`, `ActivitySection` — `api/manadsavslut/route.ts`
- Response type interfaces — `api/monthly-review/route.ts`
- Complex item types — `api/verifikationer/auto/route.ts`

**Fix:** Each route should be max ~30 lines: auth check → service call → response. Extract all helpers to services, all types to `src/types/`.

---

### 2. Hooks Bypass the Service Layer

Multiple hooks call Supabase directly or fetch from API endpoints, bypassing the service layer entirely.

| Hook | Lines | Violation |
|------|-------|-----------|
| `use-transactions-query.ts` | 464 | 9 exported hooks + period lock logic + UI selection state in one file |
| `use-activity-log.ts` | 306 | Direct `supabase.from('companies')` + inline realtime subscriptions |
| `use-financial-reports.ts` | 181 | Direct `supabase.rpc()` calls + comparative data merging |
| `use-dynamic-tasks.ts` | 298 | Direct Supabase queries + VAT deadline calculations + fiscal year logic |
| `use-verifications.ts` | 89 | Direct `fetch('/api/verifications')` + dynamic service import |
| `use-account-balances.ts` | 178 | Complex debit/credit aggregation from raw verification data |
| `use-compliance.ts` | 121 | Direct `supabase.from('shareholders').update()` |
| `use-normalized-balances.ts` | 92 | Balance normalization logic (pure function exported from hook file) |
| `use-cached-query.ts` | 235 | **Reinvents React Query** — app already has React Query |

**Duplicated logic across hooks:**
- **Period lock checking** — `use-verifications.ts` AND `use-transactions-query.ts`
- **Account balance aggregation** — `use-account-balances.ts` AND `use-financial-reports.ts`
- **Company ID retrieval** — `use-activity-log.ts` (Supabase query) AND `use-conversations.ts` (localStorage parse)
- **Realtime subscriptions** — `use-activity-log.ts` (custom) AND `use-realtime.ts` (shared hook, unused by activity)

**Fix:** Hooks should call services, never Supabase. Delete `use-cached-query.ts` and use React Query everywhere. Split `use-transactions-query.ts` into 4-5 focused hooks.

---

### 3. Providers Do Too Much

Providers should hold state and expose it via context. Instead, they contain business rules, fetch data, and wire up window events.

| Provider | Lines | What's Wrong |
|----------|-------|-------------|
| `company-provider.tsx` | 345 | Feature flag logic (`hasMomsRegistration`, `hasEmployees` checks), direct service calls (`getMyCompany()`), DB fallback logic |
| `chat-provider.tsx` | 270 | Input state (textarea, mentions, files), 4 window event listeners, credit checking, action trigger meta prepending |
| `ai-overlay-provider.tsx` | 325 | 8 pieces of state, 6 custom event listeners, activity logging in `closeWalkthrough()`, navigation dispatch in `accept()` |

**Window event spaghetti:**
- `chat-provider.tsx` listens to: `AI_CHAT_EVENT`, `load-conversation`, `ai-chat-new-conversation`, `ai-chat-focus-input`
- `ai-overlay-provider.tsx` listens to: `ai-dialog-start`, `ai-dialog-complete`, `ai-dialog-error`, `ai-dialog-hide`, `ai-dialog-walkthrough`, `ai-dialog-walkthrough-blocks`

**Fix:**
- Move feature flag logic to `lib/features/` as pure functions
- Move chat input state to a `useChatInput()` hook
- Replace window events with explicit callbacks or a lightweight event bus
- Keep providers focused on context state only

---

### 4. Components Fetch Data Directly

Components should receive data via props or hooks (that call services). Some components call APIs directly.

| Component | Lines | Violation |
|-----------|-------|-----------|
| `installningar/settings-overlay.tsx` | 240 | `fetch('/api/user/profile')` in useEffect, `.catch(() => {})` silent swallow |
| `installningar/tabs/company-tab.tsx` | 404 | `fetch('/api/company/logo')` + `fetch('/api/sie/export')` + DOM blob download |
| `bokforing/fakturor/use-invoices-logic.ts` | 196 | 4 separate `fetch()` calls for invoice operations |
| `rapporter/agi/use-employer-declaration.ts` | 334 | `fetch('/api/payroll/payslips')` + age-based tax calculations inline |
| `landing/sections/app-demo-showcase.tsx` | 981 | Monolithic demo (acceptable — not production UI) |
| `ai/chat-input.tsx` | 579 | Large but well-structured (audio + file handling justified) |

**Fix:** Create service wrappers for all API calls. Components call hooks, hooks call services, services call APIs.

---

### 5. Services Layer Has Structural Problems

#### 5a. Flat folder with 50 files — no domain grouping
```
src/services/
├── account-service.ts
├── accrual-service.ts
├── activity-service.ts
├── ai-audit-service.ts
├── benefit-service.ts
├── board-service.ts
├── ... (44 more files)
```

#### 5b. Missing `.server.ts` variants for write operations
The dual-service pattern (`company-service.ts` + `company-service.server.ts`) is correct but only applied to 2 services. These services do write operations with browser client:
- `payroll-service.ts` — employee creation
- `benefit-service.ts` — benefit assignment
- `closing-entry-service.ts` — journal entries
- `accrual-service.ts` — accrual entries
- `correction-service.ts` — correction entries
- `inventarie-service.ts` — asset management

#### 5c. Monolithic services mixing domains
- `tax-service.ts` — tax rates + VAT rates + tax calendar in one file
- `vat-service.ts` — declarations + stats + RPC calculation
- `tax-declaration-service.ts` — 4 different tax forms (inkomstdeklaration, NE bilaga, årsbokslut, årsredovisning)
- `tax-calculation-service.ts` — duplicates logic from `tax-service.ts`

#### 5d. Three different tax rate sources
1. `tax-service.ts` — fetches from `system_parameters` table
2. `lib/swedish-tax-rules.ts` — hardcoded constants
3. `services/processors/tax/` — yet another implementation

#### 5e. Business logic in `lib/` that belongs in services
- `lib/formaner.ts` — has `listAvailableBenefits()`, `assignBenefit()`, `getEmployeeBenefits()` with direct Supabase calls
- `lib/ai-suggestion.ts` — fetches from `/api/chat/booking`, parses AI responses

#### 5f. Inconsistent error handling
Three patterns used randomly across services:
- `if (error) { console.error(...); return [] }` — silent return
- `if (error) throw error` — throws
- `if (error) return null` — nullable return

**Fix:** Group services by domain. Create `.server.ts` for all write services. Consolidate tax rates to single source. Move DB operations out of `lib/`. Pick one error handling pattern.

---

### 6. Types Layer Contains Logic and Duplicates

| File | Lines | Issue |
|------|-------|-------|
| `types/index.ts` | 406 | Monolithic barrel that also **defines** types + exports `toFullTransaction()` function |
| `types/events.ts` | 236 | UI metadata (colors, icons) mixed with type definitions |
| `types/ownership.ts` | 331 | Contains `calculateEgenavgifter()` business logic function |
| `types/withdrawal.ts` | 50 | Contains `TYPE_CONFIG` UI metadata + `getPartnerAccounts()` business logic |
| `types/meeting.ts` | 40 | **Duplicate** of `types/board-meeting.ts` (29 lines) |
| `types/database.ts` | 3,053 | Auto-generated Supabase types (expected size, but should be in `types/generated/`) |

**Fix:** Split `index.ts` by domain. Move all functions out of types files. Move UI metadata to components. Delete duplicate `meeting.ts`.

---

### 7. Data Files and Scripts Have Violations

| File | Issue |
|------|-------|
| `data/page-contexts.ts` (833 lines) | Types + UI metadata + page definitions in one file |
| `data/accounts.ts` (541 lines) | Entire BAS chart in one file |
| `data/navigation.ts` | Dead code — single-line re-export |
| `scripts/generate-world-map-svg.ts` | `@ts-nocheck` — **zero tolerance violation** |
| `scripts/generate-tool-manifest.ts` | `(global as any).window` — **zero tolerance violation** |
| `scripts/create-pro-user.ts` | Hardcoded credentials (`testpro@scope.ai` / `ScopeAI_Pro2026!`) |
| `scripts/create-admin-pro-user.ts` | Same hardcoded credentials |

---

## Page Components Needing Extraction

| Page | Lines | Extract To |
|------|-------|-----------|
| `app/page.tsx` | 389 | `TypewriterHeroText` → `components/landing/`, `WaitlistForm` → `components/landing/` |
| `app/logga-in/page.tsx` | 295 | Auth logic → `useLoginForm()` hook, OAuth → `useOAuth()` hook |
| `app/dashboard/layout.tsx` | 150 | Sidebar state → `SidebarProvider`, onboarding check → `useOnboardingGuard()` |
| `app/onboarding/page.tsx` | 48 | Direct fetch → `useOnboarding()` hook |
| `app/users/page.tsx` | 447 | Admin page — audit for service layer usage |

---

## Missing Services That Should Exist

| Service | Currently Lives In | Should Be |
|---------|--------------------|-----------|
| `onboardingService` | Inline in `api/onboarding/status/route.ts` | `services/onboarding-service.ts` |
| `activitySnapshotService` | Inline in `api/chat/route.ts` | `services/activity-snapshot-service.ts` |
| `memoryService` (chat) | Inline in `api/chat/route.ts` | `services/chat-memory-service.ts` |
| `invoiceCalculationService` | Inline in `api/invoices/route.ts` | Part of `services/invoice-service.ts` |
| `fiscalCalendarService` | Inline in `api/manadsavslut/route.ts` | `services/fiscal-calendar-service.ts` |
| `periodLockService` | Duplicated in 2 hooks | `services/period-lock-service.ts` |

---

## Recommended Target Architecture

### Service Layer (Domain-Grouped)
```
src/services/
├── accounting/
│   ├── account-service.ts
│   ├── verification-service.ts
│   ├── invoice-service.ts
│   ├── invoice-service.server.ts
│   ├── transaction-service.ts        (rename from transactions.ts)
│   ├── reporting-service.ts
│   ├── closing-entry-service.server.ts
│   ├── accrual-service.server.ts
│   ├── correction-service.server.ts
│   └── period-lock-service.ts        (new — consolidate from hooks)
├── tax/
│   ├── tax-rates-service.ts          (split from tax-service)
│   ├── tax-calendar-service.ts       (split from tax-service)
│   ├── vat-declaration-service.ts    (split from vat-service)
│   ├── vat-calculation-service.ts    (split from vat-service)
│   ├── income-declaration-service.ts (split from tax-declaration-service)
│   ├── ne-appendix-service.ts        (split from tax-declaration-service)
│   ├── annual-closing-service.ts     (split from tax-declaration-service)
│   └── annual-report-service.ts      (split from tax-declaration-service)
├── payroll/
│   ├── payroll-service.ts
│   ├── payroll-service.server.ts     (new)
│   ├── benefit-service.ts
│   └── benefit-service.server.ts     (new)
├── corporate/
│   ├── shareholder-service.ts
│   ├── shareholder-service.server.ts (new — move from use-compliance.ts)
│   └── board-service.ts
├── user/
│   ├── settings-service.ts
│   ├── settings-service.server.ts
│   ├── onboarding-service.ts         (new)
│   └── user-memory-service.ts
├── company/
│   ├── company-service.ts
│   ├── company-service.server.ts
│   ├── company-statistics-service.ts
│   └── fiscal-calendar-service.ts    (new)
├── chat/
│   ├── chat-context-service.ts       (new — from api/chat/route.ts)
│   ├── activity-snapshot-service.ts  (new — from api/chat/route.ts)
│   └── chat-memory-service.ts        (new — from api/chat/route.ts)
├── events/
│   ├── event-service.ts
│   ├── activity-service.ts
│   └── roadmap-service.ts
├── assets/
│   ├── inventarie-service.ts
│   ├── inventarie-service.server.ts  (new)
│   └── receipt-service.ts
├── processors/                       (keep as-is — well organized)
│   ├── tax/
│   ├── vat/
│   ├── invoice-processor.ts
│   └── transaction-processor.ts
└── shared/
    ├── error-handling.ts             (new — unified error pattern)
    └── mappers/                      (new — shared row mappers)
```

### Hooks Layer (Split Monoliths)
```
src/hooks/
├── use-transactions.ts               (from use-transactions-query.ts)
├── use-transactions-paginated.ts      (from use-transactions-query.ts)
├── use-transaction-stats.ts           (from use-transactions-query.ts)
├── use-activity-log.ts                (simplified — calls service, uses useRealtime)
├── use-financial-reports.ts           (simplified — calls reportingService)
├── use-account-balances.ts            (simplified — calls accountService)
├── use-dynamic-tasks.ts              (simplified — calls taskService)
├── use-chat-input.ts                  (new — extracted from chat-provider)
├── use-onboarding.ts                  (new — extracted from page + provider)
├── use-login-form.ts                  (new — extracted from logga-in/page.tsx)
├── DELETE: use-cached-query.ts        (replaced by React Query useQuery)
└── ... (keep clean hooks as-is)
```

### Lib Layer (Remove DB Operations)
```
src/lib/
├── bookkeeping/                       (keep as-is — well organized)
├── tax/
│   ├── vat-deadline-calculator.ts     (new — from use-dynamic-tasks.ts)
│   └── employer-contribution.ts       (new — from use-employer-declaration.ts)
├── accounting/
│   ├── balance-normalizer.ts          (from use-normalized-balances.ts)
│   └── partner-accounts.ts            (from types/withdrawal.ts)
├── features/
│   └── feature-flags.ts              (from company-provider.tsx)
├── MOVE: formaner.ts DB calls → services/payroll/benefit-service.ts
├── MOVE: ai-suggestion.ts → services/ or delete if unused
└── ... (keep pure utility files as-is)
```

---

## Execution Priority

### Phase 1: Stop the Bleeding (Layer Violations)
1. Move all helper functions out of API routes → services
2. Move all direct Supabase calls out of hooks → services
3. Move business logic out of providers → lib/features + services
4. Delete `use-cached-query.ts` → migrate to React Query
5. Move `formaner.ts` DB ops → benefit-service
6. Fix zero-tolerance violations in scripts

### Phase 2: Split Monoliths
7. Split `use-transactions-query.ts` → 4 focused hooks
8. Split `tax-declaration-service.ts` → 4 domain services
9. Split `tax-service.ts` → rates + calendar
10. Split `types/index.ts` → domain files
11. Extract inline components from `page.tsx` and `logga-in/page.tsx`

### Phase 3: Structural Reorganization
12. Group services into domain folders
13. Create `.server.ts` variants for all write services
14. Consolidate tax rate sources to single source of truth
15. Standardize error handling across all services
16. Replace window event spaghetti with proper event bus or callbacks

### Phase 4: Cleanup
17. Delete duplicate `types/meeting.ts`
18. Delete dead `data/navigation.ts`
19. Move UI metadata out of types files
20. Move generated `database.ts` to `types/generated/`
21. Environment-variable hardcoded credentials in scripts

---

## What's Already Good

- **Bookkeeping engine** (`lib/bookkeeping/`) — well-organized, types + validation + entries separated
- **Processor services** (`services/processors/`) — pure transformation, no DB access, domain-grouped
- **Dual-service pattern** (company + settings) — correct approach, just needs replication
- **Clean hooks** — `use-auth.ts`, `use-subscription.ts`, `use-invoices.ts`, `use-employees.ts`, `use-realtime.ts`
- **Zero tolerance** — no `as any` in production code, no `@ts-ignore`, no `eslint-disable` (only in 2 scripts)
- **Component quality** — `walkthrough-overlay.tsx`, `page-overlay.tsx`, `main-content-area.tsx` are clean
- **AI tools** — well-organized by domain in `lib/ai-tools/`
- **No React in services** — services are stateless and framework-agnostic
