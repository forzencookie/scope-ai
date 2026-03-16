# Backend Audit Report

**Date:** 2026-03-15
**Scope:** Security, type safety, data handling, performance, code quality, architectural debt, full codebase scan

---

## Table of Contents

1. [Must-Fix Before Launch](#must-fix-before-launch) — Security vulnerabilities
2. [Should-Fix](#should-fix) — Performance & correctness
3. [Full Codebase Scan](#full-codebase-scan) — Folder-by-folder assessment
4. [Redundant Code](#redundant-code) — Dead duplicates to delete
5. [Code to Remove](#code-to-remove) — Better modern approach exists
6. [Suppressor Audit](#suppressor-audit) — Path to zero suppressors
7. [Final Vision](#final-vision) — The app after cleanup
8. [Metrics](#metrics) — Before/after tracking

---

## Must-Fix Before Launch

### 1. 7 API routes have zero authentication

Anyone can call these without logging in:

| Route | Risk |
|-------|------|
| `src/app/api/closing-entries/route.ts` | Can manipulate year-end accounting closing entries |
| `src/app/api/corrections/route.ts` | Can create verification corrections/reversals |
| `src/app/api/accruals/route.ts` | Can create accrual entries |
| `src/app/api/benefits/route.ts` (GET) | Can view all employee compensation data |
| `src/app/api/benefits/[id]/route.ts` (DELETE) | Can delete any benefit assignment |
| `src/app/api/email/test/route.ts` (POST) | Can send emails via the email service |
| `src/app/api/calendar/feed/route.ts` (GET) | Exposes company roadmap data |

**Fix:** Add `getAuthContext()` check to all routes. Return 401 if unauthenticated.

### 2. Invoice number race condition

`src/app/api/invoices/route.ts` (lines 56-70) — reads the latest invoice number, increments it in JS, then inserts. Two simultaneous requests can generate the same number, violating BFL (Bokföringslagen) sequential numbering.

**Fix:** Create a database RPC with `FOR UPDATE` lock (like the existing `get_next_verification_number` RPC).

### 3. Unvalidated input on updates

These routes pass raw `request.json()` to Supabase `.update()`:

- `src/app/api/transactions/[id]/route.ts` (line 33)
- `src/app/api/payroll/payslips/[id]/route.ts` (line 27)

A user could set `user_id`, `company_id`, or other protected fields.

**Fix:** Whitelist allowed fields before updating:
```ts
const allowed = ['description', 'amount', 'status', 'date']
const updates = Object.fromEntries(
  Object.entries(body).filter(([key]) => allowed.includes(key))
)
```

### 4. Stripe checkout IDOR

`src/app/api/stripe/checkout/status/route.ts` — accepts a `session_id` parameter and returns payment status + email without verifying the caller owns that session.

**Fix:** Add auth check and verify the session's `client_reference_id` or `customer` matches the authenticated user.

### 5. N+1 queries in transaction import

`src/app/api/transactions/import/route.ts` (lines 263-340) — imports CSV rows as individual inserts in a loop. 100 rows = 100 DB calls.

**Fix:** Batch insert: `supabase.from('transactions').insert([...allRows]).select()`

---

## Should-Fix

### 6. Dual auth calls

`src/app/api/chat/route.ts` and `src/app/api/search/route.ts` call both `verifyAuth()` AND `getAuthContext()` — two separate DB round-trips for the same purpose.

**Fix:** Use only `getAuthContext()` which returns auth + supabase client.

### 7. Missing `.limit()` on unbounded queries

These routes return all rows without pagination:

- `src/app/api/employees/route.ts`
- `src/app/api/partners/route.ts`
- `src/app/api/members/route.ts`
- `src/app/api/payroll/payslips/route.ts`

**Fix:** Add `.limit(200)` or implement pagination with `.range()`.

### 8. Errors logged but success returned

~10 API routes log a Supabase query error with `console.error` then return `{ success: true }` with empty data instead of an error response.

**Examples:**
- `src/app/api/transactions/route.ts` (line 59)
- `src/app/api/invoices/route.ts` (line 27)
- `src/app/api/members/route.ts` (line 25)
- `src/app/api/receipts/processed/route.ts` (line 30)

**Fix:** Check `error` and return a 500 response when queries fail.

### 9. Overly broad `.select('*')`

28+ routes fetch all columns when they only need 2-3. Wastes bandwidth, especially for tables with large JSONB columns.

**Fix:** Use specific column lists: `.select('id, title, updated_at')` instead of `.select('*')`.

---

## Full Codebase Scan

Folder-by-folder assessment of every directory against the app's purpose: a production-ready AI-first Swedish accounting app (ChatGPT for bokföring).

### `supabase/` — Grade: B+

| Item | Grade | Notes |
|------|-------|-------|
| `config.toml` | Good | Clean local dev config |
| `_shared/response.ts` | Good | Reusable response helpers |
| `_shared/supabase.ts` | Good | Admin + user client factories |
| 76 SQL migrations | Good | Learning curve visible — early weak, late solid |
| `functions/hello-world/` | **RED** | Dead template artifact, zero app value |
| `functions/api-example/` | **YELLOW** | Placeholder, not production |
| `functions/protected-function/` | **YELLOW** | Duplicates api-example pattern |

**Migration notes:**
- Early migrations (Dec 2024): minimal RLS, weak naming — superseded by later fixes
- Schema cleanup migration (`20260315000001`) properly drops 20 dead tables + 19 unused RPCs
- Duplicate customer/supplier table migrations (Jan 28 vs Feb 4) — schema drift risk
- Two-phase booking pattern (`pending_bookings`) aligns perfectly with AI confirm-before-mutate

### `src/types/` — Grade: B-

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `index.ts` | 391 | Good | Central hub; `SimpleTransaction` should be `Omit<Transaction>` |
| `database.ts` | auto | Good | Auto-generated Supabase types |
| `events.ts` | 236 | Excellent | Audit-first design, hash chaining |
| `sru.ts` | 227 | Excellent | Swedish tax compliance (INK2, K10 field mappings) |
| `documents.ts` | 142 | Good | Document + signature flow types |
| `meeting.ts` | 40 | **RED** | Duplicate of `ownership.ts` `GeneralMeeting` |
| `board-meeting.ts` | 28 | **RED** | Duplicate of `ownership.ts` `BoardMeeting` + `AgendaItem` |
| `roadmap.ts` | 47 | **ORANGE** | `Record<string, any>` metadata with eslint-disable |
| `withdrawal.ts` | 50 | **ORANGE** | Imports from UI layer (circular risk); utility function in types file |
| `ownership.ts` | 327 | **ORANGE** | Kitchen-sink; has `calculateEgenavgifter()` that belongs in `lib/` |

**Redundancy:** `BoardMeeting` in 2 files. `AgendaItem` in 2 files. `AnnualMeeting` vs `GeneralMeeting` parallel hierarchies.

### `src/test-utils/` — Grade: C

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `index.tsx` | 218 | **ORANGE** | `createMockQuickStat()` uses wrong fields (`title`/`trend` vs `label`/`change`/`positive`). Missing mocks for Company, Verification, Payslip. `renderWithProviders` missing ChatProvider. |

### `src/services/` — Grade: A-

#### Core Accounting (Essential)

| Service | Lines | Grade | Notes |
|---------|-------|-------|-------|
| `verification-service.ts` | 497 | Excellent | Core BFL bookkeeping engine |
| `transactions.ts` | 272 | Good | Bank transaction mapping |
| `invoice-service.ts` | 237 | Good | `getStats()` hardcodes 0 for some fields |
| `receipt-service.ts` | 141 | Good | Compliance-ready |
| `account-service.ts` | 321 | Excellent | BAS kontoplan queries |
| `tax-service.ts` | 231 | Excellent | SKV tax tables |
| `closing-entry-service.ts` | 300 | Excellent | Year-end compliance |
| `pending-booking-service.ts` | 383 | Excellent | AI→bookkeeping bridge, atomic RPC |
| `accrual-service.ts` | 239 | Excellent | Period accounting |
| `correction-service.ts` | 135 | Excellent | BFL-compliant reversals |
| `vat-service.ts` | 152 | Good | Moms declarations |
| `company-service.ts` | 308 | Excellent | Multi-tenant identity |

#### Supporting (Important)

| Service | Lines | Grade | Notes |
|---------|-------|-------|-------|
| `shareholder-service.ts` | 448 | Good | Complex but legally required for AB |
| `payroll-service.ts` | 215 | Good | Mandatory if employees exist |
| `tax-declaration-service.ts` | 212 | Good | Annual filing |
| `company-statistics-service.ts` | 377 | Good | Dashboard KPIs |
| `board-service.ts` | 329 | Good | Corporate governance |
| `settings-service.ts` | 268 | Good | Subscription + feature gates |
| `upload-service.ts` | 211 | Excellent | Signed URLs, cache-busting |
| `inventarie-service.ts` | 166 | Good | Fixed asset depreciation |
| `benefit-service.ts` | 120 | **ORANGE** | 2x `eslint-disable` for join types |

#### Questionable

| Service | Lines | Grade | Notes |
|---------|-------|-------|-------|
| `user-memory-service.ts` | 337 | **RED** | `@ts-nocheck` — will fail at runtime if `user_memory` table missing |
| `navigation.ts` | 202 | **ORANGE** | 6 `as unknown` casts; unnecessary abstraction for single-company app |
| `roadmap-service.ts` | 215 | **YELLOW** | Nice-to-have, not core accounting |
| `event-service.ts` | 276 | **YELLOW** | Nice-to-have timeline |

#### Processors (17 files)

| Processor | Lines | Grade | Notes |
|-----------|-------|-------|-------|
| `reports/calculator.ts` | 257 | Good | Dashboard financial metrics |
| `vat/calculator.ts` | 291 | Good | Swedish VAT compliance |
| `vat/vat-boxes.ts` | 459 | Good | Skatteverket box mapping |
| `annual-report-processor.ts` | 187 | Good | Yearly reports |
| `inkomstdeklaration-processor.ts` | 469 | **ORANGE** | Built but not connected to AI tools |
| `periodiseringsfonder-processor.ts` | 231 | **ORANGE** | Niche, dormant |
| `investments-processor.ts` | 220 | **ORANGE** | Not urgent for MVP |
| `invoice-processor.ts` | 172 | **ORANGE** | Duplicated by AI tools layer |

### `src/providers/` — Grade: A-

| Provider | Lines | Grade | Notes |
|----------|-------|-------|-------|
| `chat-provider.tsx` | 270 | Excellent | Clean chat state management |
| `company-provider.tsx` | 358 | Good | 2 `as any` on Supabase results |
| `ai-overlay-provider.tsx` | 353 | **YELLOW** | 11 useState calls, could consolidate to ~6 |
| `model-provider.tsx` | 98 | Good | Model selection (snabb/smart/expert) |
| `text-mode-provider.tsx` | 173 | Good | Hydration-safe locale pattern |
| `query-provider.tsx` | 72 | Good | Well-tuned React Query config |
| `theme-provider.tsx` | 12 | Good | next-themes wrapper |
| `index.ts` | 43 | Good | Clean barrel export |

### `src/lib/` — Grade: A-

#### Top-Level Files (24)

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `utils.ts` | 275 | Excellent | `parseAmount()` handles Swedish/English formats |
| `company-types.ts` | 451 | Excellent | Complete Swedish company matrix, RBAC |
| `validation.ts` | 232 | Good | Defines `ChatMessage` — slight overlap with `chat-types.ts` |
| `stripe.ts` | 277 | Good | 6 `as any` from Supabase type gap |
| `model-auth.ts` | 324 | Good | Tier access matrix, usage tracking |
| `subscription.ts` | 191 | Good | Tier limits, model cost multipliers |
| `rate-limiter.ts` | 140 | Good | In-memory sliding window, Vercel-aware |
| `checklist-engine.ts` | 219 | Good | Dynamic reconciliation checks |
| `tax-periods.ts` | 193 | Good | Swedish tax calendar |
| `formaner.ts` | 390 | **ORANGE** | 6 `as any`, verbose for a lookup utility |
| `chat-types.ts` | 147 | Good | Slight type overlap with `validation.ts` |
| `formatters.ts` | 58 | Good | SEK formatting |
| `localization.ts` | 373 | Good | Translation helpers |
| `egenavgifter.ts` | 108 | Good | Self-employment tax |
| `status-types.ts` | 267 | Good | Status enums |
| All others | — | Good | No issues found |

#### Subdirectories

| Directory | Files | Grade | Notes |
|-----------|-------|-------|-------|
| `lib/database/` | 3 | Excellent | Best-in-class Supabase client factory |
| `lib/ai-tools/` | 44 | Good | Clean domain separation, deferred loading, 7 modules |
| `lib/bookkeeping/` | 11 | **RED (disconnect)** | Complete double-entry engine but AI tools don't call it — entry creation duplicated |
| `lib/agents/` | 8 | **ORANGE** | 405 lines of multi-agent types for system that only has ScopeBrain |
| `lib/ai/` | 6 | Good | Model tiers, page contexts |
| `lib/generators/` | — | Good | PDF, SIE generation |
| `lib/parsers/` | — | Good | |
| `lib/translations/` | — | Good | |

### `src/hooks/` — Grade: A

#### Core Infrastructure

| Hook | Lines | Grade | Notes |
|------|-------|-------|-------|
| `use-async.ts` | 248 | Excellent | Foundation hook, race condition prevention |
| `use-cached-query.ts` | 235 | Good | TTL-based cache, bridges before React Query |
| `use-table.ts` | 284 | Excellent | Consolidated filter/sort/pagination |

#### Chat (AI-Native Core)

| Hook | Lines | Grade | Notes |
|------|-------|-------|-------|
| `chat/use-conversations.ts` | 176 | Excellent | React Query cached, memory extraction |
| `chat/use-send-message.ts` | 359 | Good | **YELLOW** — large, could split concerns |
| `chat/use-stream-parser.ts` | 261 | Good | Solid streaming, verbose |
| `chat/use-quick-actions.ts` | 129 | Excellent | Fuzzy match scoring |
| `chat/use-chat.ts` | 294 | Good | Vercel AI SDK wrapper |

#### Financial (Accounting Logic)

| Hook | Lines | Grade | Notes |
|------|-------|-------|-------|
| `use-transactions-query.ts` | 464 | Exemplary | Best React Query pattern in codebase |
| `use-financial-metrics.ts` | 259 | Excellent | Monthly trends, KPIs, YoY |
| `use-normalized-balances.ts` | 92 | Excellent | Prevents sign confusion (debit/credit normal) |
| `use-vat-report.ts` | 147 | Excellent | Swedish VAT compliance |
| `use-dividends.ts` | 71 | Excellent | ABL 17 kap distributable equity |
| `use-pending-bookings.ts` | 229 | Excellent | Core AI→booking workflow |
| `use-month-closing.ts` | 287 | Excellent | Period locking, reconciliation |
| `use-dynamic-tasks.ts` | 298 | Excellent | AI-generated actionable tasks |
| `use-subscription.ts` | 133 | Excellent | Server-derived tier, secure |

#### Thin Wrappers

| Hook | Lines | Grade | Notes |
|------|-------|-------|-------|
| `use-chat-navigation.ts` | 25 | **YELLOW** | Could inline |
| `use-navigation.ts` | 111 | **YELLOW** | 3 thin wrappers |
| `use-partners.ts` | 49 | **YELLOW** | Placeholder, not fully implemented |

**Pattern note:** Some hooks use `useCachedQuery` (older), others React Query (newer). Inconsistent but functional.

### `src/components/ai/` — Grade: A-

#### Block System (Primary Rendering)

| Area | Files | Grade | Notes |
|------|-------|-------|-------|
| `blocks/` | 29 | Excellent | 23 composable primitives + renderer. Type-safe, graceful fallbacks. |
| `blocks/block-renderer.tsx` | — | Excellent | Maps block.type → component cleanly |

#### Legacy Card System

| Area | Files | Grade | Notes |
|------|-------|-------|-------|
| `card-registry.ts` | 1 | **RED** | Explicitly `@deprecated` |
| `card-renderer.tsx` | 1 | **RED** | Deprecated |
| `cards/` | 16 | **RED** | 50+ legacy cards replaced by blocks |
| `cards/inline/index.tsx` | 1 (353) | Good | Compact action result cards, actively used |

#### Core UX

| File | Grade | Notes |
|------|-------|-------|
| `chat-message-list.tsx` | Good | 6 `as any` + 5 `eslint-disable` from loose union types |
| `chat-input.tsx` | Good | Textarea + mentions + file upload |
| `ai-side-panel.tsx` | Good | Right panel for walkthroughs |
| `confirmation-card.tsx` | Good | Receipt/transaction confirm UI |
| `mention-popover.tsx` | Good | @entity autocomplete |
| `walkthrough-overlay.tsx` | Good | Block-based walkthrough display |

#### Mascots

| File | Grade | Notes |
|------|-------|-------|
| `mascots/dog.tsx` | Good | PixelDog — well-loved, used in sidebar + empty state |
| `mascots/bear.tsx` | Good | PixelBear — used in search dialog |
| `mascots/giraffe.tsx` | **RED** | PixelGiraffe — not rendered anywhere |
| `mascots/common.tsx`, `styles.ts`, `types.ts` | Good | Shared infrastructure |

#### Previews (13 files)

| Area | Grade | Notes |
|------|-------|-------|
| Document previews (6) | **YELLOW** | Functional but check if actively called post-redesign |
| Form previews (4) | **YELLOW** | Authority form renderers (AGI, K10, VAT, income declaration) |
| Base components (3) | Good | Clean wrapper pattern |

### `src/components/layout/` — Grade: A

| File | Grade | Notes |
|------|-------|-------|
| `app-sidebar.tsx` | Excellent | Dual-mode (navigation/ai-chat), clean switching |
| `main-content-area.tsx` | Excellent | 3-state: empty chat, active chat, page view |
| `chat-history-sidebar.tsx` | Excellent | Grouped conversations, collapse states |
| `ai-chat-sidebar.tsx` | Excellent | Chat UI in sidebar mode |
| `mobile-bottom-nav.tsx` | Good | Fixed bottom nav for mobile |
| `user-team-switcher.tsx` | Good | Account switcher |
| `global-search.tsx` + `search-dialog.tsx` | Good | Full-text search |
| `sidebar-mode-dropdown.tsx` | Good | Mode toggle |
| `ai-chat-panel.tsx` | **RED** | 15-line dead stub |
| `adaptive-nav.tsx` | **YELLOW** | Not used in current sidebar flow |

### `src/components/bokforing/` — Grade: B

**58 files, ~8,440 LOC**

| Area | Grade | Notes |
|------|-------|-------|
| Transaction grid | Good | Read-only display with filters |
| Receipts grid | Good | Read-only with OCR status |
| Verification list | Good | Sequential display, period awareness |
| Inventory tracking | Good | Fixed asset display |
| `BookingDialog` (3-step wizard) | **RED** | Competes with BookingWizardDialog |
| `BookingWizardDialog` (4-step) | Good | Keep as the one booking flow |
| `NewTransactionDialog` | **RED** | Too minimal, should route through AI |
| Supplier invoice AI processing | Good | OCR → AI extraction → booking |

**Critical issue:** THREE competing booking flows where there should be ONE.

### `src/components/loner/` — Grade: B-

**37 files, ~4,601 LOC**

| Area | Grade | Notes |
|------|-------|-------|
| Payslip table | Good | Read-only display |
| Team grid | Good | Employee cards |
| Egenavgifter calculator | Good | Self-employment tax |
| 6 benefit forms (Vehicle, Allowance, Meal, Housing, Fuel, Parking) | **ORANGE** | Identical pattern repeated 6 times — should be 1 generic form or AI-driven |
| Withdrawal dialog | **ORANGE** | Duplicates dividend dialog in agare/ |

### `src/components/agare/` — Grade: C+

**56 files, ~8,618 LOC — most over-engineered directory**

| Area | Grade | Notes |
|------|-------|-------|
| Aktiebok display grids | Good | Read-only share registry |
| Dividend calculator display | Good | ABL-compliant equity check |
| Medlemsregister | Good | Member list display |
| `meeting-view.tsx` (1,477 lines) | **RED** | Giant monolith dialog for entire meeting lifecycle |
| 11 corporate action dialogs | **RED** | Manual CRUD that AI should handle |
| ActionWizard (8 files) | **RED** | Multi-step wizard for corporate actions |
| Firmatecknare editor | **ORANGE** | Could be AI-driven |

### `src/components/rapporter/` — Grade: A

**28 files, ~4,708 LOC.** This is the correct pattern — almost all read-only views with "do it via AI" buttons. All domain components should follow this model.

### `src/components/handelser/` — Grade: A

**10 files, ~1,765 LOC.** Pure read-only: calendar, timeline, event details. No dialogs, no over-engineering.

### `src/components/onboarding/` — Grade: B+

**18 files, 11 steps.** Each step justified for legal/operational setup. Progressive disclosure based on company type. Well-architected. Could merge to 6-7 steps for MVP but not urgent.

### `src/components/installningar/` — Grade: A-

**15 files, 10 tabs.** Modular, focused. Settings complexity proportional to app needs.

### `src/components/shared/` — Grade: A

**15 files.** All actively used: activity-feed, error-boundary, report-wizard-shell, table-toolbar, kanban, upgrade-prompt, bulk-action-toolbar, lazy-loader, tier-badge. No dead code.

### `src/components/auth/` — Grade: A

**5 files.** Clean: auth-guard, feature-gate, login-form, signup-form. Minimal.

### `src/components/billing/` — Grade: A

**3 files.** Tightly focused: buy-credits-dialog, upgrade-button.

### `src/components/ui/` — Grade: A

**57 components.** Standard shadcn library + custom enhancements. Healthy count.

### `src/data/` — Grade: A

| File | Size | Notes |
|------|------|-------|
| `accounts.ts` | 37KB | Full BAS kontoplan, 400+ accounts |
| `page-contexts.ts` | 34KB | AI context per page (rich prompts) |
| `formaner-catalog.ts` | 6KB | Employee benefits reference |
| `app-navigation.ts` | 6KB | Nav structure |
| `account-constants.ts` | 3KB | Account category helpers |

All legitimate reference data. No redundancy.

### `src/emails/` — Grade: B

**1 file:** `payslip-template.tsx`. Single React email template. Adequate for scope.

### `scripts/` — Grade: B+

| File | Size | Notes |
|------|------|-------|
| `seed-mock-data.ts` | 7.6KB | Test data seeding |
| `mock-data.ts` | 35KB | Test dataset definitions |
| `create-pro-user.ts` | 2.4KB | Dev utility |
| `generate-world-map-svg.ts` | 3.2KB | Utility |

Development/ops utilities. Not production code.

### `src/app/` — Grade: A

**Routing structure:** Clean. Dashboard catch-all `[...slug]` for 5 feature pages. Null `page.tsx` is intentional — MainContentArea handles rendering. Legal/landing pages properly isolated. No orphaned routes.

**API routes (67 total):** Consistent auth patterns, RLS enforcement, rate limiting on `/api/chat`. Stripe webhook properly signature-verified.

---

## Deep Scan — AI Tools, Bookkeeping Engine, Generators, Infrastructure

Second-pass deep read of every file that was only listed (not read) in the initial scan.

### AI Tool Implementations — Grade: B

**52 tools across 6 domains. Architecture is sound but operationally messy.**

#### Critical Finding: Service Layer Bypass

Some AI tools correctly call services (`verificationService`, `inventarieService`, `accountService`). Others bypass services entirely and make raw API calls:

| Tool | Bypasses to | Should use |
|------|-------------|------------|
| `create_invoice` | `POST /api/invoices` | `invoiceService` |
| `void_invoice` | `POST /api/invoices/{id}/credit-note` | `invoiceService` |
| `book_invoice_payment` | `POST /api/invoices/{id}/book` | `invoiceService` |
| `create_receipt` | `POST /api/receipts/processed` | `receiptService` |
| `categorize_transaction` | `PATCH /api/transactions/{id}` | `transactionService` |
| `create_transaction` | `POST /api/transactions` | `transactionService` |
| `match_payment_to_invoice` | `POST /api/invoices/{id}/pay` | `invoiceService` |

**Risk:** Inconsistent RLS enforcement, maintenance fragility, bypasses service-level validation.

#### Critical Finding: Duplicate Tool Name

`get_upcoming_deadlines` is defined in BOTH `events.ts` AND `navigation.ts`. At registry time, the last one registered overwrites the first. Unpredictable behavior.

**Action:** Rename one (suggest `get_deadlines_calendar` for the navigation version).

#### Critical Finding: lib/bookkeeping/ Is Completely Unused by AI Tools

The bookkeeping engine exports `createPurchaseEntry()`, `createSalesEntry()`, `createSalaryEntry()`, `createSimpleEntry()` — all with BAS validation, VAT calculation, and balance checking. **Zero AI tools import or call these functions.** Tools either:
1. Call `verificationService.createVerification()` with manually constructed entries
2. Make raw API calls

This means AI-generated entries may skip the bookkeeping engine's validators entirely.

#### Stub Tools (Incomplete Implementations)

| Tool | Status | What's missing |
|------|--------|----------------|
| `send_invoice_reminder` | Preflight only | Doesn't actually send email |
| `export_sie` | Returns URL | Doesn't generate the file |
| `close_fiscal_year` | Returns preview | Doesn't persist closing entries |
| `bulk_categorize_transactions` | Preflight only | No execution logic |
| `buy_ai_credits` | Hardcoded packages | Stub response |
| `get_upcoming_deadlines` (events) | Hardcoded data | Not querying real deadlines |
| `get_activity_summary` | Hardcoded data | Not querying real activity |

#### Type Safety Issues in Tools

| File | Issue |
|------|-------|
| `common/statistics.ts` lines 135-143 | `(t: any)` on transaction filter/reduce — should import `Transaction` type |
| `bokforing/receipts.ts` line 222 | `eslint-disable` for `(r: any)` receipt filter |
| `bokforing/audit.ts` line 154 | `(i: any)` on invoice filter |
| `common/usage.ts` line 62 | `createBrowserClient` imported inside `execute()` — should be top-level |

#### Confirmation Workflow — Properly Implemented

All write tools correctly implement two-phase confirmation (preflight → confirmed execution). Read-only tools correctly skip confirmation. No security gaps found here.

### Bookkeeping Engine (`lib/bookkeeping/`) — Grade: A-

**Production-quality double-entry engine. Complete but disconnected.**

| File | Lines | Quality | Notes |
|------|-------|---------|-------|
| `types.ts` | 137 | Excellent | JournalEntry, ValidationResult, TransactionTemplate |
| `validation.ts` | 145 | Excellent | Balance check (0.01 öre tolerance), BAS account validation |
| `vat.ts` | 150 | Excellent | Swedish VAT (25%, 12%, 6%, 0%), extractVat, calculateVat |
| `utils.ts` | 240 | Excellent | Fiscal year ranges, account classification, ID generation |
| `templates.ts` | 248 | Good | 19 pre-defined templates (office, software, rent, etc.) |
| `entries/simple.ts` | 108 | Excellent | 2-3 line entries |
| `entries/purchase.ts` | 192 | Excellent | Supplier invoices, cash vs accrual |
| `entries/sales.ts` | 369 | Excellent | Multi-VAT line items, credit notes |
| `entries/salary.ts` | 334 | Excellent | Payroll with Semesterlagen 12% vacation accrual |

**Strengths:** Mathematically correct, BAS compliant, comprehensive validation, handles all Swedish transaction types.

**Weaknesses that need attention:**

| Issue | Severity | Notes |
|-------|----------|-------|
| No sequential verification numbering | **RED** | IDs are random (`VER-{timestamp}-{random}`). BFL requires gap-free A1, A2, A3... |
| Finalization is just a flag | **ORANGE** | `finalizeEntry()` sets `finalized: true` — no immutability guarantee, no role protection |
| Templates not integrated | **YELLOW** | `findMatchingTemplate()` exists but is never called |

### Generators (`lib/generators/`) — Grade: B

| Generator | Lines | Grade | Key Issue |
|-----------|-------|-------|-----------|
| `pdf-generator.ts` | 1029 | A | Production-ready. 7 document types. Minor: `y = Math.max(y, y)` no-op. |
| `sie-generator.ts` | 326 | A- | Correct SIE4 format, ISO-8859-1 encoding, CRLF line endings. |
| `sru-generator.ts` | 459 | B- | **BUG: line 397 uses `info.phone` instead of `info.orgnr`** in LegacySRUGenerator. Also mixed legacy/modern API. |
| `agi-generator.ts` | 139 | C+ | No schema validation before Skatteverket submission. No period format validation. |
| `xbrl-generator.ts` | 185 | C+ | Minimal K2 implementation. Missing: cash flow, director names, detailed notes. |
| `vat-xml-export.ts` | 61 | B | Thin wrapper, delegates to processor. |

### Parsers (`lib/parsers/`) — Grade: C+

| Parser | Lines | Grade | Notes |
|--------|-------|-------|-------|
| `sie-parser.ts` | ~141 | C+ | Basic SIE4 parsing. Missing: #ADRESS, #TAXAR, #KTYP, #RES, #DIM, #OBJEKT. No validation (doesn't check balance, account existence). No round-trip guarantee. |

### Remaining `lib/` Files

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `email.ts` | 29 | **ORANGE** | Resend API key placeholder in code |
| `ocr.ts` | 65 | A | Correct Luhn check digit + OCR generation for Swedish invoices |
| `meeting-utils.ts` | 63 | Good | Meeting status labels (Planerad, Kallad, Genomförd, Signerat) |
| `audit.ts` | 54 | Good | Server-side activity logging |
| `swedish-tax-rules.ts` | 32 | Good | Prisbasbelopp lookup 2023-2025 — **needs 2026 update** |
| `stripe-client.ts` | — | Good | Client-side Stripe loader |
| `ai-suggestion.ts` | — | Good | Suggestion filtering |

### AI Models — Grade: B

`src/lib/ai/models.ts` references `gpt-5-mini`, `gpt-5`, `gpt-5-turbo` as model IDs. These don't exist. Should reference actual production model IDs (Claude, GPT-4o, etc.).

### AI Knowledge Base — **EMPTY**

`src/data/ai-knowledge/` directory exists but contains **no files**. The AI knowledge base hasn't been created yet. This should contain Swedish accounting reference material for the `get_knowledge` tool.

### Infrastructure Files — Grade: A

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `middleware.ts` | 184 | Excellent | Clean auth middleware, RLS headers, deleted user detection |
| `dashboard/layout.tsx` | 120 | Excellent | Clean provider nesting (AuthGuard → Query → TextMode → Model → Company → AIDialog → Toast) |
| `next.config.ts` | 34 | Good | React Compiler enabled, tree-shaking configured |
| `tsconfig.json` | 35 | Good | Strict mode, path aliases |
| `jest.config.ts` | 44 | Good | jsdom env, ESM transform patterns |

### Additional API Route Findings

| Route | Lines | Grade | Issues |
|-------|-------|-------|--------|
| `/api/closing-entries/route.ts` | 59 | Good | Clean |
| `/api/corrections/route.ts` | 43 | Good | Clean |
| `/api/manadsavslut/route.ts` | 235 | Excellent | Comprehensive month-end logic |
| `/api/monthly-review/route.ts` | 363 | Excellent | 10 parallel queries with `Promise.allSettled()` |
| `/api/compliance/route.ts` | 128 | **ORANGE** | 2x `as any` for `corporate_documents` table + debug `console.log` statements |
| `/api/notices/route.ts` | 93 | **YELLOW** | Email service incomplete (returns 503) |
| `/api/sie/export/route.ts` | 305 | Excellent | Full SIE4 export with previous year comparison |
| `/api/sie/import/route.ts` | 150 | Good | Dedup detection via `external_id` |
| `/api/transcribe/route.ts` | 59 | Good | OpenAI Whisper, Swedish language |

### AI Block Components — Grade: A

**27 blocks, ~999 lines total.** All properly typed, consistent styling, flexible props. Representative quality:
- `data-table.tsx` (49 lines) — Standard table with caption
- `financial-table.tsx` (53 lines) — Enhanced with highlights & totals
- `chart.tsx` (47 lines) — Recharts wrapper (bar/line/pie)
- `confirmation.tsx` (77 lines) — Action confirmation with warnings
- `block-renderer.tsx` (177 lines) — Master registry, 24 block types, graceful unknown fallback

### Document Components — Grade: B

`src/components/documents/document-list.tsx` (238 lines) — Card-based document display with type metadata, signature status tracking. **Uses mock data** (3 sample documents) — needs API integration.

---

## Redundant Code

Absolutely useless or duplicate code that should be deleted:

| What | Where | Why it's redundant | LOC |
|------|-------|-------------------|-----|
| Deprecated card system | `ai/card-registry.ts`, `ai/card-renderer.tsx`, `ai/cards/*.tsx` (22 files) | Block system replaced it. Explicitly `@deprecated`. | ~1,500 |
| Dead stub | `layout/ai-chat-panel.tsx` | Comments say "no longer used" | 15 |
| Hello-world edge function | `supabase/functions/hello-world/` | Template artifact | 15 |
| Duplicate `BoardMeeting` type | `types/board-meeting.ts` + `types/ownership.ts` | Same interface in 2 files | 28 |
| Duplicate `AnnualMeeting`/`GeneralMeeting` | `types/meeting.ts` + `types/ownership.ts` | Parallel hierarchies for same concept | 40 |
| PixelGiraffe mascot | `ai/mascots/giraffe.tsx` | Not rendered anywhere in the app | ~100 |
| `SimpleTransaction` type | `types/index.ts` lines 311-330 | Should be `Omit<Transaction, ...>` not a separate type | 20 |
| Duplicate booking flows | `bokforing/dialogs/bokforing.tsx` + `ny-transaktion.tsx` | 3 entry points for same operation; keep BookingWizardDialog only | ~800 |
| Duplicate withdrawal/dividend forms | `loner/delagaruttag/` vs `agare/utdelning/` | Structurally identical CRUD patterns | ~400 |
| Duplicate tool name | `get_upcoming_deadlines` in `events.ts` AND `navigation.ts` | Registry collision — last registered wins | — |
| Legacy SRU generator | `LegacySRUGenerator` class in `sru-generator.ts` lines 376-418 | Broken (uses `info.phone` instead of `info.orgnr`), superseded by modern API | ~42 |
| Hardcoded stub data | `get_upcoming_deadlines`, `get_activity_summary` in AI tools | Return fake data instead of querying DB | — |
| Mock data in documents | `src/components/documents/document-list.tsx` | 3 hardcoded sample documents instead of API data | — |
| **Total dead/duplicate** | | | **~3,060+** |

---

## Code to Remove

Code where a better modern approach exists for our AI-first app:

| What | Where | LOC | Better approach |
|------|-------|-----|----------------|
| 11 corporate action dialogs | `agare/dialogs/`, `agare/action-wizard/` | ~3,500 | AI generates meeting docs, proposals, corporate actions via chat. Keep read-only views only. |
| 6 benefit form components | `loner/dialogs/forman/forms/` | ~1,500 | 1 generic benefit form with config, or AI-driven: "Add vehicle benefit for Anna, Tesla Model 3, 550k kr" |
| `meeting-view.tsx` monolith | `agare/bolagsstamma/meeting-view.tsx` | 1,477 | Split: read-only view (keep) + AI-driven editing (chat) |
| Navigation service | `services/navigation.ts` | 202 | Inline into auth context. Single-company app doesn't need this abstraction. |
| Multi-agent scaffolding | `lib/agents/types.ts` | 405 | Only ScopeBrain exists. Keep the agent, trim 25 unused intent types. |
| `BookingDialog` (old flow) | `bokforing/dialogs/bokforing.tsx` | ~300 | Keep BookingWizardDialog as the one booking flow |
| `NewTransactionDialog` | `bokforing/dialogs/ny-transaktion.tsx` | ~250 | Route all new transactions through AI chat → pending booking |
| Bookkeeping disconnect | `lib/bookkeeping/` not called by `lib/ai-tools/` | 0 (rewire) | Wire AI tools to call `createSalesEntry()`, `createPurchaseEntry()` instead of reimplementing entry creation |
| API-bypassing AI tools | 7 tools call `/api/*` instead of services | 0 (refactor) | Refactor to use `invoiceService`, `receiptService`, `transactionService` |
| 7 stub AI tools | Various tools return hardcoded/preflight-only data | ~200 | Either complete the implementations or remove and document as future work |
| Fake model IDs | `lib/ai/models.ts` references `gpt-5-mini`, `gpt-5`, `gpt-5-turbo` | 0 (fix) | Update to actual production model IDs |
| Empty AI knowledge base | `src/data/ai-knowledge/` exists but empty | 0 (populate) | Create Swedish accounting reference docs for `get_knowledge` tool |
| SRU generator bug | `sru-generator.ts` line 397: `info.phone` instead of `info.orgnr` | 0 (fix) | Fix field reference |
| Debug console.logs | `/api/compliance/route.ts` lines 63, 70, 77, 86 | 0 (clean) | Remove debug logging |
| Outdated tax rules | `swedish-tax-rules.ts` Prisbasbelopp only to 2025 | 0 (update) | Add 2026 value |
| **Total removable/fixable** | | | **~7,834+** |

---

## Suppressor Audit

### Current Counts

| Category | Count | Files |
|----------|-------|-------|
| `as any` casts | 64 | 33 files |
| `as unknown` casts | 51 | 19 files |
| Explicit `: any` type annotations | 67 | 42 files |
| `eslint-disable` comments | 145 | 88 files |
| `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` | 6 | 5 files |
| `TODO` / `FIXME` / `HACK` / `XXX` / `TEMP` | 16 | 14 files |
| Non-null assertions (`!.`) | 25 | 13 files |
| **Total** | **~374** | — |

### Goal: Zero suppressors unless best-practice unavoidable

### RED — Delete or rewrite now

**1. Supabase `as any` casts from missing type generation (17 casts)**

| File | Count | Pattern |
|------|-------|---------|
| `src/lib/stripe.ts` | 6 | `.from('table_name' as any)` |
| `src/lib/formaner.ts` | 6 | `.from('table_name' as any)` |
| `src/lib/model-auth.ts` | 1 | `.from('ai_usage' as any)` |
| `src/services/pending-booking-service.ts` | 1 | Same pattern |
| Other services | 3 | Same pattern |

**Root cause:** Supabase types aren't generated for all tables.
**Action:** Run `npx supabase gen types typescript` — fixes 17 suppressors in one command.

**2. `chat-message-list.tsx` — 6 `as any` + 5 `eslint-disable`**

All caused by loose `message.display` union type. A discriminated union eliminates all 11:

```ts
// Instead of:
<ReceiptCard receipt={(message.display.data.receipt || message.display.data) as any} />

// Use discriminated union:
if (message.display?.type === 'ReceiptCard' && 'receipt' in message.display.data) {
  <ReceiptCard receipt={message.display.data.receipt} />
}
```

**3. `user-memory-service.ts` — `@ts-nocheck`**

Entire file has type checking disabled because `user_memory` table may not exist in generated types. Will fail at runtime if migration is missing.

**Action:** Verify migration exists, regenerate types, remove `@ts-nocheck`.

### ORANGE — Over-engineered, simplify

**4. Navigation service — 202 LOC, 6 `as unknown`**

`src/services/navigation.ts` wraps a company fetch + static nav menus. Single-company app.

**Action:** Inline into auth context.

**5. `formaner.ts` — 390 LOC, 6 `as any`**

Verbose for a lookup utility.

**Action:** Simplify after type generation.

**6. Dormant processors — multiple `eslint-disable`**

`inkomstdeklaration-processor.ts`, `periodiseringsfonder-processor.ts`, `investments-processor.ts` — built but not connected to AI tools.

**Action:** Either expose as AI tools or defer.

### Hotspot Files

| File | `as any` | `eslint-disable` | `: any` | Total |
|------|----------|-------------------|---------|-------|
| `src/lib/formaner.ts` | 6 | 6 | 1 | 13 |
| `src/components/ai/chat-message-list.tsx` | 6 | 5 | 3 | 14 |
| `src/lib/stripe.ts` | 6 | 5 | — | 11 |
| `src/lib/ai-tools/common/company.ts` | — | 4 | 4 | 8 |
| `src/services/board-service.ts` | 2 | — | 6 | 8 |
| `src/lib/ai-tools/parter/partners.ts` | 2 | 4 | — | 6 |
| `src/services/navigation.ts` | — | — | 6 (`as unknown`) | 6 |
| `src/lib/ai-tools/parter/compliance.ts` | — | 4 | 1 | 5 |
| `src/lib/ai-tools/bokforing/audit.ts` | — | — | 5 | 5 |

### Highest-ROI Actions

1. **Run Supabase type generation** — fixes ~17 `as any` casts in one command
2. **Delete deprecated card system** — removes ~1,500 LOC and associated eslint-disables
3. **Refactor `message.display` to discriminated union** — eliminates 11 suppressors in one file
4. **Delete dead files** (ai-chat-panel.tsx, giraffe.tsx, hello-world/, LegacySRUGenerator) — instant cleanup
5. **Wire bookkeeping engine to AI tools** — eliminates duplicate entry creation logic
6. **Refactor 7 API-bypassing AI tools** — use services instead of raw fetch to `/api/*`
7. **Fix SRU generator bug** — `info.phone` → `info.orgnr` (line 397)
8. **Rename duplicate tool** — `get_upcoming_deadlines` exists in 2 files
9. **Fix `@ts-nocheck` in user-memory-service** — verify migration, regenerate types
10. **Remove debug console.logs** from `/api/compliance/route.ts`

---

## Final Vision

Once all cleanup is complete, here's what Scope AI becomes:

**~630 files** (down from ~774). **~20,000 LOC removed.**

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  LAYOUT                                              │
│  Sidebar (260px/60px) │ MainContentArea (3 states)   │
│  - Chat history       │ - Empty: greeting + badges    │
│  - New chat           │ - Active: messages + input    │
│  - Settings/User      │ - Page: read-only data view   │
└─────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐   ┌──────────────────────────────┐
│  CHAT ENGINE      │   │  DATA REVIEW PAGES            │
│  ChatProvider     │   │  Bokföring: grids + tables    │
│  useChat          │   │  Rapporter: collapsible views  │
│  useSendMessage   │   │  Händelser: calendar + timeline│
│  useStreamParser  │   │  Löner: payslip tables         │
│  Block renderer   │   │  Ägare: aktiebok + meetings    │
│  (23 primitives)  │   │  (ALL read-only, AI-mutation)  │
└────────┬─────────┘   └──────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  AI TOOLS (44 tools, 7 domains)                       │
│  ↓ calls                                              │
│  BOOKKEEPING ENGINE (lib/bookkeeping/ — now wired)    │
│  ↓ creates                                            │
│  PENDING BOOKINGS → user confirms → VERIFICATION      │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  SERVICES (20 focused, down from 30)                  │
│  Core: verification, transaction, invoice, receipt     │
│  Tax: tax, vat, closing-entry, accrual, correction    │
│  Company: company, shareholder, payroll               │
│  AI: user-memory, pending-booking                     │
│  Infra: upload, settings                              │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  SUPABASE + STRIPE                                    │
│  ~42 essential API routes (down from 67)              │
│  RLS-secured, auth-gated, rate-limited                │
│  Generated types (zero `as any` from schema gaps)     │
└──────────────────────────────────────────────────────┘
```

### The User Experience

Open the app. Clean chat interface with Scooby the pixel dog. Type "Bokför faktura från Telia, 4 500 kr, bredband" and Scooby:

1. Creates a double-entry journal entry using the **real bookkeeping engine** (not a reimplementation)
2. Shows it as a **block walkthrough** (stat cards + entry preview + confirmation action bar)
3. User clicks "Godkänn" — becomes a verification with sequential BFL-compliant numbering
4. Entry appears in Bokföring review page immediately

No forms. No dialogs. No wizard steps. Chat → confirm → done.

Review pages (Bokföring, Rapporter, Löner, Ägare, Händelser) show data in clean read-only grids. When you need to change something, a button says "Ändra via Scooby" which opens the chat with context pre-filled.

### Suppressor Target

| Metric | Current | After cleanup |
|--------|---------|---------------|
| `as any` | 64 | ~8 (SDK limitations only) |
| `eslint-disable` | 145 | ~15 (justified edge cases) |
| `as unknown` | 51 | ~10 (Supabase boundaries) |
| `@ts-ignore/expect-error` | 6 | 2 (Vercel SDK) |
| Total suppressors | **374** | **~35** |
| Files | 774 | ~630 |
| Dead LOC removed | — | ~20,000 |

---

## Metrics After Database Rewrite

| Metric | Before | After |
|--------|--------|-------|
| Database access files | 7 | 3 |
| Supabase client patterns | 5 | 3 |
| `as any` casts | 71 | 64 |
| `eslint-disable` comments | 137 | 128 |
| Dead tables in types | 20 | 0 |
| Dead RPCs in types | 19 | 0 |
| Dead types file (supabase.ts) | 3790 lines | Deleted |
| Admin client misuse | 11 files | 0 (only stripe.ts) |
| Lines removed | — | ~13,000 |
