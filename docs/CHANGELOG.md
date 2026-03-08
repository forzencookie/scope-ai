# Scope AI Changelog

Historical record of completed plans, audits, and major changes.

---

## 2026-03-08: AI-Native Layout — Remove Sidebar, Always-On Chat Panel

Removed the shadcn sidebar entirely. The app now uses a simple flex layout: toolbar at top, AI chat panel on the left (always visible), main content on the right. No more sidebar mode toggle.

### New Layout Structure

```
div (h-screen, flex-col)
+-- DashboardToolbar (full width)
|   Back/Forward | GlobalSearch | Refresh, History, New Chat, User
+-- div (flex-1, flex-row)
    +-- AI Chat Panel (380-500px, double-layer UI)
    |   Outer: muted grey bg, Scooby header with logo
    |   Inner: sidebar-accent bg, chat messages + input
    |   Category badges: Hem, Bokforing, Loner, Rapporter, Agare
    +-- Main Content (flex-1, page routes)
```

### Changes

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | Rewrote — removed SidebarProvider/AppSidebar/SidebarInset, simple flex layout with toolbar + chat panel + content |
| `src/components/layout/ai-chat-panel.tsx` | **New** — standalone chat panel extracted from ai-chat-sidebar, no shadcn sidebar deps, category badges added |
| `src/components/layout/user-team-switcher.tsx` | Decoupled from sidebar — uses `useIsMobile` instead of `useSidebar`, plain elements instead of SidebarMenu |

### Removed from layout (files still exist, unused)

- `AppSidebar` / `app-sidebar.tsx` — no longer imported
- `AIChatSidebar` / `ai-chat-sidebar.tsx` — replaced by `ai-chat-panel.tsx`
- `SidebarModeDropdown` / `sidebar-mode-dropdown.tsx` — no mode toggle needed
- `SidebarProvider`, `SidebarInset`, `SidebarTrigger` — not used in layout

---

## 2026-02-27: Tool Search — Dynamic Tool Loading for Scooby

Scooby previously loaded all 111 tool definitions (~88K tokens) into every conversation. Now starts with 3 core tools (~2K tokens) and discovers others on demand via `search_tools`.

### Architecture

| Before | After |
|--------|-------|
| All 111 tools loaded on every message | 3 core tools + search-on-demand |
| ~88K tokens before user speaks | ~2K tokens on "hej", ~5K for invoice work |
| Single flat tool list | Scored keyword search across domains |

### Core Tools (always loaded)

| Tool | Purpose |
|------|---------|
| `search_tools` | Meta-tool — discovers all other tools by keyword |
| `navigate_to` | UI navigation |
| `get_knowledge` | Loads domain knowledge documents |

### Changes

| File | Change |
|------|--------|
| `types.ts` | Added `AIToolDomain`, `domain`, `keywords`, `coreTool` fields to `AITool` |
| `registry.ts` | Added `getCoreTools()`, `search()` (scored ranking), `getByNames()` |
| `common/tool-search.ts` | **NEW** — `search_tools` meta-tool |
| `agent.ts` | `ScopeBrain` tracks `activeToolNames`, starts with core, expands after `search_tools` |
| `system-prompt.ts` | Added search instruction (instinct #6) + activity snapshot renderer |
| `route.ts` | Fetches lightweight activity snapshot (pending tx + overdue invoices) |
| All 30+ tool files | Added `domain` + `keywords` (2-5 Swedish terms each) |

### Search Scoring

Name match = 3 pts, keyword match = 2, description match = 1, domain match = 1. Top 10 returned.

### Activity Snapshot

System prompt now includes ~50 tokens of live state (pending transactions, overdue invoices) so Scooby knows the situation without a tool call.

---

## 2026-02-27: Code Quality Fixes — Cash, Tax, Errors, Dedup, Period Lock

5 fixes from the FUTURE_FEATURES bug list, verified against actual codebase. 2 reported bugs (dividend double-flip, VAT validation) confirmed as non-issues after code inspection.

| Fix | File(s) | What changed |
|-----|---------|-------------|
| Cash balance classification | `use-company-statistics.ts`, `bookkeeping/utils.ts` | New `isCashAccount()` restricts to BAS 1900-1959. Was `startsWith('19')` which included 1960-1999 non-cash accounts. Affects kassalikviditet calculation. |
| SKV tax table fallback removed | `ai-tools/loner/payroll.ts` | Payroll now returns error if employee has no `taxTable` or if SKV lookup fails. Previously silently fell back to `marginalTaxRateApprox` (32%). |
| Error states added | `use-company-statistics.ts`, `use-financial-metrics.ts` | Both hooks now return `error` field from React Query / useVerifications. Consumers can show error UI instead of silent empty state. |
| Account classification deduplicated | `use-company-statistics.ts` | Replaced inline `startsWith('1')`, `startsWith('3')`, etc. with `getAccountClass()` and `isCashAccount()` from `bookkeeping/utils.ts`. |
| Period lock centralized | `verification-service.ts`, `use-transactions-query.ts`, `use-month-closing.ts` | All three period lock implementations now query `financialperiods` table (was: verifications table in service, inline query in transactions). Added shared `checkPeriodLocked()` async utility. |

### Non-issues confirmed

| Item | Finding |
|------|---------|
| Dividend double-flipping | Both `normalizeBalances()` and the inline loop use the same `* -1` sign convention. Math is correct. |
| VAT split validation | `SwedishVatRate` TypeScript union type (`0 | 6 | 12 | 25`) prevents invalid values at compile time. `isValidVatRate()` runtime guard also exists in sales.ts. |

---

## 2026-02-27: Feature Batch — Onboarding, Memory, Invoices & Cleanup

### Företagsstatistik Page Removed

Deleted the dedicated `/dashboard/foretagsstatistik` page and all associated components. Statistics are now handled entirely through AI — users ask Scooby and get stat-cards, charts, and KPIs via the walkthrough system. The hooks and services powering the AI tools were kept intact.

**Deleted:** page route, 5 component files, lazy-loader exports, nav entry, page context, AI navigation route, translation key.

### Onboarding Polish

| Change | Detail |
|--------|--------|
| Avatar emoji persistence | Migration adds `avatar_emoji` to profiles table. ProfileStep saves emoji choice via PATCH `/api/user/profile` |
| Theme persistence | Theme selection now saved to `user_preferences` table via PUT `/api/user/preferences` (was localStorage-only) |
| Profile API PATCH | New PATCH handler on `/api/user/profile` for updating `full_name` and `avatar_emoji` |

### Månadsavslut Dialog Additions

Added two new sections to the monthly review dialog and API:

| Section | Source | Display |
|---------|--------|---------|
| AI-konversationer | `conversations` table filtered by month | Card with conversation titles + dates (max 5) |
| Avklarade steg | `roadmap_steps` where status=completed, filtered by month | Card with step titles + dates (max 5) |

### AI Memory — Post-Conversation Extraction

| Part | Detail |
|------|--------|
| `src/app/api/chat/extract-memories/route.ts` | POST endpoint; uses GPT-4o-mini to analyze conversation transcript; extracts decisions, preferences, pending items; saves to `user_memory` table with `source_conversation_id` |
| `use-conversations.ts` | Auto-triggers extraction (fire-and-forget) when starting a new conversation or deleting one |
| Confidence threshold | Only saves extractions with confidence >= 0.5; pending items auto-expire after 30 days |

### Invoice: OCR Reference Numbers (Luhn)

| Part | Detail |
|------|--------|
| `src/lib/ocr.ts` | Luhn check digit generation + validation utilities |
| Invoice creation API | Auto-generates OCR from invoice number, stores in `ocr_reference` column |
| Invoice preview | Shows OCR in payment section of the create dialog |
| PDF generator | Uses `ocrReference` field for BETALNINGSREFERENS |

### Invoice: F-skatt as Company Setting

| Part | Detail |
|------|--------|
| `has_f_skatt` column | Added to companies table (default: true) |
| Company provider/service | `hasFskatt` field added to CompanyInfo type, mapped in service |
| PDF generator | "Innehar F-skattsedel" only rendered when `company.hasFskatt !== false` |

### Invoice: Credit Note Workflow

| Part | Detail |
|------|--------|
| `src/app/api/invoices/[id]/credit-note/route.ts` | POST endpoint; generates KF-YYYY-NNNN numbering; calls `createCreditNoteEntry()` for bookkeeping; creates negative invoice record; marks original as "Krediterad" |
| Invoice card UI | "Skapa kreditfaktura" dropdown action on non-draft customer invoices |
| `use-invoices-logic.ts` | `handleCreateCreditNote` handler with toast feedback |

### Migrations

- `20260227000001_add_avatar_emoji_to_profiles.sql`
- `20260227000002_add_ocr_reference_to_invoices.sql`
- `20260227000003_add_has_f_skatt_to_companies.sql`

### FUTURE_FEATURES.md Updated

- Removed partial payment tracking (overkill for MVP — status is user/AI-managed)
- Added AI Status Reconciliation feature (Scooby scans for stale data)
- Moved email infrastructure and guided app tour to Postponed section
- Logged all implemented items

---

## 2026-02-26: Auto-Verifikation & Critical Fixes

### Auto-Verifikation Dialog — Full Implementation

Replaced three overlapping flows (VerifikationDialog + BookingWizardDialog + amber pending section) with a single unified dialog triggered by one "Bokföra" button.

| Part | What was built |
|------|---------------|
| `src/app/api/verifikationer/auto/route.ts` | POST endpoint; GPT-4o-mini JSON mode; separates pending_bookings (pass-through) from transactions/invoices (AI categorized); returns `VerifikationProposal[]` with confidence + needsReview |
| `auto-dialog/index.tsx` | Dialog shell, two tabs, success message, auto-close |
| `auto-dialog/AutoTab.tsx` | Skeleton loading, accept/reject all, scrollable card list, "Bokför X valda" footer |
| `auto-dialog/ManualTab.tsx` | OCR drag-and-drop via extract-receipt API, manual entry form with AccountSearchInput, balance enforcement |
| `auto-dialog/VerifikationCard.tsx` | Checkbox, inline account edit, collapsible AI reasoning, balance indicator |
| `auto-dialog/use-auto-verifikation.ts` | Fetches pending bookings + unbooked transactions + open invoices; deduplicates; routes pending_bookings through batch-book, others through PUT+book |
| `src/components/bokforing/verifikationer/index.tsx` | Replaced with single "Bokföra" button + badge showing pendingCount |
| `src/components/bokforing/verifikation-dialog.tsx` | **Deleted** — fully replaced by ManualTab |

### Fixes Applied from Backend Audit

| Fix | File | Detail |
|-----|------|--------|
| Verification atomicity | `verification-service.ts` | Added compensation delete — if lines insert fails, header is deleted before throwing |
| Solvency check | `use-owner-withdrawals.ts` | Partner withdrawals blocked if kapitalkonto < withdrawal amount |
| Firmatecknare buttons | `firmatecknare.tsx` | Edit/history/deregister menu items now have proper onClick handlers and icons |
| Board signatures | `arsredovisning-wizard-dialog.tsx` | Added ordförande + justeringsperson name/date fields in Step 4; data included in POST to annual-report API |
| Benefit limits seeded | `supabase/migrations/20260226000001_seed_benefit_limits.sql` | Friskvård, julgåva, jubileumsgåva, cykelförmån, kostförmån seeded to system_parameters |

### UI Cleanup: Fake Send Buttons Removed

| Component | What was removed |
|-----------|-----------------|
| `InvoiceCard.tsx` | Dead "Skicka påminnelse" button (no onClick) |
| `use-invoices-logic.ts` | Misleading toast changed from "bokförts och skickats" → "bokförts" |
| `Medlemsregister.tsx` | Dead "Skicka e-post" bulk-action button (no onClick) |
| `kallelse.tsx` | `handleSend()` function + fake `/api/notices` call + send method selector + "Skicka" footer button; existing PDF download button kept |

### Verified as Already Implemented (removed from FUTURE_FEATURES)

Items from previous audits that were listed as open but confirmed fixed in code:

| Item | Evidence |
|------|----------|
| BAS account numbers | `account-constants.ts` has correct values: AKTIEKAPITAL=2011, RESERVFOND=2013, OWNER_SALARY=7012, BALANSERAT_RESULTAT=2080 |
| Sequential verification numbering | `verification-service.ts` calls atomic RPC `get_next_verification_number()` (BFL 5:7) |
| Silent fallbacks (5 services) | All return null/error instead of fake data |
| Payroll benefit inclusion | Benefits separated from gross correctly in `payroll.ts` |
| Broken fiscal year handling | `board-service.ts` takes `fiscalYearEnd` parameter, no calendar year assumption |
| AI booking flow (double confirm) | `create-verification.ts` calls `verificationService.createVerification()` directly on confirm |
| Asset depreciation months | `inventarier.ts` calculates from `asset.inkopsdatum` dynamically |
| 3:12 optimization default | `owner-payroll.ts` requires explicit companyProfit input |
| Verification balance validation | `verification-service.ts` checks debit === credit before insert |
| Tax fallbacks (IBB/egenavgifter) | `use-tax-parameters.ts` throws error if DB values missing, no hardcoded fallbacks |
| React Query standardization | All hooks (`use-company-statistics`, `use-dynamic-tasks`, `use-invoices`, `use-employees`) use `useQuery` |
| Invoice/payroll booking routes | Both import and call bookkeeping library functions (`createSalesEntry`, `createSalaryEntry`) |
| Pending booking consolidation | All callers use shared `postPendingBookingAction()` |
| CompanyProvider dual state | Only writes to DB, no localStorage duplication |
| Shareholder transaction names | Uses proper relations, not null |
| AI write tools fake success | `create-verification.ts` calls real `verificationService.createVerification()` on confirm |

### Files Consolidated (deleted)

| File | Disposition |
|------|------------|
| `AUTO_VERIFIKATION_PLAN.md` | Implemented — added to changelog |
| `BACKEND_AUDIT_2026_02_22.md` | Open items moved to `FUTURE_FEATURES.md` |
| `PRODUCTION_ROADMAP.md` | Open items moved to `FUTURE_FEATURES.md` |
| `PRODUCTION_WIRING_PLAN.md` | Open items moved to `FUTURE_FEATURES.md` |
| `MANADSAVSLUT_DIALOG_ADDITIONS.md` | Moved to `FUTURE_FEATURES.md` |
| `ONBOARDING_AND_PAYMENTS_PLAN.md` | Moved to `FUTURE_FEATURES.md` |
| `QA_CHECKLIST.md` | Full QA pass noted in `FUTURE_FEATURES.md` |
| `CODEBASE_AUDIT.md` | Superseded by BACKEND_AUDIT_2026_02_22 |
| `googleleak.md` | Deleted (meta notes) |

---

## 2026-02-13: Documentation Consolidation

Reduced 32 docs to 20. Dissolved `ai-context/` folder. Renamed files for consistency.

| Action | Files |
|--------|-------|
| **Deleted (superseded)** | `ROADMAP.md`, `REMAINING_GAPS.md`, `ACCOUNTING_APP_AUDIT.md`, `VISION_VS_CODEBASE_GAP_ANALYSIS.md`, `ai-memory-architecture.md` |
| **Merged then deleted** | `FOUNDER_INTERVIEW_2026_02_12.md` → `FOUNDER_VISION.md`, `ai-context/coding-standards.md` + `ai-context/ux-patterns.md` → `ARCHITECTURE.md`, `ai-context/tech-stack.md`, `ai-context/project-structure.md`, `ai-context/business-domain.md`, `ai-context/README.md` |
| **Moved** | `ai-context/feature-map.md` → `FEATURE_MAP.md` |
| **Renamed** | `FOUNDERVISION.md` → `FOUNDER_VISION.md`, `HANDELSER.md` → `HANDELSER_OVERVIEW.md`, `CODEBASE_AUDIT_2026_02_12.md` → `CODEBASE_AUDIT.md`, `ai-architecture-v2.md` → `AI_ARCHITECTURE.md`, `walkthrough-designs.md` → `WALKTHROUGH_DESIGNS.md` |

---

## 2026-02-13: Production Readiness Phases A–G

Seven fixes applied to close critical blockers identified in CODEBASE_AUDIT:

| Phase | Fix | Impact |
|-------|-----|--------|
| A | Tax rate centralization | `tax_parameters` table + `useTaxParameters()` hook |
| B | Benefits flow to payslips/AGI | Förmånsvärde included in payslip generation and AGI |
| C | Closing entry engine | `closing-entry-service.ts` — transfers P&L result to 2099 |
| D | AGI individuppgifter | Per-employee KU data with personnummer and tax |
| E | Verification corrections & accruals | Fiscal year selection, accrual support |
| F | Period lock enforcement | Booking APIs reject entries in locked periods |
| G | Aktienummer auto-assignment | Sequential `share_number_from`/`share_number_to` per ABL 5:2 |

Overall production readiness updated from ~70% to ~80%.

---

## 2026-02-12: Full Codebase Audit

> Details in: CODEBASE_AUDIT.md

Category-by-category code scan. Critical fixes applied same day: AI write persistence, invoice per-line VAT, dividend account/tax/equity check, employee data persistence.

---

## 2026-02-04: Logic & Functionality Audit Complete

> Previously documented in: LOGIC_AUDIT_REPORT.md

**Status:** 11/11 tasks complete (100%)

| Task | Evidence |
|------|----------|
| Fix AI schema error | All tools use JSON Schema format |
| Fix events table security | Migration `20260128100000_fix_events_security.sql` |
| Settings persistence | `use-preferences.ts` hook, used in 5 tabs |
| Fix payroll employer contributions | 7510/2730 in `use-create-payslip-logic.ts` |
| Fix broken dialogs | MotionDialog passes form data |
| Fix hardcoded "Rice" | Removed from codebase |
| Connect theme to next-themes | `useTheme` in appearance-tab.tsx |
| Balanskontroll AI Audit | `audit.ts` with `run_balance_sheet_audit` |
| Add customers table | Migration `20260204000002_create_customers_table.sql` |
| Add suppliers table | Migration `20260204000003_create_suppliers_table.sql` |
| Add comparative periods | `use-financial-reports.ts` fetches YoY data |

**Functionality summary:**
- Bokföring: 95% UI, 90% Logic
- Rapporter: 90% UI, 90% Logic (YoY comparatives added)
- Fakturering: 90% UI, 85% Logic (Customer registry added)
- Löner: 85% UI, 70% Logic (Employer contributions fixed)
- AI Chat: 90% UI, 85% Logic (Schema errors fixed)

---

## 2026-02-04: Profiles RLS Recursion Fix

**Issue:** Profiles table RLS policies queried the profiles table itself to check admin status, causing infinite recursion.

**Solution:**
- Created `is_admin()` SECURITY DEFINER function to bypass RLS
- Replaced recursive policies on profiles, categories, securityauditlog tables
- Migration: `20260204000001_fix_profiles_rls_recursion.sql`

---

## 2026-02-04: Agent System Overhaul

> Previously documented in: AGENT_REFACTOR_PLAN.md

**Change:** Refactored from multi-agent orchestration to single unified agent.

```
Before:  User → Classifier → Orchestrator (Gojo) → 10 Domain Agents → Tools
After:   User → Model Selector → Scope Brain → Tools
```

**Why:**
- Simpler architecture - one agent with full context
- Better reasoning - single LLM can reason across domains
- Lower latency - no classification hop or agent handoffs
- Easier maintenance - one system prompt vs 11 separate agents

**Deleted:**
- `src/lib/agents/orchestrator/` (agent, classifier, planner, router)
- `src/lib/agents/domains/` (10 domain agents)
- `src/lib/agents/message-bus.ts`, `registry.ts`, `base-agent.ts`

**Added:**
- `src/lib/agents/scope-brain/` (agent, model-selector, system-prompt)

---

## 2026-02-04: AI Tools Migration

> Previously documented in: ai-tools-migration-plan.md

**Change:** Migrated from hardcoded card displays to AI-composed block walkthroughs.

**Before:** Each tool hardcoded `display: { component: 'TransactionsTable', props: {...} }`
**After:** Tools return raw data, AI composes response using block primitives

**Three response modes:**
- Mode A (Chat): Answer in conversation, no overlay
- Mode B (Fixed walkthrough): Standardized document layout for formal reports
- Mode C (Dynamic walkthrough): AI freely composes blocks for analysis

**What stayed:** Tool definitions, registry, confirmation workflow, audit logging
**What changed:** Card registry replaced by block renderer, AI overlay supports 3 modes

---

## 2026-01-28: Performance Fixes

> Previously documented in: PERFORMANCE_FIX_PLAN.md

**Completed fixes:**

| Fix | Impact |
|-----|--------|
| Removed Three.js ecosystem | -1MB bundle size |
| Removed duplicate CompanyProvider | -50% context re-renders |
| Added React Query caching | Reduced duplicate API calls |
| Added AbortController to fetches | Prevented memory leaks |
| Parallelized sequential requests | Faster page loads |

---

## 2026-01-27: AI Tools Audit

> Previously documented in: AI_TOOLS_AUDIT.md, AI_AUDIT_COMPLETE.md

**Audit scope:** 55+ AI tools across 6 domains

**Findings:**
- All tools implemented with proper logic
- System prompts well-structured
- Proper audit logging via `ai_tool_executions` table
- Confirmation workflow working (5-min expiry, checkbox, audit trail)

**Status at time:** EXCELLENT (before agent system removal)

---

## 2026-01-27: TypeScript Errors Assessment

> Previously documented in: TYPESCRIPT_ERRORS_FIX_PLAN.md

**Status:** SKIPPED (low priority)

**Reason:** App builds fine, errors are cosmetic type mismatches that don't affect runtime.

**Count at time:** 69 errors (down from 102 after schema alignment)

**Categories:**
- Missing `UserScopedDb` methods (4 errors)
- Database type mismatches (41 errors)
- Missing properties in types (24 errors)

---

## 2026-01-26: Security Audit & Fixes

> Details in: ARCHITECTURE.md (Security section)

**Fixes applied:**
- RLS enabled on all tables with `user_id = (SELECT auth.uid())` pattern
- Removed public access policies (data leak vulnerability)
- Added FK constraints to `auth.users`
- Revoked anon access on sensitive tables
- Fixed 8 critical, 9 high-risk issues

**Score:** 5.8/10 → 8.5/10

---

## File Migration Notes

These files were consolidated into this changelog on 2026-02-04:
- `AGENT_REFACTOR_PLAN.md` → Deleted
- `ai-tools-migration-plan.md` → Deleted
- `PERFORMANCE_FIX_PLAN.md` → Deleted
- `AI_TOOLS_AUDIT.md` → Deleted
- `AI_AUDIT_COMPLETE.md` → Deleted
- `TYPESCRIPT_ERRORS_FIX_PLAN.md` → Deleted
- `LOGIC_AUDIT_REPORT.md` → Deleted
