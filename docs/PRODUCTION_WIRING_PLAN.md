# Production Wiring Plan — Founder Vision Alignment

**Created:** 2026-02-06
**Purpose:** Bridge the gap between the current shell and a real Swedish accounting app per FOUNDERVISION.md

---

## Current State Summary

The app has ~823 TypeScript files, 52 API routes, and 60+ AI tools. The UI shell is ~90% complete. Supabase persistence works for basic CRUD (transactions, invoices, receipts, employees, etc.). However:

1. **The bookkeeping engine (`src/lib/bookkeeping/`) is disconnected** — it exists but is never called during write operations
2. **Verifications have no journal lines** — booking creates a verification row with just date + description, no debit/credit entries
3. **All financial reports return `success: false`** — P&L, Balance Sheet, VAT, tax reports are stubs
4. **Cross-module communication is broken** — payroll, dividends, owner withdrawals don't create verifications
5. **Stat cards show hardcoded zeros** — draft invoices, pending payslips, overdue invoices all = 0
6. **Demo fallbacks bleed into production** — mock OCR data, simulated AI responses, localStorage persistence

---

## Phase 1: The Accounting Spine

**Goal:** Every financial action creates proper double-entry verifications with journal lines.
**Priority:** CRITICAL — nothing else works without this.

### 1.1 Add `verification_lines` table

Create Supabase migration for journal entry lines:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `verification_id` | uuid FK | Links to `verifications` table |
| `account_number` | integer | BAS account (1000-8999) |
| `account_name` | text | Human-readable account name |
| `debit` | numeric(15,2) | Debit amount in SEK |
| `credit` | numeric(15,2) | Credit amount in SEK |
| `description` | text | Optional line description |
| `user_id` | uuid FK | RLS enforcement |
| `company_id` | uuid FK | Multi-tenant isolation |
| `created_at` | timestamptz | Auto-set |

RLS policy: `user_id = auth.uid()`

### 1.2 Extend `verifications` table

Add missing columns:

| Column | Type | Description |
|--------|------|-------------|
| `verification_number` | text | BFL-compliant sequential (A1, A2, A3...) |
| `verification_series` | text | Series prefix (default 'A') |
| `fiscal_year` | integer | e.g. 2026 |
| `source_type` | text | 'transaction' / 'invoice' / 'payroll' / 'manual' / 'dividend' |
| `source_id` | uuid | Links back to originating record |
| `total_amount` | numeric(15,2) | Total transaction amount |
| `is_locked` | boolean | Locked after månadsavslut |

### 1.3 Wire `user-scoped-db.ts`

Add `verificationLines` accessor with:
- `listByVerification(verificationId)` — get all lines for a verification
- `create(data)` — insert a journal line
- `listByAccount(accountNumber, dateRange)` — for report aggregation
- `getAccountBalances(dateRange)` — aggregate debit-credit per account

### 1.4 Wire bookkeeping engine to write path

Connect existing `src/lib/bookkeeping/entries/` to actual database writes:

- **Transaction booking** (`/api/transactions/[id]/book`) → call `createSimpleEntry()` or `createPurchaseEntry()` → persist verification + lines
- **Customer invoice booking** (`/api/invoices/[id]/book`) → call `createSalesEntry()` → persist
- **Supplier invoice booking** (`/api/supplier-invoices/[id]/book`) → call `createPurchaseEntry()` → persist
- **Invoice payment** (`/api/invoices/[id]/pay`) → call payment entry template → persist

### 1.5 Implement BFL verification numbering

- Sequential, gap-free: A1, A2, A3... per fiscal year
- Query `MAX(verification_number) WHERE fiscal_year = X AND verification_series = 'A'`
- Increment atomically (use Supabase RPC or transaction)
- Never reuse deleted numbers

### Files to modify:
- `supabase/migrations/` — new migration
- `src/types/database.ts` — add verification_lines types
- `src/lib/database/user-scoped-db.ts` — add verification_lines accessor
- `src/app/api/transactions/[id]/book/route.ts` — wire bookkeeping engine
- `src/app/api/invoices/[id]/book/route.ts` — wire bookkeeping engine
- `src/app/api/invoices/[id]/pay/route.ts` — wire bookkeeping engine
- `src/app/api/supplier-invoices/[id]/book/route.ts` — wire bookkeeping engine
- `src/app/api/verifications/route.ts` — include lines in response

---

## Phase 2: Reports From Real Data

**Goal:** P&L, Balance Sheet, and tax reports computed from actual journal lines.
**Depends on:** Phase 1 complete.

### 2.1 Resultaträkning (Income Statement)

- Aggregate `verification_lines` for accounts 3000-8999
- Group by account class: Intäkter (3xxx), Varor (4xxx), Övriga (5-6xxx), Personal (7xxx), Finans (8xxx)
- Period filtering (month, quarter, year)
- Wire AI tool `getIncomeStatementTool` to real query

### 2.2 Balansräkning (Balance Sheet)

- Aggregate `verification_lines` for accounts 1000-2999
- Group: Tillgångar (1xxx), Skulder (2xxx), Eget kapital (2080-2099)
- Cumulative from start of fiscal year (or all time for balance accounts)
- Wire AI tool `getBalanceSheetTool` to real query

### 2.3 Momsdeklaration (VAT Declaration)

- Sum VAT accounts (2610-2650) per reporting period
- Calculate: Utgående moms - Ingående moms = Moms att betala
- Support both manual entry and AI-assisted mode (per founder vision)
- Integration point with Månadsavslut

### 2.4 Wire remaining report AI tools

Replace all `// TODO: Query real financial data` stubs:
- `getFinancialReportTool`
- `calculateAnnualResultTool`
- `calculateAnnualTaxTool`

### 2.5 Månadsavslut → Händelser

- Move from Bokföring to Händelser section
- URL: `/dashboard/handelser/manadsavslut`
- UI: Row-per-month layout (expandable)
- Each row shows: period status, verification count, revenue, expenses
- Expanding reveals timeline/events for that month
- Year switcher with left/right arrows (centered)
- Closing a month locks verifications (`is_locked = true`)

### Files to modify:
- `src/lib/ai-tools/bokforing/reports.ts` — replace stubs with real queries
- `src/app/api/reports/` — wire to verification_lines aggregation
- `src/components/handelser/` — add månadsavslut component
- `src/components/rapporter/` — P&L and Balance Sheet from real data
- Navigation config — move månadsavslut route

---

## Phase 3: Cross-Module Symbiosis

**Goal:** Every action with accounting impact auto-creates verifications.
**Depends on:** Phase 1 complete.

### 3.1 Payroll → Verifikationer

When running lönekörning:
- Debit 7210 (Löner) for gross salary
- Debit 7510 (Arbetsgivaravgifter) for employer contributions (31.42%)
- Credit 2710 (Personalens källskatt) for tax withholding
- Credit 2730 (Arbetsgivaravgifter skuld) for employer contribution liability
- Credit 1930 (Företagskonto) for net salary payment
- Auto-create verification with `source_type: 'payroll'`

### 3.2 Dividends → Verifikationer

When marking dividend as paid:
- Debit 2898 (Utdelning beslutad) for dividend amount
- Credit 1930 (Företagskonto) for payment
- Auto-create verification with `source_type: 'dividend'`

### 3.3 Owner Withdrawals → Verifikationer

Delägaruttag/Egenavgifter:
- Create appropriate journal entries for owner withdrawals
- Debit 2013 (Privata uttag) / Credit 1930 (Företagskonto)
- Generate documentation for external bank payment

### 3.4 Stat Cards → Real Queries

Replace hardcoded zeros in `use-dynamic-tasks.ts`:
- `draftInvoices` → `SELECT COUNT(*) FROM customerinvoices WHERE status = 'DRAFT'`
- `pendingPayslips` → `SELECT COUNT(*) FROM payslips WHERE status = 'pending'`
- `overdueInvoices` → `SELECT COUNT(*) FROM customerinvoices WHERE due_date < NOW() AND status != 'PAID'`

Replace hardcoded zeros in transaction stat cards:
- `Antal betalningar` → total transaction count
- `Pengar in` → SUM of positive amounts
- `Pengar ut` → SUM of negative amounts
- `Allt i ordning` → booked vs unbooked ratio

### 3.5 Team ↔ Payroll

- `Antal anställda` in Lönekontroll pulls from `employees` table dynamically
- Creating payroll for unknown person prompts "add as team member" dialog
- Employee profile shows full salary payment history + active benefits

### 3.6 Inventarier → Depreciation Verifications

- `Bokför avskrivning` button creates depreciation entries
- Debit 7830 (Avskrivning inventarier) / Credit 1229 (Ack avskrivningar)
- Auto-create verification with `source_type: 'depreciation'`

### Files to modify:
- `src/app/api/payroll/payslips/route.ts` — add verification creation
- `src/components/agare/utdelning/` — wire dividend payment to ledger
- `src/hooks/use-dynamic-tasks.ts` — replace hardcoded 0s
- `src/hooks/use-financial-metrics.ts` — real KPI computation
- `src/components/loner/` — team count from employees table
- `src/components/bokforing/inventarier/` — depreciation booking

---

## Phase 4: UI/UX Vision Alignment & Cleanup

**Goal:** Match every page to founder spec. Remove all demo/fake fallbacks.
**Depends on:** Phases 1-3 give the data needed.

### 4.1 Bokföring Pages

- **Transaktioner**: Stat cards show real Antal betalningar, Pengar in, Pengar ut, Allt i ordning. Upload flow simplified to 'Manual' and 'OCR'.
- **Fakturor**: Invoice preview in standard view (not just expanded). Kanban reflects real lifecycle.
- **Kvitton**: Two distinct modes — Manual and OCR upload.
- **Inventarier**: Add table title + separator. Move depreciation button here.
- **Verifikationer**: Collapsible BAS-account grouped view (not flat table). Navigate by account → see underlying verifications.

### 4.2 Löner Pages

- **Lönekontroll**: Dynamic employee count. Payroll wizard captures all legally required payslip data. Brutto/skatt from real salary data.
- **Förmåner**: Backend-driven benefit options (not hardcoded). Stat cards: Totalt, Täckning, Outnyttjad.
- **Team**: Card-based with comprehensive dossier (salary history, benefits, expenses).
- **Delägaruttag**: Full documentation for external bank payment. Auto-communicates with Verifikationer.
- **Egenavgifter**: Government document generation. All actions recorded in Verifikationer.

### 4.3 Rapporter Pages

- **All reports**: Support manual entry AND AI-assisted mode.
- **AI mode**: Agent fetches data from transactions, payroll, etc. to populate forms conversationally.

### 4.4 Ägare & Styrning Pages

- **Aktiebok**: Documentation + download for all legally required share info.
- **Möten & Protokoll**: Legal paper trail — minutes downloadable for authorities.
- **Firmatecknare**: Pure documentation, no external API needed.
- **Utdelning**: Generate dividend receipts. Track Pending → Paid status. Book on payment.
- **Delägare**: Card-based overview with ownership stake details.

### 4.5 Händelser Pages

- **Månadsavslut** (moved here): Row-per-month, expandable timeline, year switcher with arrows.
- **Kalender**: Day-click dialog showing events + user comments.
- **Roadmap**: Vertical stepper UI (not cards).

### 4.6 Inställningar

- **Företag**: Company logo (distinct from profile pic), appears on invoices/payslips.
- **Språk & Region**: Settings persist across sessions.
- **User Profile**: Upload profile picture or choose emoji. Shows in sidebar.
- **Billing**: Custom checkout page (not Stripe hosted). Download payment receipts.

### 4.7 Remove Demo Fallbacks

- Delete `src/lib/ai-simulation.ts` (hardcoded AI responses)
- Delete `src/lib/demo-storage.ts` (localStorage persistence)
- Remove `getMockData()` from `/api/ai/extract/route.ts`
- Remove simulated success from `/api/notices/route.ts`
- Remove hardcoded calendar events from `/api/calendar/feed/route.ts`
- Clean up `demo-banner.tsx` and `demo-upgrade-modal.tsx`

### 4.8 Performance: Minimize API Calls

Per founder instruction: "strictly minimize unnecessary API calls and data fetches."
- Audit all `useEffect` hooks for redundant fetches
- Ensure React Query deduplication is working
- Remove any polling or interval-based refetches unless necessary
- Lazy-load data that isn't immediately visible

---

## Phase 5: Dynamic Data & Hardcode Elimination

**Goal:** Every component that displays financial, tax, or benefit data must fetch from the database — zero hardcoded rates, catalogs, or placeholder values.
**Depends on:** Phases 1-4 complete.

### 5.1 Förmåner → Backend-Driven Benefits Catalog (CRITICAL)

Founder spec: *"Benefit options should not be hardcoded; they should be driven by a backend table for easy updates."*

**Current state:** Benefits catalog fetched from AI tool (`listAvailableBenefits()`), not a DB table. Employee benefit assignments are not persisted. `unusedPotential` stat hardcoded to 0.

**Required:**
- Create `benefits_catalog` table (id, name, description, category, monthly_cost, is_active, created_at)
- Create `employee_benefits` junction table (id, employee_id, benefit_id, start_date, end_date, status)
- API: `/api/benefits` GET (catalog) and `/api/employees/[id]/benefits` GET/POST
- Stat cards computed from real data: Totalt (SUM monthly_cost), Täckning (employees with benefits / total), Outnyttjad (catalog items not assigned)
- Remove AI tool dependency for catalog listing

**Files to modify:**
- `supabase/migrations/` — new migration for benefits tables
- `src/components/loner/benefits/` — wire to new API
- `src/services/` — new benefits-service.ts
- `src/lib/ai-tools/loner/` — update AI tool to read from DB

### 5.2 Egenavgifter → Dynamic Tax Parameters (CRITICAL)

**Current state:** All 7 tax rate components hardcoded in `use-tax-calculator.ts` as "2024 rates":
- sjukforsakring: 3.88%, alderspension: 10.21%, fullRate: 28.97%, reducedRate: 10%, karensReduction: 0.76%

**Required:**
- Create `tax_parameters` table (id, year, rate_type, rate_value, description, source_url)
- Seed with 2024, 2025, 2026 rates from Skatteverket
- API: `/api/tax-parameters?year=2026` GET
- Hook: `useTaxParameters(year)` fetches rates dynamically
- Egenavgifter calculator reads rates from hook instead of constants

**Files to modify:**
- `supabase/migrations/` — new migration for tax_parameters
- `src/components/loner/egenavgifter/use-tax-calculator.ts` — replace hardcoded rates
- `src/hooks/` — new use-tax-parameters.ts (or extend existing)

### 5.3 Rapporter Constants → Remove Demo Placeholder Data (CRITICAL)

**Current state:** `src/components/rapporter/constants.ts` contains fake KPI data ("1,85 mkr" revenue), hardcoded VAT period amounts, mock balance sheet items, and demo expense categories used as fallback display data.

**Required:**
- Delete or gut `constants.ts` — keep only structural config (labels, section ordering)
- Ensure all report UIs show empty/loading state when no real data exists, not fake numbers
- Verify no component imports demo values from constants as fallback

**Files to modify:**
- `src/components/rapporter/constants.ts` — remove all numeric demo data
- Any component importing demo values from constants

### 5.4 Utdelning → Dynamic Tax Rate (HIGH)

**Current state:** Dividend tax rate hardcoded at 20% (0.2) in `use-dividend-logic.ts` lines 46 and 211.

**Required:**
- Read dividend tax rate from `tax_parameters` table (rate_type = 'dividend_tax')
- Swedish dividend tax for unlisted companies = 20% of 2/3 of amount (effective ~13.3%), but this varies and must be year-dynamic

**Files to modify:**
- `src/components/agare/utdelning/use-dividend-logic.ts` — replace constant with DB lookup

### 5.5 Aktiebok → Dynamic Quota Value (HIGH)

**Current state:** Share quota value (kvotvärde) hardcoded at 25 kr in `use-aktiebok-logic.ts` line 182.

**Required:**
- Add `quota_value` column to `companies` table (or company_settings)
- Read from company context instead of hardcoded constant
- Set during onboarding or company settings page

**Files to modify:**
- `supabase/migrations/` — add quota_value to companies
- `src/components/agare/aktiebok/use-aktiebok-logic.ts` — replace hardcoded 25

### 5.6 Delägaruttag → Scalable Partner Accounts (MEDIUM)

**Current state:** Account mappings hardcoded for exactly 2 partners (2013→p-1, 2023→p-2, 2018→p-1, 2028→p-2). Won't scale to 3+ partners.

**Required:**
- Dynamic account assignment based on partner count
- Use BAS account ranges 2010-2019 (privata uttag) and 2020-2029 (privata insättningar)
- Account routing derived from partner index, not hardcoded mapping

**Files to modify:**
- `src/components/loner/delagaruttag/` — dynamic account routing

### 5.7 Team Mileage Rate → Configurable (LOW)

**Current state:** Mileage reimbursement rate hardcoded at 2.5 kr/km in `use-team-logic.ts`.

**Required:**
- Add `mileage_rate` to company settings
- Skatteverket 2026 rate: 2.50 kr/km (tax-free), but this changes yearly

**Files to modify:**
- `src/components/loner/team/use-team-logic.ts` — read from company settings

---

### Phase 5 Success Criteria

When complete:
1. Changing tax year → all tax rates update automatically (egenavgifter, dividends, K10)
2. Admin can add/remove benefits from a catalog → employees see updated options
3. No component shows fake/placeholder financial numbers as fallback
4. Company with 5 partners → all delägaruttag accounts mapped correctly
5. Aktiebok quota value matches what was set during company registration

---

## Phase 6: Founder Vision UI/UX Gaps

**Goal:** Close every remaining gap between the current UI and the founder's explicit requirements.
**Depends on:** Phase 5 for data; most items can be done independently.

### 6.1 Bokföring UI Gaps

#### 6.1a Transaktioner Upload: Simplify to Manual + OCR
**Founder says:** *"Upload flow should be simplified to 'Manual' and 'OCR' since AI handles the analysis regardless of source."*
**Current:** 3 modes (Enskild, Z-rapport, Massimport).
**Fix:** Merge Z-rapport and Massimport into a single "OCR / Import" mode. AI handles classification regardless.
**File:** `src/components/bokforing/dialogs/ny-transaktion.tsx`

#### 6.1b Fakturor: Invoice Preview in Standard View
**Founder says:** *"Improve the UI so that the invoice preview is available in the standard view, not just the expanded mode."*
**Current:** Preview is only in a dropdown menu on the Kanban card.
**Fix:** Show a preview pane or inline summary directly on the card (amount breakdown, dates, PDF thumbnail).
**File:** `src/components/bokforing/fakturor/components/InvoiceCard.tsx`

#### 6.1c Inventarier: Table Title + Separator
**Founder says:** *"Fix the UI consistency: add a table title and separator like other pages."*
**Current:** Missing title row and border separator that Transaktioner and Kvitton have.
**Fix:** Add "Alla tillgångar" heading with `border-b-2` separator, matching other pages.
**File:** `src/components/bokforing/inventarier/index.tsx`

### 6.2 Löner UI Gaps

#### 6.2a Lönekontroll: Dynamic Employee Count
**Founder says:** *"'Antal anställda' must dynamically update from the Team page."*
**Current:** Counts payslips in the current period, not actual employees from the `employees` table.
**Fix:** Query employees table count separately, display as stat card.
**File:** `src/components/loner/payslips/use-payslips-logic.ts`

#### 6.2b Lönekontroll: Prompt for Unknown Person
**Founder says:** *"When creating a new payroll run for a person not yet in the system, the dialog should prompt to add them as a team member."*
**Current:** Has "Ny person" tab but user must discover it manually. No automatic prompt.
**Fix:** When user types a name not matching any employee, show inline suggestion: "Denna person finns inte i teamet. Vill du lägga till dem?"
**File:** `src/components/loner/dialogs/create-payslip/step-employee-select.tsx`

### 6.3 Rapporter Gaps

#### 6.3a Årsbokslut: Add Manual + AI Mode
**Founder says:** *"Same manual vs. AI-assisted pattern" for all reports.*
**Current:** Read-only auto-calculated view. No editable fields. AI button not functional.
**Fix:** Add editable adjustment fields (like Inkomstdeklaration has) and wire AI navigation button.
**File:** `src/components/rapporter/arsbokslut.tsx`

### 6.4 Händelser Gaps

#### 6.4a Kalender: Day-Click Dialog with Comments
**Founder says:** *"When clicking any day, a dialog should open showing exactly what unfolded on that specific date. It should also allow users to add personal comments to a day."*
**Current:** Clicking an event works, but clicking an empty day does nothing. No personal comments feature.
**Fix:** Add `onDayClick` handler → dialog showing day's events + comment textarea persisted to DB.
**Files:** `src/components/handelser/handelser-kalender.tsx`, new `day-detail-dialog.tsx`

### 6.5 Ägare & Styrning Gaps

#### 6.5a Document Downloads (Aktiebok, Meetings, Utdelning)
**Founder says:** Aktiebok must allow "recording and downloading of all legally required information." Meetings are a "legal paper trail" with downloadable minutes. Utdelning should "generate dividend receipts/vouchers."
**Current:** Menu items exist ("Exportera aktiebok", "Ladda ner kallelse/protokoll") but handlers are not wired — they just log to console. No dividend receipt generation.
**Fix:** Implement PDF generation using a library (e.g., @react-pdf/renderer or jsPDF) for:
- Aktiebok export (shareholder register)
- Meeting minutes (kallelse + protokoll)
- Dividend receipts (utdelningsavi)
**Files:** `src/components/agare/aktiebok/`, `src/components/agare/dialogs/meeting-view.tsx`, `src/components/agare/utdelning/`

### 6.6 Inställningar Gaps

#### 6.6a Company Logo Upload
**Founder says:** *"It should house the company logo, which is distinct from the user's profile picture and must appear on all professional documents like invoices and payslips."*
**Current:** No logo upload field in company settings. No logo on documents.
**Fix:** Add file upload to Företag settings → store in Supabase Storage → render on invoices/payslips/PDFs.
**Files:** `src/components/installningar/tabs/company-tab.tsx`, invoice/payslip templates

#### 6.6b User Profile Picture Upload
**Founder says:** *"Users should be able to upload a profile picture (which displays in the sidebar) or choose from a set of emojis."*
**Current:** "Byt profil bild" button exists but has no onClick handler. No emoji picker.
**Fix:** Wire upload button → Supabase Storage → update user_metadata. Add emoji fallback selector.
**Files:** `src/components/installningar/tabs/account-tab.tsx`, `src/components/layout/sidebar/nav-user.tsx`

### 6.7 Payments & Subscription Gaps

#### 6.7a Custom Stripe Checkout
**Founder says:** *"This should lead to a custom checkout page (not the generic Stripe hosted page) for better branding."*
**Current:** Redirects to Stripe-hosted checkout via `window.location.href = data.url`.
**Fix:** Build embedded Stripe checkout using `@stripe/react-stripe-js` Elements instead of hosted redirect.
**Files:** `src/components/billing/`, `src/app/api/stripe/`

#### 6.7b Payment Receipt Downloads
**Founder says:** *"Subscription history and receipts must be available for download."*
**Current:** No receipt download functionality.
**Fix:** Query Stripe invoices API → list payment history → provide PDF download links.
**Files:** `src/components/billing/`, new `/api/stripe/receipts` endpoint

### 6.8 Onboarding Gap

#### 6.8a AI Interview Phase
**Founder says:** *"A final 'Chat with AI' phase where the agent interviews the user to gather extra context or data for a 'head start'. The AI then pre-populates the database."*
**Current:** Onboarding has company setup + profile steps but NO AI chat interview phase.
**Fix:** Add final onboarding step with embedded AI chat that asks about business type, expected transaction volume, key customers/suppliers, etc. AI pre-populates accounts and settings.
**Files:** `src/components/onboarding/`, step config

---

### Phase 6 Success Criteria

When complete:
1. Transaction upload shows exactly 2 modes (Manual + OCR/Import)
2. Invoice cards show preview without clicking into dropdown
3. Every report page has both manual editable fields and a working AI button
4. Clicking any calendar day opens a dialog with events + comment input
5. User can download aktiebok PDF, meeting minutes PDF, and dividend receipt PDF
6. Company logo appears on generated invoices and payslips
7. User can upload profile pic or pick emoji → appears in sidebar
8. Stripe checkout is embedded (not redirect to hosted page)
9. Users can download payment receipts from billing page
10. Onboarding ends with AI interview that pre-populates the database

---

## Phase Dependencies

```
Phase 1 (Accounting Spine) ✅ DONE
    ├── Phase 2 (Reports) ✅ DONE
    ├── Phase 3 (Cross-Module) ✅ DONE
    │       └── Phase 4 (UI/UX Cleanup) ✅ DONE
    ├── Phase 5 (Dynamic Data & Hardcode Elimination)
    │       ├── 5.1 Förmåner backend table (CRITICAL)
    │       ├── 5.2 Tax parameters table (CRITICAL)
    │       ├── 5.3 Remove report demo data (CRITICAL)
    │       ├── 5.4 Dynamic dividend tax (HIGH)
    │       ├── 5.5 Dynamic quota value (HIGH)
    │       ├── 5.6 Scalable partner accounts (MEDIUM)
    │       └── 5.7 Configurable mileage rate (LOW)
    └── Phase 6 (Founder Vision UI/UX Gaps)
            ├── 6.1 Bokföring UI (upload, previews, headers)
            ├── 6.2 Löner UI (employee count, prompts)
            ├── 6.3 Årsbokslut manual + AI mode
            ├── 6.4 Kalender day-click dialog
            ├── 6.5 PDF downloads (aktiebok, minutes, receipts)
            ├── 6.6 Company logo + profile picture
            ├── 6.7 Custom Stripe checkout + receipts
            └── 6.8 Onboarding AI interview phase
```

Phases 1-4 are complete. Phase 5 eliminates hardcoded data. Phase 6 closes all remaining UI/UX gaps from the founder vision.

---

## Success Criteria

**Phases 1-4 (Complete):** A user can:
1. ✅ Book a transaction → see proper journal entries in Verifikationer
2. ✅ View Resultaträkning → see real P&L computed from their bookkeeping
3. ✅ Run payroll → see it automatically appear in the ledger
4. ✅ Approve a dividend → see it booked in Verifikationer
5. ✅ View any stat card → see real numbers, not zeros
6. ✅ Use AI to fill in Momsdeklaration → agent fetches real data from the system
7. ✅ Close a month → lock verifications, see summary in Händelser

**Phase 5 (Pending):** Additionally:
8. Change tax year → all rates update automatically
9. Add/remove benefits from a backend catalog
10. No component shows fake placeholder financial numbers

**Phase 6 (Pending):** Full founder vision:
11. Upload and import transactions via Manual or OCR (two modes only)
12. See invoice preview directly on Kanban card
13. Click any calendar day → see events + add comments
14. Download aktiebok PDF, meeting minutes, dividend receipts
15. Company logo on all generated documents
16. Custom branded Stripe checkout (not hosted redirect)
17. AI interviews user during onboarding to pre-populate data
