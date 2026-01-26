# 🔍 Comprehensive Codebase Analysis Report

> **Generated:** January 25, 2026  
> **Scope:** Full component architecture, DRY violations, and improvement opportunities

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Components** | 332 files |
| **Total Lines** | ~45,563 lines |
| **Large Files (>400 lines)** | 13 files |
| **Medium Files (200-400)** | 55 files |
| **Small Files (<200)** | 264 files |
| **DRY Violations Identified** | 35+ patterns |
| **Shared Components Available** | 50+ |

---

## 📊 Category Breakdown

| Category | Lines | Files | Grade | Priority |
|----------|-------|-------|-------|----------|
| **UI** | 7,080 | 52 | A- | Low |
| **Bokföring** | 6,685 | ~41 | B- | High |
| **Ägare** | 6,520 | 60 | B | High |
| **AI** | 6,491 | ~25 | B+ | Medium |
| **Löner** | 4,475 | 47 | B- | Medium |
| **Rapporter** | 4,459 | 28 | B- | High |
| **Landing** | 3,754 | ~20 | B+ | Low |
| **Shared** | 2,106 | 13 | A | N/A |
| **Layout** | 1,856 | ~8 | B+ | Medium |
| **Inställningar** | 1,209 | 14 | B+ | Low |
| **Händelser** | 670 | 14 | B | Medium |
| **Parter** | 258 | ~5 | B+ | Low |

---

## 📁 Category: BOKFÖRING (Bookkeeping)

### Grade: B- (74/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| TransactionsTable | 166 | Good separation, uses custom logic hook | B+ |
| UnifiedInvoicesView | 275 | Well-structured with Kanban view | B+ |
| ReceiptsTable | 176 | Good, uses logic hook | B+ |
| VerifikationerTable | 139 | Clean implementation | A- |
| InventarierTable | 125 | Compact and focused | A- |
| BookingDialog | 626 | ⚠️ **TOO LARGE** - Multi-step wizard | C |
| InvoiceCreateDialog | 547 | ⚠️ **TOO LARGE** - Form + Preview | C+ |
| SupplierInvoiceDialog | 484 | ⚠️ **TOO LARGE** - Duplicates patterns | C+ |
| UnderlagDialog | 454 | ⚠️ **TOO LARGE** - AI + Form | C+ |
| VerifikationDialog | 354 | Medium complexity | B |
| NyTransaktionDialog | 289 | Acceptable size | B+ |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Stats Card Grid | 5x | ~150 lines |
| Grid Table Pattern | 4x | ~200 lines |
| Page Header Pattern | 6x | ~100 lines |
| Pagination Footer | 3x | ~60 lines |
| Logic Hook Pattern | 5x | ~300 lines |
| AI Upload Tab Pattern | 2x | ~100 lines |

### Improvement Opportunities

1. **Extract `<StatCard>` usage** - Already exists in `ui/stat-card.tsx` but pattern not consistent
2. **Create `<DataGrid>` abstraction** - Unify TransactionsTableGrid, ReceiptsGrid, VerifikationerGrid
3. **Split large dialogs** - BookingDialog → 3 components, InvoiceCreateDialog → 2 components
4. **Create `useDocumentLogic` base hook** - Template for all domain logic hooks
5. **Extract `<PaginationFooter>`** - Shared pagination UI

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  accounting-page.tsx (PageTabsLayout)                                       │
│    ├─ transaktioner → TransactionsTable → useTransactionsLogic              │
│    ├─ fakturor → UnifiedInvoicesView → useInvoicesLogic                     │
│    ├─ kvitton → ReceiptsTable → useReceiptsLogic                            │
│    ├─ bokslut → MonthClosing                                                │
│    └─ inventarier → InventarierTable → useInventarierLogic                  │
│                         ↓                                                   │
│               [Dialogs: BookingDialog, InvoiceDialog, etc.]                 │
│                         ↓                                                   │
│               [Shared: GridTable, StatCard, BulkActionToolbar]              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Category: ÄGARE (Owners)

### Grade: B (78/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| Aktiebok | 198 | Good modular structure | B+ |
| Delägare | 521 (folder) | Well-organized subcomponents | B+ |
| Utdelning | 513 (folder) | Clean structure | B+ |
| Årsmöte | 299 | ⚠️ Contains too much logic | B- |
| Bolagsstämma | 140 | Good separation | A- |
| Styrelseprotokoll | 248 | Could extract filter bar | B |
| Medlemsregister | 272 | ⚠️ Inline table rendering | B- |
| Firmatecknare | 228 | Acceptable complexity | B |
| Myndigheter | 204 | Mostly static config | B+ |
| ActionWizard | 159 | Well-architected wizard | A- |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Page Header | 8x | ~120 lines |
| Document-to-Meeting Mapping | 5x | ~150 lines |
| Status Filter Dropdown | 4x | ~80 lines |
| Empty State Cards | 4x | ~60 lines |
| Row Action Dropdowns | 6x | ~90 lines |

### Improvement Opportunities

1. **Create `<PageHeader>`** - 8 duplicates → 1 component
2. **Extract `useMeetingDocuments<T>` hook** - Generic document parsing
3. **Create `<StatusFilterDropdown>`** - Reusable filter component
4. **Create `<EmptyState>`** - Standardize empty states
5. **Create `<EntityActionMenu>`** - Unify row/card actions

---

## 📁 Category: LÖNER (Payroll)

### Grade: B- (73/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| LönesbeskContent | 227 | Acceptable page component | B |
| BenefitsTab | 181 | Well-structured | B+ |
| TeamTab | 104 | Clean and focused | A- |
| Egenavgifter | 46 | Good delegation | A- |
| Delägaruttag | 134 | Clean structure | B+ |
| CreatePayslipDialog | 132 | Multi-step wizard | B |
| VehicleForm | 236 | ⚠️ Contains two forms | C+ |
| AllowanceForm | 68 | Repetitive pattern | C+ |
| MealForm, HousingForm, etc. | ~400 total | ⚠️ **7 similar forms** | C |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Form Input Pattern | 7x | ~400 lines |
| Currency Input with Suffix | 15x | ~150 lines |
| Employee Fetch Logic | 3x | ~60 lines |
| Förmånsvärde Preview Box | 5x | ~50 lines |
| Dialog Pattern | 6x | ~100 lines |

### Improvement Opportunities

1. **Create `<FormField>` variants** - Already exists in `ui/form-field.tsx` but underused
2. **Create `<BenefitValuePreview>`** - Shared preview component
3. **Create `useEmployeeList()` hook** - Centralize employee fetching
4. **Split VehicleForm** - 236 lines → 2 × ~90 lines
5. **Create `useBenefitForm()` hook** - Generic benefit form state

---

## 📁 Category: RAPPORTER (Reports)

### Grade: B- (72/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| Resultaträkning | 85 | Clean and focused | A |
| Balansräkning | 121 | Good structure | A- |
| Årsredovisning | 208 | Medium complexity | B |
| Årsbokslut | 242 | Business logic mixed with UI | B- |
| Inkomstdeklaration | 362 | ⚠️ Too many responsibilities | C+ |
| NE-bilaga | 357 | ⚠️ Duplicates inkomstdeklaration patterns | C+ |
| Moms Module | 487 | Well-organized module | B+ |
| AGI Module | 504 | Good structure | B+ |
| K10 Module | 475 | Good structure | B+ |
| Assistent Dialog | 499 | ⚠️ **4 dialogs in 1 file** | C |
| Moms Dialog | 393 | ⚠️ Too large | C+ |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Report Page Layout | 7x | ~350 lines |
| handleSend/handleExport | 6x | ~60 lines |
| AI SectionCard Config | 6x | ~80 lines |
| Tax Year Loading | 3x | ~60 lines |
| Section Divider | 20x | ~40 lines |

### Improvement Opportunities

1. **Extract `<ReportPageLayout>`** - Would reduce ~400 lines
2. **Split assistent.tsx** - 499 lines → 4 separate dialog components
3. **Create `useTaxPeriod()` hook** - Centralize tax year logic
4. **Consolidate stats patterns** - AGI uses raw Cards, others use StatCard
5. **Unify table components** - Mix of GridTable and shadcn Table

---

## 📁 Category: HÄNDELSER (Events)

### Grade: B (76/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| HandelserPage | 499 | ⚠️ **TOO LARGE** - 4 view modes | C |
| EventsFolderView | 107 | Focused component | B+ |
| EventsCalendar | 176 | Good structure | B+ |
| RoadmapView | 131 | Clean implementation | A- |
| RoadmapDetail | 145 | Acceptable complexity | B+ |
| EventsTable | 104 | **UNUSED** ❓ | N/A |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Event Badge Rendering | 6x | ~60 lines |
| Event Row Rendering | 3x | ~90 lines |
| Progress Bar Pattern | 2x | ~40 lines |
| Date Grouping | Could be shared | ~30 lines |

### Improvement Opportunities

1. **Split handelser-page.tsx** - 499 lines → 4 view components + state hook
2. **Create `<EventBadge>` and `<EventListItem>`** - Shared event rendering
3. **Create `useRoadmapProgress()` hook** - Centralize progress calculation
4. **Remove or integrate unused EventsTable** - Dead code

---

## 📁 Category: PARTER (Parties)

### Grade: B+ (80/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| ParterPage | 274 | Well-structured with tabs | B+ |
| Uses ägare components | N/A | Good reuse of shared components | A |
| Duplicate File (stamma-page.tsx) | 259 | ⚠️ **DUPLICATE** - Should delete | C |

### Notes

Parter category cleverly reuses components from `ägare/` via lazy loading. The only issue is a duplicate file.

### Improvement Opportunities

1. **Delete duplicate** - `stamma-page.tsx` is unused
2. Consider moving shared meeting components to a common location

---

## 📁 Category: INSTÄLLNINGAR (Settings)

### Grade: B+ (79/100)

### All Pages & Components

| Page/Component | Lines | Current State | Grade |
|----------------|-------|---------------|-------|
| SettingsDialog | 225 | Central orchestrator | B |
| CompanyTab | 261 | ⚠️ Contains delete logic | C+ |
| LanguageTab | 115 | Many select dropdowns | B |
| All Other Tabs | <100 each | Well-sized | A- |
| SettingsItems | 620 | Comprehensive shared UI | A |

### DRY Violations Identified

| Pattern | Occurrences | Lines Wasted |
|---------|-------------|--------------|
| Tab Wrapper Pattern | 10x | ~50 lines |
| useTextMode Import | 10x | ~20 lines |
| Select Dropdown Pattern | 5x | ~75 lines |

### Improvement Opportunities

1. **Use existing `SettingsSelectField`** - In settings-items but unused
2. **Create `SettingsTabLayout` wrapper** - Would eliminate 10 duplicates
3. **Extract `DeleteCompanyDialog`** - From company-tab.tsx
4. **Move keyboard shortcuts** - From email-tab to accessibility-tab

---

## 📁 Category: SHARED COMPONENTS

### Grade: A (88/100)

### Available Shared Components

| Component | Lines | Usage | Notes |
|-----------|-------|-------|-------|
| PageTabsLayout | 129 | ✅ High | All tabbed pages |
| PageHeader | 71 | ⚠️ Low | Exists but underutilized |
| BulkActionToolbar | 185 | ✅ High | All list views |
| DeleteConfirmDialog | 109 | ✅ High | All delete actions |
| LazyLoader | 211 | ✅ High | All tabs |
| Kanban | 184 | ✅ Medium | Invoices view |
| TableToolbar | 197 | ✅ Medium | Tables |

### Available UI Components (Top Used)

| Component | Lines | Usage |
|-----------|-------|-------|
| StatCard / StatCardGrid | 168 | ✅ High |
| GridTable* | 146 | ✅ High |
| SectionCard | 170 | ✅ High |
| UploadDropzone | 227 | ✅ Medium |
| AppStatusBadge | 163 | ✅ High |
| FormField | 172 | ⚠️ Low |
| SettingsItems | 620 | ⚠️ Medium |

### Underutilized Components

1. **`PageHeader`** - Exists in shared but most pages inline their own
2. **`FormField`** - 172 lines but löner/bokföring repeat patterns
3. **`SettingsSelectField`** - In settings-items but language-tab doesn't use it
4. **`BorderedSection`** - In settings-items but marked as potentially unused

---

## 🎯 Prioritized Recommendations

### 🔴 HIGH PRIORITY (Immediate Impact)

| Action | Impact | Files Affected | Est. Lines Saved |
|--------|--------|----------------|------------------|
| **1. Use existing `PageHeader`** | 8 categories | 15+ files | ~200 lines |
| **2. Split BookingDialog** | Maintainability | 1 → 3 files | ~200 lines |
| **3. Split handelser-page.tsx** | 499 → ~150 lines | 1 → 5 files | ~350 lines |
| **4. Split assistent.tsx (rapporter)** | 4 dialogs in 1 file | 1 → 4 files | ~200 lines |
| **5. Consolidate benefit forms** | 7 repetitive forms | 7 files | ~250 lines |

### 🟡 MEDIUM PRIORITY (Architecture Improvement)

| Action | Impact | Files Affected |
|--------|--------|----------------|
| **6. Create `useMeetingDocuments<T>`** | Reduce hook duplication | 5 hooks |
| **7. Create `<ReportPageLayout>`** | Consistent report pages | 7 rapporter files |
| **8. Use FormField in löner** | Reduce form repetition | 7 form files |
| **9. Create `<EventBadge>`** | Standardize event rendering | 3 files |
| **10. Extract `useTaxPeriod()` hook** | Single source of truth | 3 files |

### 🟢 LOW PRIORITY (Polish)

| Action | Impact |
|--------|--------|
| **11. Delete duplicate stamma-page.tsx** | Dead code removal |
| **12. Remove unused EventsTable** | Dead code removal |
| **13. Standardize table patterns** | Consistency |
| **14. Move keyboard shortcuts to accessibility** | UX improvement |

---

## 📈 Potential Impact Summary

| Metric | Current | After Refactoring |
|--------|---------|-------------------|
| **Lines of Code** | ~45,563 | ~42,000 (-8%) |
| **Large Files (>400)** | 13 | 4-5 |
| **DRY Violations** | 35+ patterns | ~10 |
| **Shared Component Usage** | ~60% | ~85% |
| **Average Component Size** | 137 lines | ~110 lines |

---

## 🗺️ Cross-Category Connection Map

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SCOPE-AI COMPONENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                           PAGES LAYER                                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │   │
│  │  │ accounting- │ │ parter-     │ │ reports-    │ │ handelser-  │  etc.       │   │
│  │  │ page.tsx    │ │ page.tsx    │ │ page.tsx    │ │ page.tsx    │             │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘             │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼────────────────────┘   │
│            │               │               │               │                         │
│            ▼               ▼               ▼               ▼                         │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                       SHARED LAYOUT (PageTabsLayout)                         │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  LazyLoader → Domain Components (bokforing/, loner/, agare/, etc.)   │   │   │
│  │  └──────────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                               │
│            ┌─────────────────────────┼─────────────────────────┐                    │
│            ▼                         ▼                         ▼                    │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐             │
│  │   DOMAIN PATTERN   │  │   DOMAIN PATTERN   │  │   DOMAIN PATTERN   │             │
│  │                    │  │                    │  │                    │             │
│  │  ┌──────────────┐  │  │  ┌──────────────┐  │  │  ┌──────────────┐  │             │
│  │  │ index.tsx    │  │  │  │ index.tsx    │  │  │  │ index.tsx    │  │             │
│  │  │ (View)       │  │  │  │ (View)       │  │  │  │ (View)       │  │             │
│  │  └──────┬───────┘  │  │  └──────┬───────┘  │  │  └──────┬───────┘  │             │
│  │         │          │  │         │          │  │         │          │             │
│  │  ┌──────▼───────┐  │  │  ┌──────▼───────┐  │  │  ┌──────▼───────┐  │             │
│  │  │ use-*-logic  │  │  │  │ use-*-logic  │  │  │  │ use-*-logic  │  │             │
│  │  │ (Hook)       │  │  │  │ (Hook)       │  │  │  │ (Hook)       │  │             │
│  │  └──────┬───────┘  │  │  └──────┬───────┘  │  │  └──────┬───────┘  │             │
│  │         │          │  │         │          │  │         │          │             │
│  │  ┌──────▼───────┐  │  │  ┌──────▼───────┐  │  │  ┌──────▼───────┐  │             │
│  │  │ Sub-         │  │  │  │ Sub-         │  │  │  │ Sub-         │  │             │
│  │  │ components   │  │  │  │ components   │  │  │  │ components   │  │             │
│  │  └──────────────┘  │  │  └──────────────┘  │  │  └──────────────┘  │             │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘             │
│                                      │                                               │
│                                      ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                           SHARED COMPONENTS                                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │   │
│  │  │ StatCard    │ │ GridTable   │ │ BulkAction  │ │ SectionCard │  etc.       │   │
│  │  │ StatCardGrid│ │ Header/Rows │ │ Toolbar     │ │             │             │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                               │
│                                      ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              UI PRIMITIVES                                   │   │
│  │  Button, Card, Dialog, Input, Select, Badge, etc. (shadcn/ui based)         │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: File Size Distribution

### Files Over 400 Lines (Needs Splitting)

1. `ui/sidebar.tsx` - 734 lines
2. `onboarding/onboarding-wizard.tsx` - 627 lines
3. `bokforing/dialogs/bokforing.tsx` - 626 lines
4. `ui/settings-items.tsx` - 620 lines
5. `bokforing/dialogs/faktura.tsx` - 547 lines
6. `layout/sidebar-nav.tsx` - 535 lines
7. `rapporter/dialogs/assistent.tsx` - 499 lines
8. `pages/handelser-page.tsx` - 499 lines
9. `bokforing/dialogs/leverantor.tsx` - 484 lines
10. `ai/chat-input.tsx` - 468 lines
11. `bokforing/dialogs/underlag.tsx` - 454 lines
12. `ai/ai-overlay.tsx` - 425 lines
13. `landing/sections/hero/demo.tsx` - 422 lines
