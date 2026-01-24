# 🔧 Scope AI Refactoring Plan

> **Created:** 24 januari 2026  
> **Codebase Size:** 96,379 lines of TypeScript/TSX  
> **Goal:** Reduce file sizes, extract shared features, eliminate DRY violations

---

## 📊 Current State Analysis

### Codebase Breakdown
| Directory | Lines | % |
|-----------|------:|--:|
| src/components/ | 49,629 | 51.5% |
| src/lib/ | 21,080 | 21.9% |
| src/app/ | 7,655 | 7.9% |
| src/hooks/ | 6,570 | 6.8% |
| src/services/ | 5,402 | 5.6% |
| src/data/ | 2,512 | 2.6% |
| src/providers/ | 1,789 | 1.9% |
| src/types/ | 1,520 | 1.6% |

### Largest Files (Refactoring Targets)
| File | Lines | Issue |
|------|-------|-------|
| `data/ownership.ts` | 823 | Static data mixed with logic |
| `app/api/chat/route.ts` | 816 | Monolithic API handler |
| `lib/bookkeeping.ts` | 784 | Too many responsibilities |
| `lib/user-scoped-db.ts` | 766 | Repetitive query patterns |
| `components/ui/sidebar.tsx` | 726 | Could extract sub-components |
| `app/api/chat/agents/route.ts` | 682 | Similar to chat/route.ts |
| `components/onboarding/onboarding-wizard.tsx` | 631 | Step logic can be extracted |
| `components/bokforing/dialogs/bokforing.tsx` | 630 | Complex dialog |
| `components/ui/settings-items.tsx` | 621 | Repetitive patterns |
| `components/pages/handelser-page.tsx` | 509 | Complex view switching |

### Identified DRY Violations

1. **Page Tab Pattern** - Every page reimplements the same tab layout logic
2. **Table Pattern** - Repeated filtering, sorting, pagination logic
3. **Dialog Pattern** - Similar dialog structures across features
4. **Data Fetching** - Repeated loading/error state handling
5. **Form Pattern** - Similar form structures with validation

---

## 🎯 Phase 1: Extract Shared Page Infrastructure

**Priority:** 🔴 High  
**Impact:** ~200-300 lines saved  
**Risk:** Low

### 1.1 Create `useTabPage` Hook

**Target:** Eliminate ~50-80 lines from each page component

**New file:** `src/hooks/use-tab-page.ts`

```typescript
interface TabConfig<T extends string> {
  id: T
  label: string
  labelEnkel?: string
  color: string
  feature?: FeatureKey | null
}

interface UseTabPageOptions<T extends string> {
  tabs: TabConfig<T>[]
  defaultTab: T
  basePath: string
  filterByFeature?: boolean
}

interface UseTabPageReturn<T extends string> {
  currentTab: T
  setCurrentTab: (tab: T) => void
  availableTabs: TabConfig<T>[]
  lastUpdated: Date
}

function useTabPage<T extends string>(options: UseTabPageOptions<T>): UseTabPageReturn<T>
```

**Files to refactor:**
- [ ] `components/pages/accounting-page.tsx` (-60 lines)
- [ ] `components/pages/reports-page.tsx` (-50 lines)
- [ ] `components/pages/payroll-page.tsx` (-50 lines)
- [ ] `components/pages/parter-page.tsx` (-60 lines)

### 1.2 Create `TabPageLayout` Component

**New file:** `src/components/shared/layout/tab-page-layout.tsx`

This already partially exists as `PageTabsLayout`, but we should enhance it to include:
- TooltipProvider wrapper
- Standard container structure
- Loading states
- Error boundaries

---

## 🎯 Phase 2: Extract Table Infrastructure

**Priority:** 🔴 High  
**Impact:** ~300-400 lines saved  
**Risk:** Medium

### 2.1 Create `DataTable` Component

**New directory:** `src/components/shared/data-table/`

```
src/components/shared/data-table/
├── index.ts
├── data-table.tsx           // Main component
├── data-table-toolbar.tsx   // Filters + search + actions
├── data-table-pagination.tsx
├── data-table-empty.tsx     // Empty state
├── data-table-loading.tsx   // Loading skeleton
├── data-table-columns.tsx   // Column definition helpers
└── use-data-table.ts        // Consolidated state hook
```

**Files to refactor:**
- [ ] `bokforing/transaktioner/index.tsx`
- [ ] `bokforing/fakturor/index.tsx`
- [ ] `bokforing/kvitton/index.tsx`
- [ ] `bokforing/verifikationer/index.tsx`
- [ ] `handelser/handelser-tabell.tsx`
- [ ] `loner/payslips/payslips-table.tsx`

### 2.2 Consolidate Table Logic Hooks

**Current state:** Multiple similar hooks with repeated patterns
- `use-transactions-logic.ts`
- `use-invoices-logic.ts`
- `use-receipts-logic.ts`
- `use-verifications-logic.ts`
- `use-payslips-logic.ts`

**New approach:** Generic `useTableLogic` with domain adapters

```typescript
// Enhanced: src/hooks/use-table-logic.ts
interface UseTableLogicConfig<T> {
  fetchFn: (params: FetchParams) => Promise<T[]>
  filterConfig: FilterConfig
  sortConfig: SortConfig
  defaultSort?: { field: keyof T; direction: 'asc' | 'desc' }
}

function useTableLogic<T>(config: UseTableLogicConfig<T>) {
  // Returns: data, loading, error, filters, sorting, pagination, selection
}
```

---

## 🎯 Phase 3: Extract Dialog Infrastructure

**Priority:** 🟡 Medium  
**Impact:** ~400 lines saved  
**Risk:** Medium

### 3.1 Create Dialog Building Blocks

**New directory:** `src/components/shared/dialog/`

```
src/components/shared/dialog/
├── index.ts
├── form-dialog.tsx          // Dialog + form wrapper with submit/cancel
├── confirm-dialog.tsx       // Confirmation pattern (already exists, enhance)
├── wizard-dialog.tsx        // Multi-step wizard pattern
├── dialog-header.tsx        // Standardized header
├── dialog-form-section.tsx  // Form section with label
└── use-dialog-form.ts       // Form state + validation hook
```

### 3.2 Refactor Large Dialogs

| Dialog | Current Lines | Target Lines | Strategy |
|--------|--------------|--------------|----------|
| `bokforing/dialogs/bokforing.tsx` | 630 | ~300 | Extract form sections as components |
| `bokforing/dialogs/faktura.tsx` | 547 | ~250 | Use FormDialog base, extract line items |
| `bokforing/dialogs/verifikation.tsx` | ~400 | ~200 | Extract preview/edit mode components |
| `loner/dialogs/create-payslip.tsx` | ~350 | ~180 | Use FormDialog base |

---

## 🎯 Phase 4: Consolidate Data Layer

**Priority:** 🟡 Medium  
**Impact:** Better maintainability, easier testing  
**Risk:** Medium

### 4.1 Split `lib/bookkeeping.ts` (784 lines)

**New structure:**
```
src/lib/bookkeeping/
├── index.ts              // Re-exports all
├── accounts.ts           // Account chart operations
├── transactions.ts       // Transaction helpers
├── verification.ts       // Verification creation/validation
├── journal.ts            // Journal entry logic
├── validators.ts         // BAS validation rules
└── types.ts              // Types and interfaces
```

### 4.2 Split `lib/user-scoped-db.ts` (766 lines)

**New structure:**
```
src/lib/db/
├── index.ts
├── client.ts             // Base Supabase client setup
├── user-scope.ts         // User scoping middleware
├── queries/
│   ├── index.ts
│   ├── transactions.ts
│   ├── invoices.ts
│   ├── receipts.ts
│   ├── verifications.ts
│   ├── employees.ts
│   └── events.ts
└── types.ts
```

### 4.3 Create Query Factory Pattern

```typescript
// NEW: src/lib/db/query-factory.ts
interface QueryFactory<T> {
  list: (filters?: Partial<T>) => Promise<T[]>
  get: (id: string) => Promise<T | null>
  create: (data: Omit<T, 'id'>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
}

function createQueryFactory<T>(tableName: string): QueryFactory<T>
```

---

## 🎯 Phase 5: Component Extraction

**Priority:** 🟡 Medium  
**Impact:** ~600 lines extracted into smaller files  
**Risk:** Low

### 5.1 Split `components/ui/sidebar.tsx` (726 lines)

**New structure:**
```
src/components/ui/sidebar/
├── index.tsx             // Re-exports all
├── sidebar-context.tsx   // Provider + context + hook
├── sidebar-root.tsx      // Main container
├── sidebar-header.tsx
├── sidebar-content.tsx
├── sidebar-footer.tsx
├── sidebar-menu.tsx      // Menu container
├── sidebar-menu-item.tsx // Individual items
├── sidebar-group.tsx     // Collapsible groups
├── sidebar-separator.tsx
└── types.ts
```

### 5.2 Split `components/onboarding/onboarding-wizard.tsx` (631 lines)

**New structure:**
```
src/components/onboarding/
├── index.ts
├── onboarding-wizard.tsx    // Orchestrator (~100 lines)
├── onboarding-context.tsx   // State management
├── steps/
│   ├── index.ts
│   ├── company-type-step.tsx
│   ├── company-info-step.tsx
│   ├── tax-settings-step.tsx
│   ├── bank-integration-step.tsx
│   └── confirmation-step.tsx
├── components/
│   ├── step-indicator.tsx
│   ├── step-navigation.tsx
│   └── summary-card.tsx
└── types.ts
```

### 5.3 Split `components/pages/handelser-page.tsx` (509 lines)

**New structure:**
```
src/components/pages/handelser/
├── index.tsx                // Re-export
├── handelser-page.tsx       // Main orchestrator (~150 lines)
├── use-handelser-page.ts    // Page state hook
├── components/
│   ├── view-switcher.tsx    // View mode buttons
│   ├── year-selector.tsx    // Year dropdown
│   ├── quarter-filter.tsx   // Quarter selection
│   └── action-button.tsx    // Create action button
└── views/
    ├── folder-view.tsx      // Already exists, move here
    ├── timeline-view.tsx    // Table view
    ├── calendar-view.tsx    // Calendar view
    └── roadmap-view.tsx     // Already exists, move here
```

---

## 🎯 Phase 6: API Route Consolidation

**Priority:** 🟢 Low  
**Impact:** Better error handling, consistent responses  
**Risk:** Medium (affects API contracts)

### 6.1 Create API Route Helpers

**New file:** `src/lib/api/route-helpers.ts`

```typescript
interface ApiHandlerConfig<T> {
  auth?: boolean | 'optional'
  validate?: (body: unknown) => T
  rateLimit?: { requests: number; window: string }
}

function withApiHandler<T>(
  config: ApiHandlerConfig<T>,
  handler: (req: NextRequest, ctx: ApiContext<T>) => Promise<Response>
)

// Usage:
export const POST = withApiHandler(
  { auth: true, validate: transactionSchema },
  async (req, { user, body }) => {
    // Handler logic
  }
)
```

### 6.2 Split Large Route Handlers

| Route | Current Lines | Strategy |
|-------|--------------|----------|
| `api/chat/route.ts` | 816 | Extract tool handlers to `api/chat/tools/` |
| `api/chat/agents/route.ts` | 682 | Share infrastructure with chat route |

**New structure for chat API:**
```
src/app/api/chat/
├── route.ts              // Main handler (~200 lines)
├── tools/
│   ├── index.ts
│   ├── booking-tool.ts
│   ├── search-tool.ts
│   ├── report-tool.ts
│   └── ...
├── utils/
│   ├── message-parser.ts
│   ├── context-builder.ts
│   └── response-formatter.ts
└── agents/
    └── route.ts          // Uses shared tools
```

---

## 🎯 Phase 7: Type & Constant Consolidation

**Priority:** 🟢 Low (Quick Wins)  
**Impact:** Better organization, easier imports  
**Risk:** Very Low

### 7.1 Consolidate Status Constants

**New structure:**
```
src/lib/constants/
├── index.ts
├── status.ts        // All status enums/constants
├── icons.ts         // Icon mappings by type
├── colors.ts        // Color mappings (status → color)
└── labels.ts        // Swedish label mappings
```

### 7.2 Consolidate Tab Configurations

**New file:** `src/config/tabs.ts`

Move all tab configurations from individual pages to a central location:

```typescript
export const tabConfigs = {
  bokforing: [
    { id: 'transaktioner', label: 'Transaktioner', ... },
    { id: 'fakturor', label: 'Fakturor', ... },
    // ...
  ],
  rapporter: [...],
  loner: [...],
  agare: [...],
} as const
```

### 7.3 Consolidate Feature Key Checks

Currently `hasFeature()` is called inline everywhere. Create utility components:

```typescript
// NEW: src/components/shared/feature-gate.tsx
<FeatureGate feature="k10">
  <K10Tab />
</FeatureGate>

<FeatureGate feature="aktiebok" fallback={<UpgradePrompt />}>
  <AktiebokContent />
</FeatureGate>
```

---

## 📋 Implementation Schedule

### Week 1: Foundation (High Impact, Low Risk)

| Day | Task | Files | Est. Time |
|-----|------|-------|-----------|
| 1 | Create `useTabPage` hook | 1 new file | 2h |
| 1 | Refactor `accounting-page.tsx` | 1 file | 1h |
| 2 | Refactor remaining 3 pages | 3 files | 3h |
| 3 | Create `DataTable` base component | 4 new files | 4h |
| 4 | Create table toolbar component | 1 file | 2h |
| 5 | Refactor `TransactionsTable` to use DataTable | 1 file | 3h |

### Week 2: Tables & Dialogs

| Day | Task | Files | Est. Time |
|-----|------|-------|-----------|
| 1-2 | Refactor remaining tables to use DataTable | 5 files | 6h |
| 3 | Create `FormDialog` component | 2 files | 3h |
| 4 | Refactor `bokforing.tsx` dialog | 1 file | 3h |
| 5 | Refactor `faktura.tsx` dialog | 1 file | 3h |

### Week 3: Data Layer & Components

| Day | Task | Files | Est. Time |
|-----|------|-------|-----------|
| 1 | Split `bookkeeping.ts` | 1 → 6 files | 4h |
| 2 | Split `user-scoped-db.ts` | 1 → 8 files | 4h |
| 3 | Split `sidebar.tsx` | 1 → 10 files | 4h |
| 4 | Split `onboarding-wizard.tsx` | 1 → 8 files | 4h |
| 5 | Split `handelser-page.tsx` | 1 → 6 files | 3h |

---

## 📊 Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg page component size | 400 lines | 150 lines | -62% |
| Avg dialog size | 500 lines | 200 lines | -60% |
| Duplicate table logic | 6 copies | 1 shared | -83% |
| Files > 500 lines | 15 | 5 | -67% |
| Total LOC (estimated) | 96,379 | ~85,000 | -12% |
| Test coverage potential | Low | High | Smaller units = easier testing |

---

## ✅ Checklist

### Phase 1: Page Infrastructure
- [ ] Create `useTabPage` hook
- [ ] Refactor `accounting-page.tsx`
- [ ] Refactor `reports-page.tsx`
- [ ] Refactor `payroll-page.tsx`
- [ ] Refactor `parter-page.tsx`

### Phase 2: Table Infrastructure
- [ ] Create `DataTable` component
- [ ] Create `DataTableToolbar` component
- [ ] Create `useTableLogic` hook
- [ ] Refactor `TransactionsTable`
- [ ] Refactor `InvoicesTable`
- [ ] Refactor `ReceiptsTable`
- [ ] Refactor `VerifikationerTable`
- [ ] Refactor `EventsTable`

### Phase 3: Dialog Infrastructure
- [ ] Create `FormDialog` component
- [ ] Create `WizardDialog` component
- [ ] Refactor `bokforing.tsx` dialog
- [ ] Refactor `faktura.tsx` dialog
- [ ] Refactor other large dialogs

### Phase 4: Data Layer
- [ ] Split `bookkeeping.ts`
- [ ] Split `user-scoped-db.ts`
- [ ] Create query factory pattern

### Phase 5: Component Extraction
- [ ] Split `sidebar.tsx`
- [ ] Split `onboarding-wizard.tsx`
- [ ] Split `handelser-page.tsx`

### Phase 6: API Routes
- [ ] Create API route helpers
- [ ] Split `chat/route.ts`
- [ ] Split `chat/agents/route.ts`

### Phase 7: Constants
- [ ] Consolidate status constants
- [ ] Consolidate tab configurations
- [ ] Create `FeatureGate` component

---

## 🚀 Getting Started

**Recommended first step:** Phase 1.1 - Create the `useTabPage` hook

This provides:
1. Immediate wins across all 4 main pages
2. Low risk (additive change)
3. Clear pattern for future refactoring
4. Easy to test and validate

Run this command to start:
```bash
touch src/hooks/use-tab-page.ts
```
