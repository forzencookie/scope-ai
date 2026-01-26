# 🔧 Scope AI Refactoring Plan

> **Created:** 24 januari 2026  
> **Revised:** 26 januari 2026 (Architectural Review)  
> **Codebase Size:** ~102,500 lines of TypeScript/TSX  
> **Philosophy:** Composition over abstraction - don't over-engineer

---

## 📊 Architectural Assessment

### ✅ What's Already Well-Designed

| Pattern | Location | Assessment |
|---------|----------|------------|
| **Page Tab Pattern** | All 5 page components | ✅ Clean, ~100 lines each, uses `PageTabsLayout` |
| **Table Pattern** | `GridTable` → domain grids → feature components | ✅ Excellent composition, not DRY violation |
| **Shared Hooks** | `use-table.ts` (filter/sort/data) | ✅ Generic, reusable |
| **Lazy Loading** | `lazy-loader.tsx` | ✅ Centralized, consistent |
| **UI Primitives** | `sidebar.tsx` (shadcn/ui) | ✅ Standard library pattern |

### Why We're NOT Creating These:

| Rejected Idea | Reason |
|---------------|--------|
| `useTabPage` hook | Current pattern is 20-30 lines per page - readable, flexible, not a real DRY violation |
| `DataTable` abstraction | Would fight against the excellent composition pattern already in place |
| Splitting `sidebar.tsx` (UI) | It's a shadcn/ui primitives file - meant to be monolithic |

---

## 🎯 Actual Refactoring Targets

### Priority 1: `sidebar-nav.tsx` (565 lines) ⚠️

**Problem:** Application sidebar navigation has grown organically with:
- `NavSection` - simple nav section
- `NavCollapsibleSection` - collapsible with localStorage
- `NavSettings` - settings section  
- `NavAIConversations` - AI chat history (150+ lines with pixel art dog!)
- `NavUser` - user dropdown with theme switcher

**Action:** Split into focused files:
```
src/components/layout/sidebar/
├── index.ts
├── nav-section.tsx           (~60 lines)
├── nav-collapsible.tsx       (~80 lines)
├── nav-settings.tsx          (~50 lines)
├── nav-ai-conversations.tsx  (~150 lines)
├── nav-user.tsx              (~100 lines)
└── pixel-dog.tsx             (~40 lines - the cute dog deserves its own file!)
```

**Benefit:** Each section is testable, maintainable, and can be understood in isolation.

---

### Priority 2: `onboarding-wizard.tsx` (627 lines) ⚠️

**Problem:** Single file with:
- Step configuration (100+ lines of objects)
- Main wizard orchestrator
- Individual step renderers inline
- Form handling for each step

**Action:** Extract step renderers:
```
src/components/onboarding/
├── onboarding-wizard.tsx     (orchestrator, ~150 lines)
├── steps/
│   ├── welcome-step.tsx
│   ├── company-type-step.tsx
│   ├── share-structure-step.tsx
│   ├── shareholders-step.tsx
│   └── ...
├── step-config.ts            (step definitions)
└── types.ts
```

---

### Priority 3: `settings-items.tsx` (620 lines) ⚠️

**Assessment:** Actually well-designed! It's a collection of reusable settings UI components:
- `SettingsPageHeader`
- `SettingsFormField`
- `SettingsToggle`
- `SettingsDeviceCard`
- etc.

**Action:** ✅ Leave as-is - this is a UI component library file, similar to shadcn pattern.

---

### Priority 4: Large API Routes

| File | Lines | Action |
|------|-------|--------|
| `chat/route.ts` | 891 | Consider extracting tool handlers if it grows more |
| `chat/agents/route.ts` | 682 | Shares patterns with chat route - could share utilities |

**Action:** Monitor, but not urgent. API routes are appropriately complex for their functionality.

---

## 📋 Revised Implementation Plan

### Week 1: Sidebar Navigation Split

| Task | Est. Time |
|------|-----------|
| Create `sidebar/` directory structure | 30m |
| Extract `NavSection` | 30m |
| Extract `NavCollapsibleSection` | 30m |
| Extract `NavSettings` | 20m |
| Extract `NavAIConversations` + pixel dog | 45m |
| Extract `NavUser` | 30m |
| Update imports, verify everything works | 30m |

### Week 2: Onboarding Wizard Split

| Task | Est. Time |
|------|-----------|
| Create step configuration file | 30m |
| Extract each step component (8-10 steps) | 2h |
| Refactor wizard to use extracted steps | 1h |
| Test complete flow | 30m |

---

## 📊 Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| `sidebar-nav.tsx` | 565 lines | ~50 lines (index + imports) |
| `onboarding-wizard.tsx` | 627 lines | ~150 lines (orchestrator) |
| Files > 500 lines (app code) | 4 | 2 |
| Testability | Medium | High (isolated components) |

---

## ❌ What We're NOT Doing

1. **Creating abstract "god" components** that try to handle every case
2. **Reducing line count for its own sake** - some files are big because they should be
3. **Fighting against composition patterns** that are already working
4. **Touching shadcn/ui files** - they follow their own conventions

---

## ✅ Checklist

### Phase 1: Sidebar Split
- [ ] Create `src/components/layout/sidebar/` directory
- [ ] Extract `NavSection`
- [ ] Extract `NavCollapsibleSection`
- [ ] Extract `NavSettings`
- [ ] Extract `NavAIConversations`
- [ ] Extract `NavUser`
- [ ] Create barrel export `index.ts`
- [ ] Update `app-sidebar.tsx` imports
- [ ] Verify build passes
- [ ] Test all navigation functionality

### Phase 2: Onboarding Split
- [ ] Create `src/components/onboarding/steps/` directory
- [ ] Extract step config to separate file
- [ ] Extract each step component
- [ ] Refactor wizard orchestrator
- [ ] Test complete onboarding flow

---

*This plan focuses on genuine improvements, not arbitrary line-count reduction.*

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
