# Scope AI - Production Roadmap

**Date:** 2026-02-06
**Purpose:** Transform the current prototype (shell + partial logic) into a production-grade Swedish accounting application.
**Methodology:** Synthesized from APP_FEATURE_SPEC.md (founder vision), ACCOUNTING_APP_AUDIT.md (technical gaps), APP_STORYBOARD_2026.md (UX flows), and a full codebase scan (~823 TypeScript files, 52 API routes, 60+ AI tools, Supabase backend with RLS).

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Cross-Cutting Fixes (Affects Everything)](#2-cross-cutting-fixes)
3. [Category-by-Category Fix Plan](#3-category-by-category-fix-plan)
   - 3.1 Onboarding
   - 3.2 Bokforing (Bookkeeping)
   - 3.3 Rapporter (Reports)
   - 3.4 Loner (Payroll)
   - 3.5 Agare & Styrning (Governance)
   - 3.6 Handelser (Events: Manadsavslut, Kalender, Bolagsatgarder, Roadmap)
   - 3.7 Foretagsstatistik (Statistics)
   - 3.8 Installningar (Settings)
   - 3.9 AI Mode
4. [The Final Product - How It All Works Together](#4-the-final-product)
5. [Symbiosis Map - Page-to-Page Data Flows](#5-symbiosis-map)
6. [Implementation Phases](#6-implementation-phases)

---

## 1. EXECUTIVE SUMMARY

### Current State

The app has an impressive shell: 823 TypeScript files, a clean Next.js + Supabase architecture, beautiful UI with Swedish localization, and 60+ AI tool definitions. The **read layer is solid** — reports pull real data from verifications, the BAS chart of accounts (400+ accounts) is correctly defined, and RLS security isolates company data.

But the **write layer is hollow**. The audit reveals:

| Category | Maturity | Key Blocker |
|----------|----------|-------------|
| Onboarding | 10% (Facade) | Only saves company type — all other fields lost |
| Bokforing | 35-45% | No VAT splitting, no sequential verification numbers |
| Rapporter | 40-55% | No closing entries, balance sheet masks errors |
| Loner | 20-30% | Tax hardcoded at 24%, payroll never saves to DB |
| Agare & Styrning | 40-55% | No share numbers (ABL violation), signatures UI-only |
| Handelser | 35-45% | Hardcoded deadlines, audit trail not tamper-proof |
| Statistik | 45-55% | KPI formulas wrong, fiscal year hardcoded |
| AI Mode | 30-40% | 14+ write tools return fake success, never persist |

### What Needs to Happen

Three foundational problems must be solved before anything else:

1. **Onboarding must actually populate the database** — every downstream feature depends on company data (org number, fiscal year, shareholders, accounting method).
2. **The verification engine must become legally compliant** — sequential gap-free numbering (BFL requirement), VAT splitting, and proper double-entry enforcement.
3. **Write operations must persist** — both manual UI actions and AI tool calls must save to the real database.

---

## 2. CROSS-CUTTING FIXES

These issues span the entire application. Fixing them once fixes them everywhere.

### 2.1 Fiscal Year Support

**Problem:** Hardcoded to calendar year (Jan 1 - Dec 31) across statistics, reports, deadlines, and month-closing. ~40% of Swedish companies use non-calendar fiscal years.

**Fix:**
- Add a fiscal year picker in Settings > Foretag (DB field `fiscalYearEnd` exists, just needs UI)
- Create a `useFiscalYear()` hook that reads from CompanyProvider and returns `{ start: Date, end: Date, periods: FiscalPeriod[] }`
- Replace every hardcoded `'${year}-01-01'` / `'${year}-12-31'` with values from this hook
- Affected files: `company-statistics-service.ts`, `use-company-statistics.ts`, `resultatrakning.tsx`, `balansrakning.tsx`, all deadline calculations

### 2.2 Sequential Verification Numbering

**Problem:** Verifications use UUIDs. Swedish law (BFL) requires unbroken gap-free chronological numbering (A1, A2, A3...).

**Fix:**
- Add `verification_number` (serial) and `verification_series` (char) columns to verifications table
- Create a Supabase function `get_next_verification_number(series TEXT)` that atomically assigns the next number
- Series: A (bank/manual), B (customer invoices), C (supplier invoices), D (payroll), E (closing entries)
- Every code path that creates a verification must call this function
- Block deletion of verifications — only allow reversal via a new correcting verification

### 2.3 VAT Splitting Engine

**Problem:** Transaction booking puts 100% of amount to one account. A 1,250 SEK purchase with 25% VAT should split to 1,000 expense + 250 to account 2641.

**Fix:**
- Add VAT rate selector to BookingDialog (25%, 12%, 6%, 0%, custom)
- When a rate is selected, auto-calculate: `net = total / (1 + rate)`, `vat = total - net`
- Generate two journal rows: expense account (net) + VAT account (vat amount)
- VAT account mapping: 25% -> 2641, 12% -> 2642, 6% -> 2643, output: 2611/2621/2631
- Apply the same logic to invoice booking (currently hardcoded to 25%)

### 2.4 Company Data Pipeline (Onboarding -> Settings -> All Features)

**Problem:** Onboarding collects 20+ fields but only saves `companyType`. Invoices show "Ditt Foretag AB", reports use wrong fiscal year, payroll has no personnummer.

**Fix:**
- Wire all onboarding inputs to CompanyProvider with controlled state (react-hook-form)
- Call the existing `/api/onboarding/seed` endpoint (140 lines of working seed logic, never called)
- CompanyProvider already has `saveToDatabase()` with debounce — just needs the inputs connected
- Populate: company name, org number, address, fiscal year, accounting method, VAT frequency, shareholders
- All downstream features read from CompanyProvider — once data is there, invoices show real company info, reports use correct fiscal year, etc.

### 2.5 AI Write Tool Persistence

**Problem:** 14+ AI write tools return `{ success: true }` with fake IDs but never call database services. Audit log records false positives.

**Fix:**
- Each write tool must call the corresponding service layer (`invoiceService.create()`, `transactionService.book()`, etc.)
- The confirmation flow must differentiate preview (return preview data) from execution (persist + return real ID)
- Add `persistedToDb: boolean` to audit log entries
- Connect `createSalaryEntry()` in `salary.ts` to the payroll execution flow (correct code exists but is orphaned)

---

## 3. CATEGORY-BY-CATEGORY FIX PLAN

### 3.1 ONBOARDING (`/onboarding`)

**Current state:** Beautiful 11-step wizard. Only company type saves to DB. Everything else is a facade.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Wire company-info-step inputs to CompanyProvider (name, org-nr, address) | P0 | Medium |
| 2 | Wire shareholders-step to real form + call `/api/onboarding/seed` | P0 | Medium |
| 3 | Wire partners-step for HB/KB with real form state | P0 | Medium |
| 4 | Add org number format validation (XXXXXX-XXXX) | P0 | Small |
| 5 | Add share capital minimum validation (25k for AB) | P1 | Small |
| 6 | Add fiscal year end selection to company-info step | P1 | Small |
| 7 | Add accounting method selection (faktureringsmetod/kontantmetod) | P1 | Small |
| 8 | Add VAT registration toggle and frequency | P1 | Small |
| 9 | Add company logo upload (Supabase Storage) | P2 | Medium |
| 10 | Add Bolagsverket org-nr lookup (auto-fill company data) | P2 | Large |

**Storyboard findings:** Step 4 "Hamta fran Bolagsverket" is just an external link — does not auto-fill. Step 8 (Bank) is a dead-end placeholder. Conditional logic leak: skipped steps show empty frames rather than jumping forward.

**Missing from founder spec:** Phase 3 of onboarding should include "AI Interview" — a Chat with AI phase where the agent interviews the user to gather extra context, then pre-populates the database for a "head start". Also: profile picture upload or emoji selection during onboarding (founder spec: "upload photo or choose emoji").

**End state:** User completes onboarding and the database contains: company identity, fiscal year config, ownership structure (shareholders/partners/members), accounting preferences. AI interview pre-populates additional data. The app is pre-configured and ready.

---

### 3.2 BOKFORING (Bookkeeping)

#### 3.2.1 Transaktioner (`?tab=transaktioner`)

**Current state:** UI works, CSV import works, booking dialog exists but no VAT splitting, no verification linking.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add VAT splitting to BookingDialog (see Cross-cutting 2.3) | P0 | Medium |
| 2 | Link verification_id back to transaction after booking | P0 | Small |
| 3 | Implement server-side pagination (cursor-based) | P1 | Medium |
| 4 | Add date range filter to transaction list | P1 | Small |
| 5 | Normalize status values (currently: "Ej bokford", "TO_RECORD", "pending") | P1 | Small |
| 6 | Add duplicate detection on CSV import (same date + amount + description) | P1 | Medium |
| 7 | Add audit trail (who booked, when, what changed) | P2 | Medium |
| 8 | Improve AI categorization mapping (ICA/Willys -> 4010 not Representation) | P2 | Small |

**Storyboard findings:** BookingDialog forces 1:1 mapping — cannot split mixed purchases (e.g., software + hardware with different tax rules). Manual verification dialog supports multi-row entries but BookingDialog does not. This creates a split experience.

**End state:** Transactions import from CSV/manual entry, get booked with proper VAT splitting to correct BAS accounts (including multi-line splits for mixed purchases), create linked verifications with sequential numbers, and show clear status progression from unbooked to booked.

#### 3.2.2 Fakturor (`?tab=fakturor`)

**Current state:** Creation works, kanban view works. No email sending, no PDF, VAT hardcoded to 25%, seller info hardcoded.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Pull company info from settings for seller details (replace "Ditt Foretag AB") | P0 | Small |
| 2 | Fix VAT booking for mixed rates (per-line VAT accounts: 2611/2621/2631) | P0 | Medium |
| 3 | Add Bankgiro/Plusgiro fields to invoice (from Settings) | P0 | Small |
| 4 | Generate Swedish OCR reference numbers (Luhn algorithm) | P0 | Medium |
| 5 | Implement email sending via Resend API (existing test email works) | P1 | Medium |
| 6 | Add F-skatt notation on invoices | P1 | Small |
| 7 | Generate proper PDF invoices (replace html2canvas with dedicated PDF lib) | P1 | Large |
| 8 | Add overdue auto-detection (compare dueDate with today) | P1 | Small |
| 9 | Add partial payment tracking | P2 | Medium |
| 10 | Add credit note generation (reverse of original invoice) | P2 | Medium |

**End state:** Create legally compliant Swedish invoices with correct VAT per line, OCR reference, Bankgiro, F-skatt, company logo. Send via email. Track status from draft through paid. Payment creates proper journal entry (1930/1510).

#### 3.2.3 Kvitton (`?tab=kvitton`)

**Current state:** Upload works, OCR works. No smart matching to transactions.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add smart receipt-transaction matching (date + amount similarity) | P1 | Medium |
| 2 | Fix OCR VAT calculation (25% VAT = total * 0.2, not total * 0.25) | P1 | Small |
| 3 | Map AI categories to BAS account numbers (Kontorsmaterial -> 6310) | P1 | Small |
| 4 | Add duplicate detection on upload (hash-based) | P2 | Small |
| 5 | Store receipt image reference on verification | P2 | Small |

**Storyboard findings:** Receipt orphanage risk — if a transaction is deleted, the receipt remains "Booked" pointing to a non-existent verification. Multi-currency receipts (e.g., USD) are ignored by OCR/booking logic (no exchange rate handling).

**End state:** Upload receipt (photo/PDF), OCR extracts data, system suggests matching bank transaction, one click to fuse them into a verified booking. Orphaned receipts are detected and flagged.

#### 3.2.4 Inventarier (`?tab=inventarier`)

**Current state:** Registration and monthly depreciation work. Wrong depreciation method and account numbers.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Fix accumulated depreciation account (replace non-existent 1229 with correct 12xx) | P0 | Small |
| 2 | Add declining balance method (rakenskapsenlig 30-regeln) as option alongside straight-line | P1 | Medium |
| 3 | Add salvage/residual value field | P1 | Small |
| 4 | Add zero-value guard (stop depreciating at 0 kr) | P1 | Small |
| 5 | Add disposal/sale workflow with gain/loss calculation | P2 | Medium |

**End state:** Register assets with purchase value, choose depreciation method (straight-line or declining balance), run monthly depreciation that creates correct verifications, track until disposal/sale.

#### 3.2.5 Verifikationer (`?tab=verifikationer`)

**Current state:** Lists entries, but uses UUIDs instead of sequential numbers. No manual creation.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Implement sequential gap-free numbering (see Cross-cutting 2.2) | P0 | Large |
| 2 | Add manual verification creation with multi-row debit/credit entry | P0 | Medium |
| 3 | Add verification series (A/B/C/D/E) | P0 | Medium |
| 4 | Show full journal entry detail with all debit/credit rows in expanded view | P1 | Small |
| 5 | Link supporting documents (receipts/invoices) directly to verifications | P1 | Medium |
| 6 | Add lock indicator for verifications included in submitted reports | P2 | Small |

**End state:** The legally compliant heart of the accounting system. Every financial event creates a numbered, balanced verification. Accountants can create manual entries for adjustments. Full debit/credit visibility. Immutable once included in a filed report.

---

### 3.3 RAPPORTER (Reports)

#### 3.3.1 Resultatrakning (P&L)

**Current state:** Real data from verifications. Correct BAS account ranges. No period selection.

**Storyboard finding (CRITICAL):** The calculator uses simple addition `ebitda = totalRevenue + materialItems + ...`. If the database returns raw credit/debit balances without sign-normalization, the report calculates a completely inverted result. Revenue is typically Credit (negative in DB), costs are Debit (positive). This MUST be verified and fixed.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Verify and fix sign normalization** in FinancialReportCalculator (revenue should be positive, costs negative in display) | P0 | Medium |
| 2 | Add period selector (monthly, quarterly, custom date range) | P0 | Medium |
| 3 | Add formal sub-results: Bruttoresultat, EBITDA, Resultat efter finansiella poster | P1 | Small |
| 4 | Add variance % column in year-on-year comparison | P1 | Small |
| 5 | Add drill-down dialog: click account row -> show underlying verifications (in-page dialog, not URL navigation) | P1 | Medium |
| 6 | Replace hardcoded 20.6% tax with reading from booked tax accounts | P2 | Small |
| 7 | Add Excel/CSV export alongside PDF | P2 | Medium |

#### 3.3.2 Balansrakning (Balance Sheet)

**Current state:** Real cumulative data. Has a "fudge factor" that masks errors.

**Storyboard finding:** The sign logic `acc < 2000 ? -b.balance : b.balance` is brittle — it fails for contra-asset accounts (like 1229 Accumulated Depreciation) which are Credit accounts in the 1xxx range. These will show as negative assets instead of subtractions. The Årsbokslut page also has a separate "plug" that hides imbalances.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Remove balance sheet fudge factor — flag `A != E+L` as error with red banner | P0 | Small |
| 2 | **Fix contra-asset sign handling** (1229 etc. must subtract from assets, not show negative) | P0 | Medium |
| 3 | Add "Arets resultat" to equity section (P&L net income injected into BS) | P0 | Medium |
| 4 | Add arbitrary date balance sheet (not just Dec 31) | P1 | Medium |
| 5 | Add equity roll-forward (opening + net income + dividends + capital changes = closing) | P2 | Medium |
| 6 | Add Balanskontroll audit dialog (compare 1930 vs bank statement, 1510 vs unpaid invoices, 26xx vs VAT report) | P1 | Large |

#### 3.3.3 Momsdeklaration (VAT Report)

**Current state:** Complete SKV 4700 coverage, real data, XML export. Most complete feature.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add schema validation before XML export (match Skatteverket spec) | P1 | Medium |
| 2 | Add "Quick Fix" adjustment inside wizard (create correction verification without leaving) | P1 | Medium |
| 3 | Shift deadlines for Swedish public holidays | P2 | Small |
| 4 | Add VAT reconciliation report (account 26xx vs reported amounts) | P2 | Medium |

#### 3.3.4 Inkomstdeklaration (INK2)

**Current state:** Complete INK2 form with SRU export. Periodiseringsfond management works.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add periodiseringsfond max 25% validation guard | P1 | Small |
| 2 | Fix fiscal year in SRU dialog (currently hardcoded to "2024P4") | P1 | Small |
| 3 | Integrate K10 gransbelopp into dividend tax computation | P2 | Medium |
| 4 | Add loss carry-forward tracking across years | P2 | Medium |

#### 3.3.5 AGI (Employer Declaration)

**Current state:** Summary totals only. No per-employee (individuppgifter) data. Tax hardcoded.

**Storyboard finding (CRITICAL):** The logic `if (row.debit > 0) report.employees += 1` counts verification rows, not unique employees. One employee with multiple pay lines (Salary + Bonus + Travel) is counted multiple times, leading to incorrect employee count in the tax return.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add individuppgifter (KU-data) with per-employee personnummer, salary, tax | P0 | Large |
| 2 | Fix employee count (count unique employees, not salary entries) | P0 | Small |
| 3 | Add age-based employer contribution rates (19-24: 15.49%) | P1 | Medium |
| 4 | Flow benefit values into AGI reporting (currently hardcoded 0) | P1 | Medium |
| 5 | Implement XML schema matching Skatteverket AGI spec | P2 | Large |

#### 3.3.6 Arsredovisning & Arsbokslut (Annual Report & Year-End)

**Current state:** Wizard exists, real P&L and BS data. No closing entries, no notes, no signatures.

**Storyboard finding:** Årsbokslut page (simplified year-end for EF) is shown even for AB companies — needs company type check. Also uses its own account filtering separate from the central Calculator, creating a maintenance risk.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Implement closing entry engine (transfer result to 2099 retained earnings) | P0 | Large |
| 2 | Add pre-closing and post-closing trial balance view | P0 | Large |
| 3 | Add mandatory K2 notes generation (accounting policies, depreciation rates) | P1 | Large |
| 4 | Add board signature fields with name/date capture | P1 | Medium |
| 5 | Add closing balance -> opening balance carryforward for next fiscal year | P1 | Large |
| 6 | Add forvaltningsberattelse auto-generation from company data | P2 | Medium |
| 7 | Add company type check — show Arsbokslut only for EF/HB, Arsredovisning for AB (storyboard finding) | P1 | Small |
| 8 | Unify Arsbokslut account filtering with central FinancialReportCalculator | P1 | Medium |

#### 3.3.7 K10 (Owner Tax Form)

**Current state:** Both calculation methods work. Some account assumptions hardcoded.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Make owner salary account configurable (not hardcoded 7220) | P1 | Small |
| 2 | Track actual acquisition cost per shareholder (not = share capital) | P1 | Medium |
| 3 | Update IBB dynamically (currently fallback to 2024 value) | P1 | Small |
| 4 | Generate K10 PDF matching Skatteverket format | P2 | Large |

---

### 3.4 LONER (Payroll)

**Overall:** Weakest category (20-30%). The core problem: correct salary entry logic exists in `salary.ts` but is never called. Payroll is simulation only.

#### 3.4.1 Team (Employees)

**Storyboard findings:** Employee balances use `v.description.includes(e.name)` regex matching — if verification description doesn't exactly match employee name, balance is invisible on the card. Expenses hardcoded to account 4000 (Goods) regardless of type (bus ticket should be 5800, software should be 5420). Mileage hardcoded to 25 kr/mil — no support for company rates where excess is taxable salary.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add personnummer field (legally required, format validation YYYYMMDD-XXXX) | P0 | Small |
| 2 | Add employment type (tillsvidare/visstid/provanstallning) | P1 | Small |
| 3 | Add per-employee tax table reference (municipality-based, not flat 24%) | P0 | Medium |
| 4 | Add vacation days tracking (Semesterlagen requires this) | P1 | Medium |
| 5 | Add pension scheme field (ITP/SAF-LO) | P2 | Small |
| 6 | Add bank account field (for payment instructions) | P1 | Small |
| 7 | Build full employee profile dossier (salary history, benefits, expenses) | P2 | Large |

#### 3.4.2 Lonebesked (Payslips)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Connect payroll run to database (payslips.create() — currently never called) | P0 | Medium |
| 2 | Connect orphaned `createSalaryEntry()` to payroll execution flow | P0 | Medium |
| 3 | Replace flat 24% tax with Swedish tax table lookup | P0 | Large |
| 4 | Add vacation pay accrual (12% as required by Semesterlagen) | P0 | Medium |
| 5 | Add age-based employer contributions (19-24: 15.49%, standard: 31.42%) | P1 | Medium |
| 6 | Fix sick leave calculation (Day 1 = 80% employee, Days 2-14 = 100% employer) | P1 | Small |
| 7 | Add pension contribution calculation and deduction | P2 | Medium |
| 8 | Add company details (org number, address) to payslip PDF | P1 | Small |

#### 3.4.3 Formaner (Benefits)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Fix company car formula (use Skatteverket method with prisbasbelopp) | P0 | Medium |
| 2 | Flow assigned benefits into payslip gross/deductions | P0 | Medium |
| 3 | Flow taxable benefits into AGI reporting | P0 | Medium |
| 4 | Add friskvard annual limit enforcement (5,000 kr/year) | P1 | Small |
| 5 | Unify AI tool rates and UI component rates (currently contradictory) | P1 | Small |

#### 3.4.4 Delagaruttag (Owner Withdrawals)

**Storyboard findings (CRITICAL):** 1) The "Partner 3 Barrier" — logic `'2013' ? 'p-1' : 'p-2'` hardcodes only two partners. A 3+ owner company has invisible/misattributed data. 2) The `registerTransaction` function treats "lon" (salary) as simple equity withdrawal (Debit 201x, Credit 1930) — violates Swedish accounting standards for AB where salary MUST use expense accounts (7xxx) and tax withholdings. 3) No solvency check — allows withdrawals exceeding free equity (olovlig vinstutdelning).

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Fix salary misclassification** — salary (lon) must use 7210/7220 salary accounts with tax withholding, not 2013 withdrawal | P0 | Medium |
| 2 | **Remove 2-partner hardcoding** — support N partners mapped to proper BAS account ranges | P0 | Medium |
| 3 | Create journal entries for partner withdrawals in HB/KB (debit 2013, credit 1930) | P0 | Medium |
| 4 | Add solvency check — warn if withdrawal exceeds fritt eget kapital (ABL olovlig vinstutdelning) | P0 | Medium |
| 5 | Add forbidden loan detection and warning | P1 | Medium |
| 6 | Surface 3:12 optimization tool in the withdrawal UI (currently AI-only) | P2 | Small |

#### 3.4.5 Egenavgifter (Self-Employment Fees)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Fix rate components (several off by 2-4x vs Skatteverket 2024) | P0 | Small |
| 2 | Unify UI rates with AI tool rates (AI tool has correct values, UI has wrong ones) | P0 | Small |
| 3 | Apply schablonavdrag (25%) in actual calculation (mentioned in UI but never deducted) | P1 | Small |
| 4 | Fix karensdagar reduction (currently 0.76%, should be ~7.5% for 7 days) | P1 | Small |
| 5 | Add income tax estimation to "Kvar efter avgifter" | P2 | Small |

---

### 3.5 AGARE & STYRNING (Governance)

#### 3.5.1 Aktiebok (Share Register)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add aktienummer (share numbers) per ABL 5:2 — fields `shareNumberFrom`/`shareNumberTo` | P0 | Medium |
| 2 | Auto-suggest next available share numbers on Nyemission | P0 | Small |
| 3 | Get quotaValue from company settings (not hardcoded 25 or 100) | P0 | Small |
| 4 | Track actual acquisition price per shareholder (not hardcoded 0) | P1 | Small |
| 5 | Fix share split to multiply existing share counts | P1 | Medium |
| 6 | Add PDF export of share register for legal requests | P1 | Medium |
| 7 | Add fangesshandlingar (transfer deed) document generation | P2 | Large |

#### 3.5.2 Utdelning (Dividends)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Fix debit account (use 2098 Vinstutdelning beslutad, not 2091) | P0 | Small |
| 2 | Add distributable equity check before allowing dividend (ABL 17:3) | P0 | Medium |
| 3 | Implement gransbelopp-based tax (20% up to limit, ~52% above) | P0 | Large |
| 4 | Add per-shareholder distribution (split by ownership %) | P1 | Medium |
| 5 | Add kupongskatt (30% withholding) for non-resident shareholders | P2 | Medium |
| 6 | Show dividend per share calculation on dividend receipt | P1 | Small |

#### 3.5.3 Moten & Protokoll (Meetings)

**Storyboard finding (CRITICAL):** `bookedDecisions` state is local (`useState<string[]>([])`). If user refreshes the page, the "BOKFOR" button reappears for already-booked decisions, causing double-bookings in the ledger. Meeting content stored as `JSON.parse(doc.content)` with no schema enforcement — missing fields crash UI silently.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Persist bookedDecisions to DB** (prevent double-booking on page refresh) | P0 | Medium |
| 2 | Fix kallelse sending (populate actual recipient emails, not empty array) | P0 | Small |
| 3 | Wire saveKallelse to actually call updateDocument (currently shows toast but no save) | P0 | Small |
| 4 | Add JSON schema validation for meeting document content | P1 | Small |
| 5 | Add voting result input fields in meeting protocol | P1 | Medium |
| 6 | Add quorum validation (minimum vote representation per ABL) | P1 | Medium |
| 7 | Update board registry (is_board_member/board_role) from meeting decisions | P1 | Medium |
| 8 | Add statutory deadline warning (stamma within 6 months of FY end) | P2 | Small |

#### 3.5.4 Firmatecknare (Signatories)

**Storyboard finding (LEGAL):** The logic `shareholders.filter(s => s.ownershipPercentage >= 50)` grants "Ensam firmateckning" to majority shareholders. This is LEGALLY INCORRECT for AB — owning 100% of shares does NOT give signing authority unless you are also a board member or appointed proxy. This could mislead users into signing contracts they're not authorized to sign.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Fix signing authority derivation** — remove shareholder ownership as basis for signing rights in AB (must be board member, not just shareholder) | P0 | Medium |
| 2 | Connect "Lagg till" and "Redigera" buttons to actual handlers | P1 | Small |
| 3 | Add VD handling for AB signing authority (ABL 8:29-36) | P1 | Small |
| 4 | Add Prokura (commercial proxy) support | P2 | Medium |
| 5 | Fix EF validFrom (use actual registration date, not hardcoded 2020-01-01) | P2 | Small |
| 6 | Generate Bolagsverket blankett 816 for signatory changes | P2 | Large |

#### 3.5.5 Delagare (Partners - HB/KB)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Create journal entries on partner withdrawals (debit 2013/2023, credit 1930) | P0 | Medium |
| 2 | Add year-end profit distribution mechanism | P1 | Large |
| 3 | Create dedicated partner-service.ts (consistency with shareholder-service) | P2 | Medium |
| 4 | Add partner exit/buyout workflow | P2 | Large |

---

### 3.6 HANDELSER (Events)

**Structural change (per founder spec):** Händelser absorbs Månadsavslut from Bokföring. Arkiv and Tidslinje are replaced by the new Månadsavslut row-per-month layout. URL must change from bookkeeping to events context.

#### 3.6.1 Manadsavslut (Month Closing — MOVED from Bokforing)

**Current state:** Lives under Bokföring. Visual checklist and period locking exist. Checklist is manual checkboxes, no real enforcement. Founder vision: move to Händelser, replace Arkiv & Tidslinje with a row-per-month layout.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Move to Händelser** — update URL routing from bokforing to handelser, remove from bookkeeping tabs | P0 | Medium |
| 2 | **Redesign UI to row-per-month layout** — each month is a collapsible row that expands to show events/timeline for that period (replaces Arkiv quarterly folders + Tidslinje chronological feed) | P0 | Large |
| 3 | Add year switcher centered with simple left/right arrows (founder spec) | P0 | Small |
| 4 | Incorporate filtering system from old Tidslinje into the expanded month view (filter by: Tax, AI, User, System) | P1 | Medium |
| 5 | Enforce period lock in booking API (reject bookings in locked periods) | P0 | Medium |
| 6 | Auto-check "Bankavstamning" based on reconciled transaction count | P1 | Medium |
| 7 | Auto-check "Inget okategoriserat" based on unbooked transaction count | P1 | Small |
| 8 | Add unlock audit trail (log who unlocked, when, why) | P2 | Small |
| 9 | Remove standalone Arkiv and Tidslinje pages (functionality absorbed here) | P1 | Small |

**End state:** Månadsavslut lives under Händelser as the central event tracker. Row-per-month layout with expandable timeline per period. Checklist auto-verifies real data. Locking prevents new bookings. Year navigation with arrows. Replaces both Arkiv and Tidslinje.

#### 3.6.2 Kalender (Calendar)

**Current state:** Calendar with hardcoded 2026 deadlines. No day-click interaction. No personal comments.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Replace hardcoded 2026 deadlines with dynamic fiscal-year-based calculation | P0 | Large |
| 2 | Add complete Swedish deadline calendar (AGI monthly 12th, Moms quarterly, INK2, K10, Bokslut, Arsredovisning, Arsstamma within 6 months of FY end) | P0 | Large |
| 3 | Add day-click dialog showing all events that unfolded on that date (founder spec) | P1 | Medium |
| 4 | Allow users to add personal comments/notes to any day (founder spec) | P1 | Medium |
| 5 | Shift deadlines for Swedish public holidays | P2 | Small |
| 6 | Add deadline alerting (email notifications for upcoming deadlines) | P2 | Medium |

**End state:** Dynamic deadline radar driven by company fiscal year. Clicking any day opens a detailed dialog showing what happened + allows personal notes. Proactive email alerts for approaching deadlines.

#### 3.6.3 Bolagsatgarder (Corporate Actions)

**Current state:** ActionWizard exists but only 1 of 6 action types is enabled. Missing Bolagsverket filing generation.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Enable all corporate action types in UI (Nyemission, Styrelseandring, Roadmap, Likvidation, Bolagsordning) | P1 | Medium |
| 2 | Add state tracking per action (Startad -> Signerad -> Registrerad hos Bolagsverket) | P1 | Medium |
| 3 | Generate Bolagsverket filing instructions/documents for each action type | P2 | Large |
| 4 | Fix Roadmap action dead-end (service failure silently completes wizard without saving) | P1 | Small |

#### 3.6.4 Roadmap (Planering — UI OVERHAUL)

**Current state:** Card-based layout. Founder spec: "The UI/UX needs an overhaul. It should visually resemble a proper roadmap (linear progression), rather than a collection of cards."

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Redesign from cards to vertical stepper** — show Completed, Active, and Future steps as a linear progression (founder spec) | P0 | Large |
| 2 | Add step interaction: each milestone (e.g., "Hire first employee") has its own sub-checklist | P1 | Medium |
| 3 | Add "Ny Roadmap" dialog with templates: "Startup Setup", "Scale-up AB", "Liquidation" (founder spec) | P1 | Medium |
| 4 | Connect roadmap milestones to real data (e.g., "First payroll" auto-completes when a payslip is created) | P2 | Large |

**End state:** Visual linear progression roadmap. Users create plans from templates, track milestones with sub-checklists. Some milestones auto-complete based on real app data.

#### 3.6.5 Cross-Cutting Handelser Fixes

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add category and status filtering across all events (find "all tax events") | P1 | Medium |
| 2 | Add full-text search across events | P1 | Medium |
| 3 | Fix getActivitySummaryTool (replace mock data with real DB aggregation) | P1 | Small |
| 4 | Add export capability (PDF/CSV for auditor review) | P2 | Medium |
| 5 | Implement hash-based immutable audit chain (BFL compliance) | P2 | Large |
| 6 | Unify events table and activity_log into a single audit system | P2 | Large |

---

### 3.7 FORETAGSSTATISTIK (Statistics)

**Missing feature (founder spec):** Transaktionsrapport tab — a cash flow table showing Date, Counterparty, Account, In/Out, Balance. Smart grouping of recurring transactions (e.g., "10x Spotify" → single line with expander). Includes a dedicated "Stall en fraga" (Ask AI) input for contextual analysis.

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Fix kassalikviditet formula (divide by current liabilities 24xx-29xx, not total) | P0 | Small |
| 2 | Fix soliditet formula (use booked equity from 20xx, not computed assets-liabilities) | P0 | Small |
| 3 | Implement fiscal year support in all statistics calculations | P0 | Medium |
| 4 | Fix expense category data structure mismatch (references wrong `acc.account.type`) | P0 | Small |
| 5 | Separate account classifications (4xxx=COGS, 5-6xxx=operating, 7xxx=depreciation, 8xxx=financial) | P1 | Medium |
| 6 | Remove hardcoded "+5" from MembersStats | P1 | Small |
| 7 | Fix pendingVat in company stats AI tool (replace hardcoded 0 with real query) | P1 | Small |
| 8 | Add error indicators when API fails (don't silently show 0) | P2 | Small |

---

### 3.8 INSTALLNINGAR (Settings)

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Add fiscal year end picker to Company tab | P0 | Small |
| 2 | Add F-skatt registration toggle | P1 | Small |
| 3 | Add SNI-kod (industry classification) field | P1 | Small |
| 4 | Add company logo upload (Supabase Storage) | P1 | Medium |
| 5 | Add Bankgiro/Plusgiro fields (flow to invoices) | P0 | Small |
| 6 | Add employer registration toggle (enables payroll features) | P1 | Small |
| 7 | Fix avatar upload (button exists, no file handler) | P2 | Small |
| 8 | Implement or remove bank integrations tab (erodes trust as "coming soon") | P2 | Large |
| 9 | Implement or remove billing tab (currently `alert()` for credits) | P2 | Large |
| 10 | Remove mock security tab (2FA/sessions hardcoded) | P2 | Small |
| 11 | Add email template editor for invoices and payslips (founder spec: "Templates Editor") | P2 | Medium |
| 12 | Add SPF/DKIM domain verification for custom sender email (founder spec: "Custom Domain") | P2 | Large |
| 13 | Add profile picture upload or emoji selection (founder spec) | P2 | Medium |
| 14 | Add "Download backup" prompt before data destruction (Nollstall data) | P1 | Small |
| 15 | Add warning when switching accounting method (faktura/kontant) mid-year — catastrophic for ledger | P1 | Small |

---

### 3.9 AI MODE

| # | Fix | Priority | Effort |
|---|-----|----------|--------|
| 1 | Implement persistence for top write tools: `create_transaction`, `categorize_transaction`, `create_invoice`, `create_receipt` | P0 | Large |
| 2 | Fix confirmation -> execution flow (check confirmationId, persist on second call) | P0 | Medium |
| 3 | Implement `get_income_statement` and `get_balance_sheet` report tools | P1 | Medium |
| 4 | Fix audit logging (add `persistedToDb` field) | P1 | Small |
| 5 | Add Swedish tax rules to system prompt (K10, reverse charges, deadlines) | P1 | Medium |
| 6 | Add BAS account selection guidance to system prompt | P1 | Medium |
| 7 | Connect `transfer_shares` tool to real shareholderService | P1 | Small |
| 8 | Implement SIE export tool | P2 | Large |
| 9 | Call existing input validation (validateChatMessages, validateTokenLimits) | P2 | Small |
| 10 | Add debit/credit balance validation in backend before saving verifications | P1 | Small |

---

## 4. THE FINAL PRODUCT

Once all fixes are implemented, here is how Scope AI works as a complete accounting application.

### 4.1 The User Journey

**Step 1: Signup & Onboarding**
New user signs up, selects a plan, enters onboarding. Over 11 steps they provide: company type (AB/EF/HB/KB/Forening), organization number (auto-fills company data from Bolagsverket), address, fiscal year, accounting method, VAT settings, shareholders/partners with ownership percentages and share numbers, optionally import SIE file from previous accounting system, upload company logo, and invite team members. When they click "Aktivera Konto", the seed API populates the entire database: shareholders table, share register with sequential aktienummer, fiscal year deadlines in the calendar, and initial account balances if SIE was imported. The app is ready.

**Step 2: Daily Bookkeeping**
The user imports bank transactions via CSV or enters them manually. For each unbooked transaction, they open the BookingDialog which suggests a BAS account via AI pattern matching. They select the VAT rate (25/12/6/0%) and the system auto-splits the amount into net expense + VAT. Clicking "Bokfor" creates a verification with sequential numbering (e.g., A47), links it back to the transaction, and updates the status to "Bokford". Receipts can be uploaded separately, OCR-extracted, and fused with their matching transaction for a complete audit trail.

Invoices are created with the company's real details (name, org number, address, Bankgiro, F-skatt notation), correct per-line VAT, and a generated OCR reference number. Sending an invoice emails the PDF to the customer. When payment arrives, marking it as paid creates the journal entry clearing the receivable.

**Step 3: Monthly Closing**
At month end, the user opens Manadsavslut (under Handelser — the central event hub). The row-per-month layout shows each month's status. Expanding a month reveals its timeline with filtering (Tax, AI, User, System events). The checklist auto-verifies: all transactions booked? Bank balance reconciled? VAT reported? AGI submitted? Once all checks pass (or are manually overridden with notes), the period is locked. No further bookings can be made in that date range. Year navigation uses simple left/right arrows.

**Step 4: Quarterly/Annual Reporting**
VAT declarations are generated from real account balances, reviewed in the interactive SKV 4700 wizard, and exported as XML for Skatteverket. The employer declaration (AGI) includes per-employee data with personnummer and municipality-based tax amounts.

At year-end, the closing entry engine runs: transfers net income to retained earnings (2099), creates closing verifications, generates pre-closing and post-closing trial balances. The arsredovisning wizard then produces the K2 annual report with mandatory notes, management report, and board signature fields. SRU files for inkomstdeklaration (INK2) are generated with correct tax adjustments and periodiseringsfond tracking.

**Step 5: Governance**
For AB companies, the aktiebok tracks every shareholder with numbered shares (1-500 A-aktier, 501-1000 B-aktier). The bolagsstamma module manages meeting lifecycle: plan -> send kallelse (notice with real email delivery) -> conduct meeting with voting records -> sign protocol. Dividend decisions flow through proper 3-step workflow: check distributable equity -> decide amount per share -> book journal entry (2098/1930) with correct tax (20% up to gransbelopp, progressive above).

**Step 6: AI Co-Pilot**
Throughout all of this, the AI sidebar is a fully capable co-pilot. It reads real data from every module. When the user says "kontera januari", it creates a walkthrough of unbooked transactions with suggested accounts. When they say "skapa en faktura till Acme AB for 50 000 kr", it creates a real invoice that persists in the database. When they ask "hur mycket utdelning kan jag ta?", it calculates the K10 gransbelopp using real salary data and ownership percentages.

The AI remembers user preferences across conversations (simple vs advanced mode, common questions, pending decisions) through the user memory system.

### 4.2 Compliance Guarantees

When production-ready, the app satisfies:

| Requirement | How |
|-------------|-----|
| **BFL (Bokforingslagen)** | Sequential gap-free verification numbering, immutable event audit trail, 7-year retention |
| **ABL (Aktiebolagslagen)** | Numbered shares in aktiebok, distributable equity check for dividends, quorum validation for meetings |
| **Semesterlagen** | 12% vacation pay accrual on every payslip |
| **SKV (Skatteverket)** | Correct SKV 4700 XML for VAT, individuppgifter in AGI, SRU export for INK2, municipality-based tax tables |
| **K2/ÅRL** | Mandatory notes in annual report, closing entries, board signatures |

---

## 5. SYMBIOSIS MAP

This is how pages and features feed into each other. The accounting system is not a collection of isolated tools — it is an interconnected web where data flows from entry to reporting.

### 5.1 The Core Data Flow

```
ONBOARDING
  |
  ├── Company Identity ──────────> Invoices (seller info), Reports (header), Settings
  ├── Fiscal Year ───────────────> Statistics, Reports, Deadlines, Month-Closing
  ├── Shareholders ──────────────> Aktiebok, K10, Utdelning, Firmatecknare
  ├── Accounting Method ─────────> Transaction booking logic (faktura vs kontant)
  └── SIE Import ────────────────> Transactions, Verifications (historical data)
```

### 5.2 Bookkeeping -> Everything

```
TRANSAKTIONER (Bank events)
  │
  ├─ [Booking] ──> VERIFIKATIONER (creates sequential journal entry)
  │                    │
  │                    ├──> RESULTATRAKNING (sums 3-8xxx accounts)
  │                    ├──> BALANSRAKNING (sums 1-2xxx accounts)
  │                    ├──> MOMSDEKLARATION (sums 26xx VAT accounts)
  │                    ├──> STATISTIK (calculates KPIs from account balances)
  │                    └──> HANDELSER > MANADSAVSLUT (counts verifications per period)
  │
  ├─ [Match] ───> KVITTON (receipt fused with transaction = complete underlag)
  │
  └─ [Link] ───> FAKTUROR (payment matched to invoice clears receivable/payable)

FAKTUROR (Customer invoices)
  │
  ├─ [Create] ──> Uses company data from INSTALLNINGAR (seller info, Bankgiro)
  ├─ [Send] ────> Email via EPOST settings
  ├─ [Pay] ─────> Creates verification in VERIFIKATIONER (1930/1510)
  └─ [Overdue] ─> Flagged in STATISTIK dashboard, HANDELSER timeline
```

### 5.3 Payroll -> Tax Reporting

```
TEAM (Employee registry)
  │
  ├── personnummer ────────> AGI (individuppgifter)
  ├── tax table ───────────> LONEBESKED (tax calculation)
  └── start date ──────────> STATISTIK (antal anstallda)

LONEBESKED (Payslip creation)
  │
  ├─ [Run Payroll] ──> Creates VERIFIKATIONER via createSalaryEntry()
  │                        Debit 7010 (salary expense)
  │                        Debit 7510 (employer contrib expense)
  │                        Credit 2710 (tax liability)
  │                        Credit 2730 (employer contrib liability)
  │                        Credit 1930 (bank - net pay)
  │
  ├─ [Benefits] ────> FORMANER values flow into gross pay + AGI reporting
  │
  ├─ [Overtime] ────> Calculated from TEAM data (hours * rate)
  │
  └─ [Vacation] ────> 12% accrual: Debit 7090, Credit 2920

LONEBESKED ──> AGI (monthly employer declaration)
  │
  ├── Sum of gross salaries
  ├── Sum of tax deductions (per employee)
  ├── Sum of employer contributions (age-adjusted)
  └── Benefit values (taxable)
```

### 5.4 Governance -> Reports -> Bookkeeping

```
AKTIEBOK (Share register)
  │
  ├── Ownership % ─────────> K10 (gransbelopp calculation)
  ├── Share capital ────────> BALANSRAKNING (account 2081)
  └── Transactions ────────> VERIFIKATIONER (nyemission: 1930/2081/2097)

UTDELNING (Dividends)
  │
  ├── Check fritt eget kapital ──> BALANSRAKNING (must have distributable equity)
  ├── Calculate per-share amount ──> AKTIEBOK (total shares, ownership %)
  ├── Check gransbelopp ──> K10 (tax threshold)
  ├── Book decision ──> VERIFIKATIONER (Debit 2098, Credit 2898)
  ├── Book payment ──> VERIFIKATIONER (Debit 2898, Credit 1930)
  └── Record in minutes ──> MOTEN (stamma decision)

MOTEN & PROTOKOLL (Meetings)
  │
  ├── Dividend decisions ──> UTDELNING (triggers booking)
  ├── Board election ──> FIRMATECKNARE (updates signing authority)
  ├── Salary decisions ──> K10 (owner salary affects gransbelopp)
  └── Signed protocol ──> HANDELSER (event logged)
```

### 5.5 Events & Deadlines -> Everything

```
HANDELSER (Events)
  │
  ├── MANADSAVSLUT (moved from Bokforing — replaces Arkiv & Tidslinje)
  │   ├── Row-per-month layout with expandable timeline per period
  │   ├── Period locking ──> Blocks VERIFIKATIONER from booking in locked months
  │   ├── Auto-checks ──> Reads from TRANSAKTIONER, MOMSDEKLARATION, AGI
  │   └── Year navigation with left/right arrows
  │
  ├── KALENDER (Deadline Radar)
  │   ├── Moms deadline (12th/17th) ──> Triggers warning on MOMSDEKLARATION page
  │   ├── AGI deadline (12th monthly) ──> Triggers warning on AGI page
  │   ├── INK2 deadline (annually) ──> Triggers warning on INKOMSTDEKLARATION page
  │   ├── Arsredovisning deadline ──> Triggers warning on ARSREDOVISNING page
  │   ├── Arsstamma deadline (6 months after FY end) ──> MOTEN page warning
  │   └── Day-click ──> Dialog showing all events + personal comments
  │
  ├── BOLAGSATGARDER (Corporate Actions)
  │   ├── Nyemission ──> AKTIEBOK + VERIFIKATIONER
  │   ├── Styrelseandring ──> FIRMATECKNARE + MOTEN
  │   └── State tracking: Startad -> Signerad -> Registrerad hos Bolagsverket
  │
  ├── ROADMAP (Planering — vertical stepper)
  │   ├── Milestone sub-checklists linked to real app data
  │   └── Templates: Startup Setup, Scale-up AB, Liquidation
  │
  └── All events link back to source:
      ├── "Invoice FAK-001 created" -> links to FAKTUROR
      ├── "Payroll January completed" -> links to LONEBESKED
      ├── "VAT Q4 submitted" -> links to MOMSDEKLARATION
      └── "Board meeting held" -> links to MOTEN
```

### 5.6 Year-End: The Grand Convergence

Year-end closing is where every module comes together:

```
ARSBOKSLUT (Year-End Closing)
  │
  ├── 1. Run final depreciation ──> INVENTARIER → VERIFIKATIONER
  ├── 2. Book vacation accrual ──> LONEBESKED → VERIFIKATIONER
  ├── 3. Close VAT for Q4 ──> MOMSDEKLARATION → VERIFIKATIONER
  ├── 4. Review trial balance ──> All VERIFIKATIONER summed by account
  ├── 5. Create closing entries ──> Transfer 8999 → 2099 (retained earnings)
  ├── 6. Generate pre/post trial balance
  │
  └── Feeds into:
      ├── ARSREDOVISNING (annual report with K2 format)
      ├── INKOMSTDEKLARATION (INK2 with SRU export)
      ├── K10 (gransbelopp for next year's dividend)
      └── Opening balances for next fiscal year
```

### 5.7 AI Mode: The Universal Interface

```
AI CO-PILOT
  │
  ├── READ (all production-ready):
  │   ├── "Visa mina transaktioner" ──> get_transactions
  │   ├── "Hur ser balansrakningen ut?" ──> get_balance_sheet_summary
  │   ├── "Vilka kunder har inte betalat?" ──> get_overdue_invoices
  │   ├── "Hur manga aktier har jag?" ──> get_share_register_summary
  │   └── "Vad ar mina KPIs?" ──> get_company_statistics
  │
  ├── WRITE (must be connected to persistence):
  │   ├── "Kontera januari" ──> categorize_transaction → update DB
  │   ├── "Skapa faktura till Acme" ──> create_invoice → invoiceService.create()
  │   ├── "Kor lonerna for februari" ──> run_payroll → payslips.create() + createSalaryEntry()
  │   ├── "Registrera utdelning 100k" ──> register_dividend → proper 3-step flow
  │   └── "Exportera SIE" ──> export_sie → generate .se file
  │
  └── ADVISORY (scenarios + memory):
      ├── "Hur mycket utdelning kan jag ta?" ──> K10 calc + memory of previous decisions
      ├── "Ar jag redo att stanga november?" ──> checks month-closing prerequisites
      └── "Vad borde jag gora innan arsbokslut?" ──> roadmap template + deadline check
```

---

## 6. IMPLEMENTATION PHASES

### Phase 0: Foundation (Weeks 1-2)
**Goal:** Make onboarding populate the database and verification numbering legal.

- Wire onboarding inputs to CompanyProvider + seed API
- Implement sequential verification numbering with series
- Add fiscal year picker to Settings
- Create `useFiscalYear()` hook

**Success metric:** A new user completes onboarding and sees their real company data everywhere.

### Phase 1: Core Bookkeeping (Weeks 3-5)
**Goal:** Make the bookkeeping engine production-grade.

- Add VAT splitting to BookingDialog (including multi-line splits)
- Link verifications back to transactions
- Pull company info into invoices (replace hardcoded seller)
- Add Bankgiro/OCR to invoices
- Fix depreciation accounts and methods
- Add manual verification creation
- Fix P&L sign normalization and Balance Sheet contra-asset handling

**Success metric:** A user can import transactions, book them with correct VAT splitting, create and send legally compliant invoices, and see accurate financial reports.

### Phase 2: Payroll Engine (Weeks 6-8)
**Goal:** Replace the simulation payroll with a real engine.

- Add personnummer to employee records
- Implement Swedish tax table lookup (replace flat 24%)
- Connect `createSalaryEntry()` to payroll flow
- Add vacation pay accrual (12%)
- Make payroll save to database
- Flow benefits into payslips
- Add individuppgifter to AGI

**Success metric:** Run payroll, generate legally compliant payslips with correct tax, create journal entries, submit AGI with per-employee data.

### Phase 3: Reports & Year-End (Weeks 9-11)
**Goal:** Make reports accurate and year-end possible.

- Add period selector to P&L and Balance Sheet
- Remove balance sheet fudge factor, add error flagging
- Implement closing entry engine
- Add trial balance views
- Add mandatory K2 notes
- Fix K10 account mappings
- Fix egenavgifter rates

**Success metric:** Close a fiscal year, generate annual report, export INK2 SRU, calculate K10 gransbelopp — all from real data.

### Phase 4: Governance & Events (Weeks 12-14)
**Goal:** Make governance legally compliant. Move Månadsavslut to Händelser. Rebuild Roadmap UI.

- Add aktienummer to share register
- Fix dividend accounts and add equity check
- Fix firmatecknare derivation (remove shareholder ownership fallacy)
- Persist bookedDecisions in meetings to prevent double-booking
- Fix kallelse sending (real email recipients)
- **Move Månadsavslut from Bokföring to Händelser** with row-per-month layout
- Replace hardcoded deadlines with fiscal-year-based calculation
- **Rebuild Roadmap UI from cards to vertical stepper**
- Add day-click dialog to Kalender
- Enable all corporate action types
- Fix partner limit (support N partners, not just 2)
- Fix owner withdrawal salary misclassification

**Success metric:** Manage share register per ABL, hold meetings with proper notice, distribute dividends correctly. Händelser is the central event hub with Månadsavslut, dynamic deadline calendar, corporate actions, and a proper linear Roadmap.

### Phase 5: AI Write Layer (Weeks 15-16)
**Goal:** Make the AI a true co-pilot that can take action.

- Connect top write tools to database services
- Fix confirmation -> execution flow
- Implement report generation tools
- Add Swedish tax knowledge to system prompt
- Fix audit logging

**Success metric:** User says "kontera alla transaktioner i mars" and AI actually books them. Says "skapa faktura" and a real invoice appears in the database.

### Phase 6: Polish & Compliance (Weeks 17-19)
**Goal:** Final pass for production readiness.

- Add hash-based immutable audit chain
- Add email sending for invoices
- Generate proper PDF documents
- Add company logo throughout
- Fix statistics KPI formulas
- Remove all mock/hardcoded data from UI
- Implement or remove placeholder features (bank integration, billing, security)

**Success metric:** An accountant can use the app for a real Swedish business without encountering fake data, wrong calculations, or missing legal requirements.

---

*This document should be treated as the living blueprint for taking Scope AI from prototype to production. Each fix is scoped, prioritized, and connected to the broader vision of a fully functional Swedish accounting application.*
