# Scope AI - Full Accounting App Audit

> **Goal:** Transform this from a demo/prototype into a real accounting application that competes with Bokio/Visma.
> Each category is audited from an accountant's perspective - every page, every feature, every calculation.

---

## PHASE 1: BOKFÖRING (Bookkeeping)

**Pages:** Transaktioner, Fakturor, Kvitton, Inventarier, Verifikationer, Månadsavslut

---

### 1.1 TRANSAKTIONER (Transactions)

**Files:** `src/components/bokforing/transaktioner/`, `src/app/api/transactions/`, `src/services/transaction-service.ts`

#### What Works
- Three-step booking flow (details → account selection → confirm) - good UX
- BAS account list with 32 accounts covering common Swedish business scenarios
- CSV/Excel bulk import with flexible column detection
- Z-rapport OCR import via GPT-4o-mini (smart for POS retailers)
- React Query with optimistic updates and rollback
- Asset registration detection for high-value items (switches to 1210)
- Status filtering (Att bokföra, Bokförd, Saknar underlag, Ignorerad)
- RLS security via user-scoped DB

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No VAT splitting** | CRITICAL | Entire amount goes to one debit/credit pair. A 1200 SEK purchase with 25% VAT should split: 960 to expense, 240 to 2641 (input VAT). Currently books all 1200 to expense. |
| 2 | **Verification not linked to transaction** | CRITICAL | `verification_id` is created but never stored on transaction record (commented out in code). Can't trace back from transaction to its journal entry. |
| 3 | **No audit trail** | HIGH | No logging of who booked, when, or what changed. No previous-value tracking. |
| 4 | **Client-side pagination only** | HIGH | Fetches ALL transactions then slices client-side. Will fail with >5000 transactions. |
| 5 | **AI categorization is pattern-matching, not ML** | MEDIUM | Hardcoded vendor name → category mapping (40+ rules). Confidence scores are fake (hardcoded 30-95). Groceries (ICA/Willys) misclassified as "Representation". |
| 6 | **Status inconsistency** | MEDIUM | New manual: "Ej bokförd", Processed: "TO_RECORD" constant, Z-rapport: "pending". No normalization. |
| 7 | **Amount type confusion** | MEDIUM | `amount` is sometimes string ("1 500 kr"), sometimes number. Risk of parsing failures. |
| 8 | **No bank API integration** | HIGH | No direct bank connection. Users must manually import CSV or enter transactions. |
| 9 | **No duplicate detection** | MEDIUM | CSV import can create duplicates with no warning. |
| 10 | **No date range filter** | LOW | Only search and status filters available. Missing date, amount, category, account filters. |

#### Missing vs Bokio/Visma
- Bank API auto-import (Tink/Plaid integration)
- VAT rate selection and automatic splitting
- Bank reconciliation view
- Invoice → payment matching
- Budget vs actual comparison
- Export to SIE format
- Audit trail / change log

---

### 1.2 FAKTUROR (Invoices)

**Files:** `src/components/bokforing/fakturor/`, `src/app/api/invoices/`, `src/app/api/supplier-invoices/`

#### What Works
- Invoice creation with line items, VAT rates per line (0%, 6%, 12%, 25%)
- Sequential gap-free numbering (FAK-2025-0001 format)
- Multi-currency support (SEK/EUR/USD/GBP/NOK/DKK)
- Configurable payment terms (10/15/30/45/60 days)
- Supplier invoice AI extraction (PDF/image → structured data)
- Kanban board view with status columns
- Dual view: customer invoices + supplier invoices unified
- Payment marking creates proper journal entries (1930 ↔ 1510)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **VAT booking hardcoded to 25%** | CRITICAL | Invoice booking calculates VAT as `total - (total / 1.25)` regardless of actual line item rates. Mixed-rate invoices (25% + 12% + 0%) create WRONG entries. Always posts to 2611, never 2620/2630. |
| 2 | **No email sending** | CRITICAL | "Skicka faktura" only changes status to "Skickad". No email ever sent to customer. Customer can't receive the invoice. |
| 3 | **Missing Bankgiro/Plusgiro** | CRITICAL | No bank account numbers displayed on invoice. Customer can't pay. |
| 4 | **Missing OCR reference** | HIGH | No Swedish OCR reference number generation. Can't match bank payments to invoices. |
| 5 | **Missing F-skatt notation** | HIGH | No reverse VAT support. EU B2B supplies not handled. |
| 6 | **Seller info hardcoded** | HIGH | Shows "Ditt Företag AB" / "559123-4567" instead of actual company data from settings. |
| 7 | **No supplier invoice VAT extraction** | HIGH | Supplier booking puts entire amount to expense. Should split: cost account + input VAT (2640). |
| 8 | **No partial payment tracking** | MEDIUM | All-or-nothing payment. Can't record partial payments. |
| 9 | **No credit notes** | MEDIUM | `void_invoice` AI tool defined but no implementation for credit note generation. |
| 10 | **No PDF export** | MEDIUM | Only DOM-based html2canvas export. No dedicated professional invoice PDF with QR code, window-envelope layout. |
| 11 | **No soft delete / 7-year retention** | MEDIUM | Invoices can be permanently deleted. Swedish law requires 7-year retention of accounting records. |

#### Missing vs Bokio/Visma
- Email delivery with PDF attachment
- Payment reminders (automated)
- OCR reference generation (Swedish standard)
- Bankgiro/Plusgiro/Swish payment info on invoice
- QR code for Swish payment
- Window-envelope compatible PDF layout
- Credit note generation
- Recurring/subscription invoices
- Customer portal
- Revenue recognition

---

### 1.3 KVITTON (Receipts)

**Files:** `src/components/bokforing/kvitton/`, `src/services/receipt-service.ts`, `src/app/api/ai/extract-receipt/`

#### What Works
- Receipt upload with file storage
- GPT-4o Vision OCR extraction (supplier, date, amount, category, VAT)
- Per-field confidence scores from OCR
- Receipt list with search, status filter, date range filter
- Pagination (20 items per page)
- Status workflow: Väntar → Verifierad → Bokförd

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No receipt-transaction auto-matching** | HIGH | User must manually select matching transaction in dialog. No intelligent matching algorithm. |
| 2 | **OCR VAT calculation wrong** | HIGH | Comment says "25% VAT means moms = total * 0.2" which confuses gross/net calculation. |
| 3 | **Category stores only ID, not name** | MEDIUM | `category_id` field stored but no lookup to actual category name. Shows ID in UI. |
| 4 | **No duplicate detection** | MEDIUM | Same receipt can be uploaded multiple times. |
| 5 | **No AI → BAS account mapping** | MEDIUM | AI suggests categories (Kontorsmaterial, Programvara) but no mapping to BAS account numbers (6310, 6540). |
| 6 | **No org number capture** | LOW | Receipt OCR doesn't extract supplier org number. |
| 7 | **No feedback loop** | LOW | Can't approve/reject AI suggestions to improve future accuracy. |

#### Missing vs Bokio/Visma
- Smart matching (amount + date + description similarity)
- Receipt image stored on verification
- Multi-receipt batch upload
- Duplicate detection
- Receipt → account suggestion based on vendor history

---

### 1.4 INVENTARIER (Fixed Assets)

**Files:** `src/components/bokforing/inventarier/`, `src/services/inventarie-service.ts`

#### What Works
- Asset registration (name, category, purchase date, price, useful life)
- Monthly depreciation booking
- Grid display with total value calculation
- Category breakdown statistics

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Wrong depreciation method** | CRITICAL | Uses straight-line monthly only. Swedish standard for machinery/inventory is typically **declining balance** (20% or 30% pool method / räkenskapsenlig avskrivning). Must offer both methods. |
| 2 | **Wrong account number for accumulated depreciation** | CRITICAL | Credits to account 1229 which doesn't exist in standard BAS. Should use appropriate 12xx accumulated depreciation contra-account. |
| 3 | **No salvage value** | HIGH | Depreciates to zero. Should allow residual/salvage value. |
| 4 | **No disposal/sale workflow** | HIGH | `status: 'såld'` exists but no sale price capture, no gain/loss calculation, no reversal of accumulated depreciation. |
| 5 | **No depreciation schedule** | MEDIUM | Can't see planned depreciation per asset over its lifetime. |
| 6 | **No asset numbering** | MEDIUM | No serial tracking, no IMEI/barcode, no location. |
| 7 | **No mid-year additions** | LOW | Depreciates from purchase date but doesn't prorate for partial first year. |

#### Correct Swedish Depreciation Rules
- **Räkenskapsenlig avskrivning (30-regeln):** Max 30% declining balance on book value
- **Räkenskapsenlig avskrivning (20-regeln):** Straight-line over 5 years (20%/year)
- **Restvärdemetoden:** Declining balance at higher rates for tax purposes
- Must offer user choice of method per asset category

---

### 1.5 VERIFIKATIONER (Verifications / Journal Entries)

**Files:** `src/components/bokforing/verifikationer/`, `src/hooks/use-verifications.ts`, `src/app/api/verifications/`

#### What Works
- Double-entry bookkeeping structure (debit/credit rows per verification)
- Grid display with filtering by account, search, class
- Status badges (transaction linked, underlag exists/missing)
- Bulk export/print actions
- Verification data stored in DB with RLS

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No sequential verification numbering** | **CRITICAL / ILLEGAL** | Uses UUID/transaction ID as "verification number". **Swedish law (BFL) REQUIRES unbroken, gap-free, chronological verification numbering.** This single issue makes the app non-compliant for any Swedish business. |
| 2 | **Verifications derived from transactions, not independent** | CRITICAL | No separate verification creation. Verification list is just a view of booked transactions, not a proper journal. |
| 3 | **No manual verification creation** | HIGH | Accountants need to create manual journal entries (periodiseringar, rättelser, bokslutsjusteringar). Dialog only links existing transactions. |
| 4 | **Individual view doesn't show debit/credit rows** | HIGH | Shows single amount per line instead of full journal entry with debit/credit breakdown. |
| 5 | **No verification approval workflow** | MEDIUM | No attestation, no posted/unposted distinction, no approval signature. |
| 6 | **No verification series** | MEDIUM | All verifications in one series. Should support A (manual), B (bank), C (invoices), etc. |
| 7 | **No attachment per verification** | MEDIUM | Attachments are on underlag, not directly on verification. Can't see supporting document from verification view. |

#### What Must Change for Legal Compliance
- Implement auto-incrementing verification number (A1, A2, A3...) with gap-free guarantee
- Add manual verification creation with multi-row debit/credit entry
- Show full journal entry detail with all rows
- Add verification series (A, B, C, etc.)
- Link supporting documents directly to verifications
- Add approval/attestation workflow

---

### 1.6 MÅNADSAVSLUT (Month Closing)

**Files:** `src/components/bokforing/month-closing.tsx`, `src/hooks/use-month-closing.ts`

#### What Works
- 12-month timeline with visual status indicators (open/review/locked)
- Period locking/unlocking
- Pre-closing checklist: Bank reconciliation, VAT reporting, Employer declarations, All categorized
- Verification count and discrepancy stats per period
- Locked periods prevent further changes

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Checklist is manual checkboxes** | MEDIUM | "Bankavstämning" checkbox doesn't actually verify bank balance matches. Just a manual tick. Should auto-check based on real data. |
| 2 | **No actual period enforcement** | HIGH | Locking a period should prevent new bookings in that date range. Need to verify if booking API checks period lock status. |
| 3 | **No period-specific reports** | MEDIUM | Can't generate month-specific trial balance or P&L for the period being closed. |
| 4 | **Stats may be from local state** | MEDIUM | `useMonthClosing` hook - need to verify if verification count comes from real DB query or local state. |

---

### PHASE 1 SUMMARY: BOKFÖRING

#### Overall Maturity: PROTOTYPE → EARLY BETA (35-45% production-ready)

#### Top 10 Must-Fix Items (Prioritized)

1. **Implement sequential gap-free verification numbering** (BFL legal requirement)
2. **Add VAT splitting to transaction booking** (split expense + input VAT)
3. **Fix invoice booking for mixed VAT rates** (per-rate account posting)
4. **Implement email sending for invoices** (customers can't receive invoices)
5. **Add Bankgiro/Plusgiro/OCR to invoices** (customers can't pay)
6. **Fix depreciation method** (add declining balance / räkenskapsenlig avskrivning)
7. **Fix depreciation account numbers** (replace non-existent 1229)
8. **Link verification_id to transactions** (uncomment and persist)
9. **Add manual verification creation** (accountants need this daily)
10. **Pull company info from settings for invoices** (remove hardcoded seller info)

#### Architecture Strengths
- Clean separation of concerns (UI / API / DB)
- RLS security for company isolation
- TypeScript throughout
- React Query for data management
- BAS chart of accounts correctly defined
- AI tool definitions well-structured

#### Architecture Gaps
- No SIE export (standard Swedish accounting file format)
- No bank API integration layer
- No email/notification service
- No audit trail / event sourcing
- No document management (PDF storage, linking)
- Client-side pagination won't scale

---

## PHASE 2: RAPPORTER (Reports)

**Pages:** Resultaträkning, Balansräkning, Momsdeklaration, Inkomstdeklaration, AGI (Arbetsgivardeklaration), Årsredovisning, Årsbokslut, K10

---

### 2.1 RESULTATRÄKNING (Income Statement)

**Files:** `src/components/rapporter/resultatrakning.tsx`, `src/services/processors/reports/calculator.ts`, `src/hooks/use-financial-reports.ts`

#### What Works
- Real data from verifications via Supabase RPC `get_account_balances` - NOT hardcoded
- Correct BAS account ranges: 3xxx revenue, 4xxx COGS, 5-6xxx external costs, 7000-7699 personnel, 7700-7999 depreciation, 8xxx financial, 89xx taxes
- 400+ BAS accounts properly defined in `src/data/accounts.ts` with Swedish names, types, and VAT codes
- Year-on-year comparison via `mergeComparativeData()` adds `previousValue` and `previousTotal`
- Correct calculation flow: Revenue → Gross Profit → EBITDA → EBIT → EBT → Net Income
- PDF export via `downloadElementAsPDF()` (html2canvas + jsPDF, A4/Letter, multi-page)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Tax hardcoded at 20.6%** | HIGH | Single line item at standard rate. No reading from actual booked tax accounts. Doesn't handle deferred tax, losses carried forward, or prior-year adjustments. |
| 2 | **No period selection** | HIGH | Hardcoded to calendar year (Jan 1 - Dec 31). Can't view monthly, quarterly, or custom date range P&L. |
| 3 | **Missing financial statement notes (noter)** | HIGH | ÅRL (Årsredovisningslag) requires mandatory notes. Entirely absent. |
| 4 | **No board certification** | HIGH | No signature field for board approval of annual statements. |
| 5 | **Financial items not split** | MEDIUM | Interest income and interest expense combined as single line instead of separate breakdown per ÅRL. |
| 6 | **No variance analysis** | MEDIUM | Year-on-year comparison shows raw numbers but no calculated % change or trend indicators. |
| 7 | **No quarterly breakdown** | LOW | Can't compare Q1 vs Q2 within same year or view quarterly reports. |

#### Missing vs Bokio/Visma
- Monthly/quarterly/custom period selection
- Variance analysis with % change and trend arrows
- Mandatory financial statement notes
- Board certification/signature section
- Excel/CSV export
- Budget vs actual comparison
- Drill-down from line items to underlying verifications

---

### 2.2 BALANSRÄKNING (Balance Sheet)

**Files:** `src/components/rapporter/balansrakning.tsx`, `src/services/processors/reports/calculator.ts`, `src/services/processors/annual-report-processor.ts`

#### What Works
- Real cumulative data from verifications (date_from: '2000-01-01' to year-end) - correct for balance sheet
- Proper asset classification: 1000-1399 (fixed), 1400-1999 (current), 1900-1999 (cash & bank)
- Proper liability classification: 2000-2099 (equity), 2100-2199 (untaxed reserves), 2300-2399 (long-term), 2400-2999 (short-term)
- Year-on-year comparison available
- PDF export capability
- AI audit tool (`src/lib/ai-tools/bokforing/audit.ts`) validates Assets = Equity + Liabilities with <1 kr threshold

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Balance sheet equation not enforced in UI** | CRITICAL | Code calculates both sides but never checks if `totalAssets === totalEquityAndLiabilities`. No warning if they don't match. The AI audit tool validates this separately but it's not integrated into the main display. |
| 2 | **Balance sheet "fudge factor"** | CRITICAL | Annual report processor (line ~117) calculates `diff = totalAssets - totalEquityAndLiabilities` and adds it to equity to force balance. This **masks accounting errors** instead of flagging them. |
| 3 | **No explicit opening balance** | HIGH | No "Ingående balans" line shown. Opening equity position implicit in cumulative calculation. |
| 4 | **No balance sheet date selection** | HIGH | Hardcoded to Dec 31 of current year. Can't view balance sheet as of any arbitrary date (Q1 end, previous year-end). |
| 5 | **Sign convention confusion** | MEDIUM | Assets (1xxx) negated in code (`-balance`), equity (2xxx) not negated. Creates confusion in calculation flow. |
| 6 | **Equity sections not detailed** | MEDIUM | Doesn't differentiate capital contributions vs. retained earnings vs. current year result in the equity breakdown. |
| 7 | **No reconciliation between P&L and BS** | MEDIUM | Net income from P&L not validated against equity change in balance sheet. |

#### Missing vs Bokio/Visma
- Balance equation validation with error flagging
- Arbitrary date balance sheet
- Explicit opening/closing balance display
- Equity roll-forward statement
- Notes references per line item
- Direct Bolagsverket submission

---

### 2.3 MOMSDEKLARATION (VAT Declaration - SKV 4700)

**Files:** `src/services/processors/vat/calculator.ts`, `src/services/processors/vat/types.ts`, `src/services/processors/vat/utils.ts`, `src/services/processors/vat/xml-export.ts`, `src/lib/generators/vat-xml-export.ts`, `src/components/rapporter/dialogs/moms.tsx`

#### What Works
- **All SKV 4700 rutor implemented:** Full coverage of sections A-H (ruta 05-62)
- **Real data from verifications** - calculates from actual account balances, not hardcoded
- Correct account mapping: 2610-2619 (25% output VAT → ruta10), 2620-2629 (12% → ruta11), 2630-2639 (6% → ruta12), 2640-2649 (input VAT → ruta48)
- EU reverse charge accounts: 4515 (EU goods → ruta20), 4535 (EU services → ruta21), 4531 (non-EU services → ruta22)
- Quarterly period logic with correct Skatteverket deadlines: Q1→May 12, Q2→Aug 17, Q3→Nov 12, Q4→Feb 12
- Status tracking: upcoming/submitted/overdue
- Submitted reports become immutable (pulled from DB, not recalculated)
- XML export generates Skatteverket-compatible format with proper UTF-8 encoding, org number, period (YYYYMM)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No Skatteverket API integration** | HIGH | Submit button shows "Kommer snart". XML can be downloaded but must be manually uploaded. |
| 2 | **Account mapping is rigid** | MEDIUM | Assumes standard BAS accounts. No configuration for companies using custom account plans. |
| 3 | **Fallback calculation unreliable** | MEDIUM | If sales bases aren't found, reverse-calculates from VAT (`ruta06 = ruta11 / 0.12`). This is an estimate, not real data. |
| 4 | **Limited reverse charge handling** | MEDIUM | Only basic EU/non-EU distinction. Doesn't handle special categories (building materials, steel, etc.). |
| 5 | **No validation before export** | MEDIUM | XML generated without schema validation against Skatteverket spec. No required-field checking. |
| 6 | **Deadline doesn't account for holidays** | LOW | Hardcoded dates don't shift for Swedish public holidays or extended enterprise deadlines. |

#### Missing vs Bokio/Visma
- Direct Skatteverket API submission
- Schema validation before export
- Account mapping configuration
- Monthly VAT option (for companies with >40M SEK turnover)
- VAT reconciliation report (account 26xx vs reported amounts)
- Historical submission log with audit trail

---

### 2.4 INKOMSTDEKLARATION (Income Tax Declaration - INK2)

**Files:** `src/services/processors/inkomstdeklaration-processor.ts`, `src/services/processors/ink2-fields.ts`, `src/components/rapporter/inkomstdeklaration.tsx`, `src/components/rapporter/dialogs/sru.tsx`, `src/services/processors/inkomstdeklaration-sru-processor.ts`

#### What Works
- **Complete INK2 form structure** with 3 blanketter: INK2 (main), INK2R (balance sheet + income statement, ~50 fields), INK2S (tax adjustments, ~22 fields)
- Real data from verifications: `Ink2Processor.calculateAll(verifications, year)` with proper account range mapping
- Non-deductible expense handling: representation costs (account 6070-6079) at 50% split, tax expenses marked non-deductible
- **Periodiseringsfond management:** Max 25% of profit, 6-year expiry, creation/dissolution/partial dissolution, stored in Supabase with proper CRUD
- SRU export generates INK2 + INK2R + INK2S for Skatteverket submission
- Tax adjustment wizard dialog for interactive review of computed values
- Corporate tax correctly at 20.6%

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No Skatteverket API submission** | HIGH | SRU files downloadable but "direct submission" not implemented. |
| 2 | **Simplified representation cost handling** | MEDIUM | Only account 6070-6079 at 50%. May miss other non-deductible items (fines, penalties, certain entertainment). |
| 3 | **K10 gränsbelopp not integrated** | MEDIUM | K10 calculated separately but not linked back to INK2 dividend tax computation. |
| 4 | **Periodiseringsfond no max validation** | MEDIUM | No guard preventing allocation exceeding 25% of profit. User could enter invalid amount. |
| 5 | **Manual editing of auto-calculated fields** | MEDIUM | Wizard allows overriding calculated values - risk of accountant error without validation. |
| 6 | **No historical auditing** | LOW | Changes not timestamped. Only "submitted" status locks data. |
| 7 | **Fiscal year hardcoded to 2024P4** | LOW | Tax period in SRU dialog hardcoded. Should be dynamic based on current fiscal year. |

#### Missing vs Bokio/Visma
- Direct SRU/XBRL submission to Skatteverket
- Validation of all field limits and dependencies
- Multi-year tax loss carry-forward tracking
- Automatic periodiseringsfond expiry alerts
- Tax optimization suggestions

---

### 2.5 AGI - ARBETSGIVARDEKLARATION (Monthly Employer Declaration)

**Files:** `src/hooks/use-employer-declaration.ts`, `src/lib/generators/agi-generator.ts`, `src/components/ai/previews/forms/agi-form-preview.tsx`, `src/lib/ai-tools/loner/payroll.ts`

#### What Works
- Real data from verifications: salary (accounts 7000-7399), tax withheld (2710), employer contributions (2730-2739)
- Monthly period grouping with due date calculation (12th of next month per SKV requirement)
- Basic XML generation with org number, period, totals
- Form preview UI with salary, tax, and contribution totals

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No individuppgifter (KU-data)** | **CRITICAL** | Only generates Huvuduppgift (summary totals). **Skatteverket requires individual employee data per person (personnummer, salary breakdown, tax deduction).** Without this, the AGI cannot be submitted. |
| 2 | **Employee count wrong** | CRITICAL | Counts salary account *entries*, not unique employees. Multiple salary bookings per person inflate the count. No employee master file lookup. |
| 3 | **Employer contributions not calculated** | HIGH | Only *collects* existing values from account 2730-2739. Does NOT calculate rates (31.42% standard, 15.49% for ages 19-23). No age-based rate variations. |
| 4 | **Tax deduction hardcoded 25%** | HIGH | `taxDeduction: Math.round((emp.monthlySalary) * 0.25)`. No SKV tax tables, no individual consideration, no jämkning. |
| 5 | **Payroll is simulation only** | HIGH | `runPayrollTool` explicitly marked as "Simulering". Not a real payroll engine. |
| 6 | **No benefits reporting** | HIGH | `totalBenefits` field exists but always 0. No mapping of benefit accounts (meals, car, housing). |
| 7 | **XML schema incomplete** | HIGH | Generic namespace, no individuppgift section. Won't pass Skatteverket validation. |
| 8 | **No Skatteverket submission** | HIGH | Download only, no API integration. |

#### Missing vs Bokio/Visma
- Individual employee reporting (individuppgifter/KU-data)
- Real payroll calculation engine with tax tables
- Age-based employer contribution rates
- Benefit-in-kind tracking and reporting
- Direct Skatteverket API submission
- Employee master file integration
- Sick leave and vacation tracking

---

### 2.6 ÅRSREDOVISNING (Annual Report)

**Files:** `src/components/rapporter/arsredovisning.tsx`, `src/components/rapporter/dialogs/arsredovisning-wizard-dialog.tsx`, `src/services/processors/annual-report-processor.ts`

#### What Works
- Follows K2 structure: Förvaltningsberättelse, Resultaträkning, Balansräkning, Noter (placeholder), Underskrifter (placeholder)
- P&L and balance sheet calculated from real verifications with correct account groupings
- Wizard dialog with step-by-step creation flow
- Fiscal year concept (Jan 1 - Dec 31) with June 30 deadline shown
- PDF export via browser print/html2canvas

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Balance sheet forcing hack** | CRITICAL | If `totalAssets !== totalEquityAndLiabilities`, difference is silently added to equity. Masks errors instead of flagging them. Accountant would consider this covering up problems. |
| 2 | **No closing entries (bokslutsdispositioner)** | CRITICAL | No closing account setup (8999 Årets resultat). No formal period closure. System calculates result dynamically without creating closing verifications. |
| 3 | **Board signatures not implemented** | HIGH | Wizard shows "Styrelsens underskrifter" as gray/inactive checkbox. No signature fields, no electronic signature capability, no board member data collection. |
| 4 | **Notes (noter) not implemented** | HIGH | Wizard marks as "genereras automatiskt" but actually placeholder. Mandatory K2 notes entirely missing: accounting policies, depreciation rates, contingent liabilities, related-party transactions. |
| 5 | **No auditor's report** | HIGH | No "Revisionsberättelse" section at all. Many AB companies require this. |
| 6 | **Förvaltningsberättelse is manual text only** | MEDIUM | No auto-generation of business description, material events, or future outlook from company data. |
| 7 | **Tax hardcoded 20.6%** | MEDIUM | No deferred tax, no prior-year adjustments, no recognition of actual tax position. |
| 8 | **No XBRL/Bolagsverket export** | MEDIUM | UI mentions but not implemented. PDF only, not formatted as official Bolagsverket document. |

#### Missing vs Bokio/Visma
- Complete K2/K3 notes generation
- Board member signature collection (electronic)
- Auditor's report section
- XBRL export for Bolagsverket digital filing
- Depreciation schedules per asset
- Proper closing entries and trial balance
- Multi-year comparison
- Revenue recognition notes

---

### 2.7 ÅRSBOKSLUT (Year-End Closing)

**Files:** `src/components/rapporter/arsbokslut.tsx`

#### What Works
- Displays real-time P&L and balance sheet from `useAccountBalances()` hook
- Account balances from real verifications

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No closing entry generation** | **CRITICAL** | Display-only component. No actual closing procedure. Swedish accounting requires formal closing entries: transfer result to retained earnings, reverse opening balances, set up accruals. |
| 2 | **No trial balance (huvudbok)** | CRITICAL | Can't generate pre-closing or post-closing trial balance. Essential for accountant workflow. |
| 3 | **No period separation** | HIGH | Each report run recalculates dynamically. No persistent closing creates no audit trail and no formal handoff to next fiscal year. |
| 4 | **No closing balance → opening balance transfer** | HIGH | No mechanism to carry forward closing balances as next year's opening balances. No explicit "Ingående balans" setup. |
| 5 | **No accrual/provision handling** | HIGH | No automated accrual reversal, no provision accounting (termination, restructuring). |
| 6 | **No depreciation schedule integration** | MEDIUM | Account 7800-7999 values used as-is. No separate asset register or depreciation method detail. |
| 7 | **No year-end checklist** | MEDIUM | Unlike Månadsavslut, no guided checklist for annual closing procedures. |

#### Missing vs Bokio/Visma
- Formal closing entry wizard
- Pre-closing and post-closing trial balance
- Closing balance → opening balance carryforward
- Accrual management (periodiseringar)
- Year-end depreciation run
- Tax provision calculation
- Audit trail of all closing steps

---

### 2.8 K10 (3:12-regler / Fåmansbolag Tax Form)

**Files:** `src/components/rapporter/k10/index.tsx`, `src/components/rapporter/k10/use-k10-calculation.ts`, `src/lib/ai-tools/skatt/k10.ts`

#### What Works
- Both calculation methods implemented:
  - **Förenklingsregeln:** `schablonbelopp = IBB * 2.75 * (ownership% / 100)`
  - **Lönebaserat utrymme (Main rule):** `totalSalaries * 0.5 * (ownership% / 100)` with salary requirement validation (`lönekrav`)
- Gränsbelopp = MAX(förenkling, lönebaserat)
- Real data: salary from accounts 7000-7399, owner salary from 7220, dividends from account 2898
- Shareholder ownership percentage from compliance/shareholders hook
- Sparat utdelningsutrymme tracked from K10 history
- AI tool for gränsbelopp calculation

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Account 7220 assumption for owner salary** | HIGH | Assumes "Lön till företagsledare" always uses account 7220. Many companies use 7200, 7210, or other codes. No mapping configuration. |
| 2 | **Acquisition cost = share capital** | HIGH | `omkostnadsbelopp = aktiekapital` (always assumed equal). Actual acquisition cost is often different, especially after secondary purchases. Critical for main K10 rule. |
| 3 | **IBB potentially outdated** | MEDIUM | Fallback: 74,300 (2024). Should pull dynamically from official Skatteverket rates. System parameter may not be updated yearly. |
| 4 | **Account 2898 dividend assumption** | MEDIUM | Many companies don't use 2898 for dividend payouts. Dividends may be booked against 2000-2099 equity directly. |
| 5 | **No voting vs economic share distinction** | MEDIUM | Assumes one share = one vote. Swedish 3:12 rules sometimes use different share classes with different rights. |
| 6 | **No historical K10 adjustments** | LOW | Assumes history is accurate. No manual adjustment mechanism for prior-year corrections. |

#### Missing vs Bokio/Visma
- Configurable account mappings for owner salary and dividends
- Actual acquisition cost tracking per shareholder
- Dynamic IBB rate updates from Skatteverket
- Share class distinctions (A/B shares with different voting rights)
- K10 form PDF generation matching Skatteverket format
- Prior-year adjustment workflow

---

### PHASE 2 SUMMARY: RAPPORTER

#### Overall Maturity: EARLY BETA (40-55% production-ready)

The reports category is notably stronger than Bokföring because the core calculation infrastructure is solid - all reports pull from real verification data with proper BAS account mapping. The VAT declaration (Momsdeklaration) and income tax declaration (Inkomstdeklaration) are the most complete features in the entire app.

#### Top 10 Must-Fix Items (Prioritized)

1. **Fix balance sheet equation enforcement** - must validate A=L+E and flag errors, not silently force-balance
2. **Implement closing entries (bokslutsdispositioner)** - formal period closure with trial balance
3. **Add individuppgifter (KU-data) to AGI** - without this, employer declarations can't be submitted to Skatteverket
4. **Implement annual report notes (noter)** - mandatory K2/K3 requirement
5. **Add board signatures to årsredovisning** - legally required for annual reports
6. **Fix employee count in AGI** - count unique employees, not salary entries
7. **Add period selection to P&L and balance sheet** - monthly, quarterly, custom date ranges
8. **Implement real payroll engine** - replace simulation with actual tax table calculations
9. **Add Skatteverket API integration** - at least for VAT and AGI (most frequent filings)
10. **Fix K10 account mapping** - configurable instead of hardcoded 7220/2898

#### Architecture Strengths
- Real data throughout - every report calculates from actual verifications
- Comprehensive BAS account coverage (400+ accounts)
- VAT form has complete SKV 4700 ruta coverage
- INK2 covers all 3 blanketter with SRU export
- Periodiseringsfond management is sophisticated (6-year tracking, partial dissolution)
- Year-on-year comparison infrastructure exists

#### Architecture Gaps
- No closing entry engine (biggest gap - affects annual report, årsbokslut, and period integrity)
- No real payroll module (blocks AGI completeness)
- No Skatteverket API layer (all submissions manual download)
- No Bolagsverket XBRL export for annual reports
- No audit trail on report generation/submission
- Balance sheet masking errors instead of flagging them

---

## PHASE 3: LÖNER (Payroll)

**Pages:** Team (Anställda), Lönebesked (Payslips), Förmåner (Benefits), Delägaruttag (Owner Withdrawals), Egenavgifter (Self-Employment Fees)

---

### 3.1 TEAM / ANSTÄLLDA (Employees)

**Files:** `src/components/loner/team/index.tsx`, `team/employee-card.tsx`, `team/dialogs.tsx`, `team/use-team-logic.ts`, `src/hooks/use-employees.ts`, `src/lib/database/repositories/employees.ts`

#### What Works
- Employee CRUD with real Supabase database storage (not mock)
- RLS (Row Level Security) for user isolation
- Card-based UI with employee info display
- API endpoint `/api/employees` (GET/POST)
- `useEmployees()` hook fetches real data via Supabase RPC `get_employee_balances`
- Employee balance calculation from account 2820 (employee debt) and 7330 (mileage)
- Mileage reimbursement at 2.5 kr/km (25 kr/mil) - correct 2024 rate

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No personnummer field** | **CRITICAL / ILLEGAL** | Swedish law requires personnummer for all employees. Can't file AGI declarations without it. DB has no field for it. UI doesn't collect it. |
| 2 | **No employment type** | HIGH | Can't distinguish tillsvidareanställning (permanent), visstid (fixed-term), or provanställning (probation). Affects severance rules, notice periods. |
| 3 | **No tax table per employee** | HIGH | DB has `tax_rate` field (default 0.24) but it's never used - tax always hardcoded at 24% flat. Swedish law requires municipal-based tax tables from Skatteverket. |
| 4 | **No vacation tracking** | HIGH | No semesterdagar (vacation days) field. No vacation balance. No accrual tracking. Semesterlagen requires this. |
| 5 | **No pension scheme** | HIGH | No tjänstepension tracking (ITP/SAF-LO). No employer contribution calculation. No employee deduction. |
| 6 | **No sick leave tracking** | MEDIUM | No sick leave balance, no karensdagar tracking, no annual limit. |
| 7 | **No collective agreement** | MEDIUM | No kollektivavtal selection. Overtime, benefits, and severance all depend on this. |
| 8 | **No work schedule** | MEDIUM | No full-time/part-time indicator, no work hours per week, no department/cost center. |

#### Employee Data Collected vs What's Needed

| Field | Collected | Needed for Real Payroll |
|-------|-----------|------------------------|
| Name | Yes | Yes |
| Role | Yes | Yes |
| Email | Yes | Yes |
| Monthly salary | Yes | Yes |
| Start date | Yes | Yes |
| Status (active/inactive) | Yes | Yes |
| Personnummer | **NO** | **LEGALLY REQUIRED** |
| Employment type | **NO** | Required |
| Tax table/municipality | **NO** | Required |
| Vacation days | **NO** | Required (Semesterlagen) |
| Pension scheme | **NO** | Required |
| Collective agreement | **NO** | Required |
| Bank account (for payments) | **NO** | Required |
| Work schedule/hours | **NO** | Needed |
| Department/cost center | **NO** | Needed |

---

### 3.2 LÖNEBESKED (Payslips)

**Files:** `src/components/loner/payslips/`, `src/components/loner/dialogs/create-payslip/`, `src/lib/database/repositories/payslips.ts`, `src/app/api/payroll/payslips/route.ts`

#### What Works
- 3-step payslip creation wizard: Employee select → Adjustments → Review
- Payslips stored in real Supabase database (not mock)
- API endpoint `/api/payroll/payslips` (GET/POST) with RLS
- Support for manual entry for one-off workers
- Bulk operations (send/delete multiple payslips)
- PDF export functionality
- Correct BAS account mapping for journal entries: 7010 (salary), 7510 (employer contrib expense), 2710 (tax liability), 2730 (employer contrib liability), 1930 (bank)
- Double-entry bookkeeping verification created on payslip generation

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Tax hardcoded at 24% flat** | **CRITICAL** | `Math.round(finalSalary * 0.24)` for ALL employees. Sweden uses progressive municipal tax tables (Skatteverket). Each employee should have different rates based on municipality, income level, and tax card (K4). |
| 2 | **Employer contributions hardcoded 31.42%** | HIGH | `Math.round(finalSalary * 0.3142)` for ALL ages. Missing age-based rates: 19-24 years: 15.49%, 16-18 years: 6.7%. No nystartsjobb (hiring subsidies) support. |
| 3 | **No vacation pay (semesterersättning)** | **CRITICAL / ILLEGAL** | Semesterlagen requires ~12% vacation accrual. Not calculated, not shown on payslip, not booked. Should debit 7020, credit 2740. |
| 4 | **Payroll "run" doesn't persist** | **CRITICAL** | `runPayrollTool` calculates mock payslips and returns them but **never saves to database**. `payslips.create()` never called. Data lost on page refresh. |
| 5 | **Journal entry logic exists but disconnected** | CRITICAL | `src/lib/bookkeeping/entries/salary.ts` has **perfect** Swedish payroll entry logic (`createSalaryEntry()`) but it's **never called** from the payroll execution flow. Dead code. |
| 6 | **Sick leave calculation wrong** | HIGH | Deducts `dailyRate * days * 0.2` (20%). Swedish karensdagen: Day 1 is 80% employee responsibility. Days 2-14: employer pays 100% sjuklön. Code uses wrong percentages. |
| 7 | **Overtime hardcoded 350 kr/hour** | HIGH | No agreement-based rates. Swedish overtime varies by kollektivavtal (25%, 50%, or 100% surcharge). |
| 8 | **No pension contribution** | HIGH | No tjänstepension calculation, no deduction from salary, no employer contribution. |
| 9 | **Missing payslip fields** | HIGH | No vacation pay line, no pension deduction, no A-kassa, no union fees, no benefit values, no employer tax info, no company details (org number). |
| 10 | **Employer contributions not stored** | MEDIUM | Calculated on-the-fly in UI but not persisted in payslip DB record. Recalculation could give different result. |

#### Payslip Database Schema vs What's Needed

| Field | In DB | Needed |
|-------|-------|--------|
| employee_id | Yes | Yes |
| period | Yes | Yes |
| gross_salary | Yes | Yes |
| tax_deduction | Yes | Yes |
| net_salary | Yes | Yes |
| bonuses | Yes | Yes |
| deductions | Yes | Yes |
| status | Yes | Yes |
| payment_date | Yes | Yes |
| employer_contributions | **NO** | Required |
| vacation_pay_accrual | **NO** | Required (Semesterlagen) |
| pension_contribution | **NO** | Required |
| tax_table_used | **NO** | Required (audit trail) |
| calculation_breakdown (JSON) | **NO** | Needed |
| year/month (for AGI) | **NO** | Required |
| sickness_days | **NO** | Needed |

#### Disconnected Salary Entry Logic

The file `src/lib/bookkeeping/entries/salary.ts` contains **correct** Swedish payroll journal entries but is **never called**:

```
createSalaryEntry() → Debit 7010 (Löner), Debit 7510 (Arbetsgivaravgifter),
                       Credit 2710 (Personalskatt), Credit 2730 (Skuld avgifter),
                       Credit 2920 (Upplupna löner)

createPayrollTaxPayment() → Clears 2710 + 2730 against 1930 (bank)

createSalaryAccrual() → Debit 7090 (Vacation expense), Credit 2920 (Accrued liability)
```

This code is correct but orphaned - the payroll wizard creates its own simpler entries inline instead of using this module.

---

### 3.3 FÖRMÅNER (Fringe Benefits)

**Files:** `src/components/loner/benefits/`, `src/components/loner/dialogs/forman/`, `src/lib/ai/reference-data.ts`, `src/lib/formaner.ts`

#### What Works
- Benefit catalog with 20 Swedish förmåner (tax-free + taxable + salary sacrifice)
- Tax-free benefits correctly categorized: friskvård (5,000 kr), julgåva (550 kr), jubileumsgåva (1,650 kr), minnesgåva (15,000 kr), cykelförmån (3,000 kr)
- Dedicated forms per benefit type: Vehicle, Fuel, Meal, Parking, Housing, Allowance
- Meal rates: lunch 130 kr/day, full board 260 kr/day (correct for 2024)
- Fuel benefit: 120% of market price (correct Skatteverket formula)
- Mileage rate: 25 kr/mil (correct for 2024)
- Electric car (elbil) gets 60% of standard förmånsvärde (correct)
- DB storage attempted via `assignBenefit()` in Supabase

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Company car formula wrong** | **CRITICAL** | Uses `newCarPrice * 0.09 / 12` (simplified 9%). Skatteverket requires: `5% × nybilspris + (PBB ÷ 100) × (age − 2) × 0.01 × nybilspris`. Missing: prisbasbelopp calc, car age, depreciation. |
| 2 | **Benefits not flowing to payslips** | CRITICAL | Benefits can be assigned but are NOT included in payslip gross/deductions. `totalBenefits: 0` hardcoded in AGI. |
| 3 | **Benefits not flowing to AGI** | CRITICAL | AGI reporting has `totalBenefits` hardcoded to 0. Taxable benefits must appear on employer declarations. |
| 4 | **All rates hardcoded for 2024** | HIGH | Meal rates, mileage, gift limits, car formula - all hardcoded. No annual update mechanism. Bokio/Visma auto-update. |
| 5 | **No benefit limit validation** | MEDIUM | Friskvård max 5,000 kr/year not enforced. User can assign any amount. No annual accumulation tracking. |
| 6 | **Housing benefit - no market reference** | MEDIUM | User must manually estimate market rent. No Boverket/SCB integration. High error risk. |
| 7 | **Missing benefit types** | MEDIUM | No traktamente (per diem), no lotterna (restaurant cards), no commute deductions. |
| 8 | **DB save uncertain** | MEDIUM | `assignBenefit()` falls back silently if Supabase not configured. No error handling in component. |

---

### 3.4 DELÄGARUTTAG (Owner Withdrawals)

**Files:** `src/components/loner/delagaruttag/`, `src/types/withdrawal.ts`

#### What Works
- Three withdrawal types: uttag (private withdrawal), insättning (capital contribution), lön (salary to owner)
- Correct BAS accounts for HB/KB: 2010/2013/2018 (Partner 1), 2020/2023/2028 (Partner 2), etc.
- Dynamic `getPartnerAccounts(index)` function for any number of partners
- Verification (journal entry) created on withdrawal with double-entry bookkeeping
- Stats cards showing total capital, withdrawals, active partners
- Informational cards about förbjudet lån (forbidden loans), utdelning (dividends), skattekonto (tax account)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Salary (lön) treated as withdrawal** | HIGH | Code treats `lön` same as `uttag` - both use account 2013 (privatuttag). Owner salary should use 7210/7220 (salary accounts) with proper tax + employer contributions. |
| 2 | **No dividend (utdelning) in UI** | HIGH | Code comments mention dividends but the type is not in the dropdown. Should use account 2091 (Utdelning beslutad). |
| 3 | **3:12 optimization exists but not in UI** | MEDIUM | `optimize312Tool` calculates optimal salary/dividend split with correct formulas (2.75 × IBB, 6 × IBB salary threshold, 20% dividend tax) but is only accessible via AI chat, not from the withdrawal UI. |
| 4 | **No forbidden loan detection** | MEDIUM | Informational text exists but no actual prevention. Should warn/block when withdrawal might constitute a prohibited loan. |
| 5 | **Bank account hardcoded to 1930** | LOW | All withdrawals credit 1930. Should allow selection from 1910-1950 range. |

---

### 3.5 EGENAVGIFTER (Self-Employment Contributions)

**Files:** `src/components/loner/egenavgifter/`, `src/lib/ai-tools/loner/owner-payroll.ts`

#### What Works
- Fee component breakdown: sjukförsäkring, föräldraförsäkring, ålderspension, efterlevandepension, arbetsmarknadsavgift, arbetsskadeförsäkring, allmän löneavgift
- Real profit import from verifications (accounts 3000-3999 revenue, 4000-7999 expenses)
- Reduced rate option for age exemption (born before 1957)
- Karensdagar (waiting days) reduction toggle
- Monthly trend visualization
- Schablonavdrag (25%) mentioned in UI text

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Rate components don't sum to fullRate** | **CRITICAL** | Individual components sum to 31.73% but `fullRate` is set to 28.97%. The ALÅ (allmän löneavgift) 11.50% is listed separately but NOT included in the full rate calculation. Creates ~2.76% undercalculation. |
| 2 | **Several individual rates wrong** | HIGH | Compared to Skatteverket 2024: sjukförsäkring 3.88% (should be 3.38%), föräldraförsäkring 2.60% (should be 2.44%), arbetsmarknadsavgift 2.64% (should be 0.64% - off by 4x). |
| 3 | **Karensdagar reduction too small** | HIGH | Shows "7 days" in UI but calculates only 0.76% reduction. Should be ~7.5% reduction for 7 karensdagar. |
| 4 | **Schablonavdrag not applied in calculation** | HIGH | UI says "25% schablonavdrag available" but the calculator never deducts it. Misleading net income figure. |
| 5 | **No income tax shown** | MEDIUM | Shows "Kvar efter avgifter" but doesn't include income tax (20-32%). User thinks this is take-home pay but it's before income tax. |
| 6 | **Rates hardcoded, no annual update** | MEDIUM | All rates frozen at 2024 values. No mechanism to update for 2025/2026. |
| 7 | **Age reduction manual checkbox** | LOW | User self-reports age eligibility. No automatic birth date verification. |

#### Note: AI Tool Has Different (Correct) Rates

The AI tool `calculateSelfEmploymentFeesTool` in `owner-payroll.ts` uses **correct** 2024 rates:
- sjukförsäkring: 3.38%, föräldraförsäkring: 2.44%, arbetsmarknadsavgift: 0.64%

But the UI component `use-tax-calculator.ts` uses **wrong** rates. The two are not connected.

---

### PHASE 3 SUMMARY: LÖNER

#### Overall Maturity: PROTOTYPE / DEMO (20-30% production-ready)

Löner is the **weakest category** in the app. While the database infrastructure exists and some journal entry logic is correct, the payroll engine itself is fundamentally a simulation. The gap between what exists and what Bokio/Visma offers is larger here than in any other category.

#### The Core Problem

The app has **correct accounting entry logic** (`salary.ts`) that is **disconnected** from the payroll execution. When a user "runs payroll":
1. Employee data fetched (real) ✓
2. Tax calculated at flat 25% (wrong) ✗
3. Employer contributions at flat 31.42% (no age variation) ✗
4. Payslips shown in UI but **never saved to database** ✗
5. Journal entries created inline (simpler version) but the proper `createSalaryEntry()` is never called ✗

#### Top 10 Must-Fix Items (Prioritized)

1. **Add personnummer field to employees** (legally required for Swedish payroll)
2. **Implement real Swedish tax tables** (replace 24% flat rate with municipal tax tables from Skatteverket)
3. **Add vacation pay accrual** (Semesterlagen requires ~12% accrual, currently zero)
4. **Connect payroll run to database** (payslips must persist, not be lost on refresh)
5. **Connect `createSalaryEntry()` to payroll flow** (correct code exists but is orphaned)
6. **Fix egenavgifter rates** (several components off by 2-4x vs Skatteverket 2024)
7. **Fix company car (tjänstebil) formula** (must use Skatteverket method with prisbasbelopp)
8. **Flow benefits into payslips and AGI** (currently hardcoded to 0)
9. **Add age-based employer contribution rates** (19-24: 15.49%, 16-18: 6.7%)
10. **Implement individuppgifter in AGI** (per-employee KU-data required by Skatteverket)

#### Architecture Strengths
- Real Supabase database with RLS for employees and payslips
- Correct BAS account structure for salary entries (7010, 7510, 2710, 2730, 1930)
- Well-structured benefit catalog with Swedish förmåner
- 3:12 optimization algorithm exists with correct formulas
- Owner withdrawal creates proper journal entries with correct HB/KB accounts

#### Architecture Gaps
- No payroll calculation engine (biggest gap - everything is flat-rate simulation)
- No Skatteverket tax table integration
- No pension module
- No vacation/sick leave tracking
- Salary entry logic exists but is disconnected from execution flow
- Benefits system doesn't flow into payslips or AGI
- Egenavgifter UI and AI tool use different (contradictory) rates
- No annual rate update mechanism for any payroll constants

---

## PHASE 4: HÄNDELSER (Events / Corporate Actions)

**Pages:** Folder View (Quarters), Timeline View, Calendar View, Roadmap View, Activity Log

**Concept:** Händelser is meant to act as a "storage room" — a comprehensive archive of all past events, corporate actions, deadlines, and AI-generated walkthroughs. An accountant should be able to look here and see everything that has happened chronologically.

---

### 4.1 EVENT DATA MODEL & STORAGE

**Files:** `src/types/events.ts`, `src/services/event-service.ts`, `src/hooks/use-events.ts`

#### What Works
- Comprehensive event schema: id, timestamp, source, category, action, actor, title, description, relatedTo[], status, corporateActionType, proof, metadata
- 8 event categories: bokföring, skatt, rapporter, parter, löner, dokument, system, bolagsåtgärd
- 5 event sources: ai, user, system, document, authority
- 5 status states: draft, pending_signature, ready_to_send, submitted, registered
- 6 corporate action types: board_change, dividend, capital_change, authority_filing, statute_change, roadmap
- **Real Supabase database** with proper PostgreSQL schema, enums, and indexes
- **RLS security** - events scoped to `user_id = auth.uid()`
- Convenience emitters: `emitAIEvent()`, `emitUserEvent()`, `emitSystemEvent()`, `emitAuthorityEvent()`
- Events are append-only (good for audit trail)
- Real-time UI updates via `CustomEvent('händelse')` listener
- AI walkthroughs saved as events when closed (metadata stores walkthrough blocks)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Immutable audit chain NOT implemented** | **CRITICAL** | `hash` and `previousHash` fields exist in schema but **no code computes SHA-256 hashes**. Events can be tampered with. Comments acknowledge: "For hash linking, we'd ideally fetch the last event server-side." Violates Bokföringslagen (BFL) requirement for immutable records. |
| 2 | **No event amendment workflow** | HIGH | Events are append-only (good) but there's no reversal/correction mechanism. If an event is logged incorrectly, accountant can't fix it. No "correcting event" workflow. |
| 3 | **EventProof never populated** | HIGH | Schema has `proof` field for signatures/confirmations/hashes but it's never used. No authority response storage, no filing confirmation numbers. |
| 4 | **Two separate audit trail systems** | MEDIUM | `events` table and `activity_log` table are disconnected. Activity log has PostgreSQL trigger for transactions but events don't trigger activity logs. Fragmented audit trail. |
| 5 | **Not using Supabase Realtime** | LOW | Uses `CustomEvent` (same-tab only) instead of Supabase Realtime subscriptions. Won't work for multi-user or multi-tab scenarios. |

---

### 4.2 VIEW MODES

**Files:** `src/components/pages/handelser-page.tsx`, `src/components/handelser/use-handelser-logic.ts`, `events-folder-view.tsx`, `events-timeline-view.tsx`, `handelser-kalender.tsx`

#### What Works
- **5 view modes:** Folders (quarters), Timeline, Calendar, Roadmap, Activity - well-organized tabs
- **Folder view:** Q1-Q4 cards with event count badges, click-through to filtered timeline
- **Timeline view:** Paginated (25 per page), events grouped by date ("Idag", "Igår", or full date), source badges (AI/User/System/Authority), status badges
- **Calendar view:** Swedish Monday-start week layout (Mån-Sön), month navigation, event indicators per day with "+N mer" overflow, O(1) event lookup via Map
- **Activity log:** Real-time Supabase subscriptions, tracks who did what (created/updated/deleted/booked/sent/approved), links to related entities
- All views use **real data from Supabase**, not mock data

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Timeline only filters by source** | HIGH | Can filter AI/User/System/Authority but cannot filter by category (bokföring, skatt, etc.) or by status (pending, submitted). Accountants need to find "all tax events" or "all pending items". |
| 2 | **No full-text search** | HIGH | Can't search event descriptions or titles. Accountant looking for a specific filing or document can't find it. |
| 3 | **No export capability** | HIGH | Can't export events as PDF/CSV for auditor review. A compliance archive that can't be exported is limited. |
| 4 | **Calendar lacks category/status indicators** | MEDIUM | Shows event title only. No color coding by category. No indication of urgency or status on calendar cells. |
| 5 | **No drill-down to financial details** | MEDIUM | Events link to `relatedTo` entities but no direct drill-down to transaction amounts or verification details. |
| 6 | **No compliance checklist per quarter** | MEDIUM | Folder view shows event count but no "what should have happened this quarter" checklist. |

---

### 4.3 CORPORATE ACTIONS (Bolagsåtgärder)

**Files:** `src/components/pages/handelser-page.tsx` (ActionWizard integration)

#### What Works
- 6 corporate action types defined with Swedish labels and visual metadata
- ActionWizard dialog launches on "Ny åtgärd" button
- Creates event in database with `corporateActionType` and `status: 'draft'`
- Status workflow defined: draft → pending_signature → ready_to_send → submitted → registered

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Only "roadmap" action type exposed in UI** | HIGH | `getAllowedActions()` returns only `["roadmap"]`. The 5 other types (board_change, dividend, capital_change, authority_filing, statute_change) are defined but NOT accessible. |
| 2 | **No document generation** | HIGH | Corporate actions like dividend decisions or board changes require formal documents. No code generates these. |
| 3 | **No signing workflow** | HIGH | `pending_signature` status exists but no signature collection mechanism. No BankID/electronic signature. |
| 4 | **No authority submission** | HIGH | Can't submit to Bolagsverket or Skatteverket. No API integration. |
| 5 | **No state machine enforcement** | MEDIUM | Status transitions not enforced. Could jump from draft to registered without going through signing/sending. |

---

### 4.4 ROADMAP SYSTEM

**Files:** `src/types/roadmap.ts`, `src/services/roadmap-service.ts`, `src/components/handelser/roadmap-view.tsx`, `src/components/handelser/roadmap-detail.tsx`

#### What Works
- Full CRUD for roadmaps with steps: create, read, update status, delete
- Real Supabase storage (falls back to localStorage for dev/demo)
- Step status tracking: pending → in_progress → completed → skipped
- Progress calculation (completed/total) with visual progress bars
- Professional UI with expandable steps, checkboxes, delete confirmation
- Due dates per step (optional)
- Flexible metadata per step

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Generic project planner, not accounting-specific** | HIGH | No pre-built Swedish compliance templates (bokslut checklist, deklaration timeline, etc.). Bokio has "Årets Checklist" with pre-filled Swedish deadlines. Visma has "Tidplan" with automatic deadline calculation. |
| 2 | **No deadline-driven automation** | HIGH | No alerts when steps are overdue. No fiscal year awareness. No automatic deadline calculation. |
| 3 | **Roadmap completions don't emit events** | MEDIUM | Completing a roadmap step doesn't create an event in Händelser timeline. The two systems are disconnected. |
| 4 | **localStorage fallback risks data loss** | MEDIUM | If Supabase connection fails, roadmaps stored in localStorage only. Browser clear = data gone. |
| 5 | **No integration with accounting data** | MEDIUM | Roadmap steps don't link to actual reports, declarations, or accounting features. |

---

### 4.5 AI EVENT TOOLS

**Files:** `src/lib/ai-tools/common/events.ts`, `src/lib/ai-tools/planning/roadmap.ts`, `src/lib/ai-tools/planning/roadmap-generator.ts`

#### Tools Assessment

| Tool | Real Data? | Production Ready? | Detail |
|------|-----------|-------------------|--------|
| `getEventsTool` | YES - Supabase | YES | Queries real events with filters |
| `createEventTool` | YES - Supabase | YES | Creates real persistent events |
| `getUpcomingDeadlinesTool` | **NO - HARDCODED** | **DANGEROUS** | Returns static 2026 dates. Assumes Jan fiscal year. Will break in 2027. Missing: Inkomstdeklaration, K10, monthly AGI. Wrong for 40% of companies with non-Jan fiscal year. |
| `getActivitySummaryTool` | **NO - MOCK** | **NO** | Returns `totalEvents: 156` and fake breakdowns regardless of actual data. 100% placeholder. |
| `exportToCalendarTool` | Partial | Partial | Returns URL but doesn't trigger export. API endpoint exists but only exports Momsdeklaration Q1 + roadmap events. Missing all other deadlines. |
| `getWalkthroughHistoryTool` | YES - Supabase | YES | Retrieves real saved walkthroughs |
| `showWalkthroughTool` | YES - Supabase | YES | Displays real walkthrough from event metadata |
| `getRoadmapsTool` | YES - Supabase | YES | Returns real roadmaps with progress |
| `createRoadmapTool` | YES - Supabase | YES | Creates persistent roadmaps |
| `generateRoadmapSuggestionsTool` | Template-based | Partial | Pattern matches keywords, returns pre-built templates. Not true AI generation but reasonable for common goals (hiring, starting company). |

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Deadline tool dangerously wrong** | **CRITICAL** | Hardcoded 2026 dates will mislead accountants. A company with June 30 fiscal year sees March 31 bokslut deadline (should be Sept 30). Risk of missed filings and penalties. |
| 2 | **Activity summary is fake** | HIGH | Always returns same numbers (156 events, 67 user, 23 AI...) regardless of real data. Completely useless. |
| 3 | **Calendar export incomplete** | MEDIUM | Only Momsdeklaration Q1 exported to iCal. AGI, Bokslut, Årsstämma, Årsredovisning, Inkomstdeklaration all missing. |
| 4 | **Roadmap generator is template-based** | LOW | Recognizes "anställa" and "starta AB" keywords to return pre-built templates. Falls back to generic 6-step plan for anything else. Not truly AI-powered suggestions. |

---

### 4.6 ACTIVITY LOG

**Files:** `src/hooks/use-activity-log.ts`, `src/components/shared/activity-feed.tsx`

#### What Works
- Separate `activity_log` table in Supabase with proper schema
- Tracks: created, updated, deleted, booked, sent, approved, rejected, paid, archived, restored, exported, imported
- Entity types: transactions, invoices, receipts, verifications, payslips, employees, shareholders, companies
- Changes stored as JSON diff: `{ "status": { "from": "draft", "to": "booked" } }`
- PostgreSQL trigger auto-logs transaction changes
- Real-time updates via Supabase Realtime subscriptions
- Professional feed UI with Swedish labels and entity links
- Denormalized `user_name` for deleted user resilience

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Only triggers on transactions table** | MEDIUM | Auto-logging trigger only exists for transactions. Invoice changes, payslip changes, verification changes don't auto-log. |
| 2 | **Separate from Händelser events** | MEDIUM | Activity log and events are two disconnected systems. No unified audit trail. Accountant has to check both places. |

---

### PHASE 4 SUMMARY: HÄNDELSER

#### Overall Maturity: EARLY BETA (35-45% production-ready)

The Händelser module has a **solid architectural foundation** — real database, proper schema, multiple useful view modes, and good RLS security. The event data model is comprehensive. However, the gap between the foundation and what an accountant needs is significant.

#### The Core Problems

1. **Immutable audit trail not implemented** — the hash chain that would make events tamper-evident is defined in schema but never coded
2. **Deadline management is dangerous** — hardcoded 2026 dates wrong for most companies, missing critical deadlines
3. **Corporate actions are 90% placeholder** — only "roadmap" type accessible, no document generation, no signing, no filing
4. **Two disconnected audit systems** — events and activity_log should be unified or clearly cross-referenced

#### Top 10 Must-Fix Items (Prioritized)

1. **Implement hash-based immutable audit chain** (BFL compliance requirement)
2. **Replace hardcoded deadlines with dynamic calculation** based on company fiscal year
3. **Add complete Swedish deadline calendar** (AGI monthly, Moms quarterly, INK2, K10, Bokslut, Årsredovisning, Årsstämma)
4. **Enable all corporate action types in UI** (only roadmap accessible, 5 others hidden)
5. **Add category and status filtering to timeline** (accountants need to find "all tax events")
6. **Add full-text search across events** (find specific filings or documents)
7. **Add export capability** (PDF/CSV for auditor review)
8. **Fix getActivitySummaryTool** (replace mock data with real database aggregation)
9. **Create accounting-specific roadmap templates** (bokslut checklist, deklaration timeline)
10. **Add deadline alerting** (email/push notifications for upcoming and overdue deadlines)

#### Architecture Strengths
- Real Supabase database with comprehensive event schema
- RLS security for user/company isolation
- 5 view modes (Folders, Timeline, Calendar, Roadmap, Activity) all rendering real data
- AI walkthrough persistence (saves guidance as events)
- Activity log with real-time Supabase subscriptions
- Well-designed status workflow (draft → submitted → registered)

#### Architecture Gaps
- No immutable hash chain (events not tamper-evident)
- No dynamic deadline calculation engine
- No authority API integration (Skatteverket/Bolagsverket)
- No document generation for corporate actions
- No electronic signature workflow (BankID)
- No proactive alerting/notification system
- Two separate audit trail systems (events + activity_log)
- Roadmap system generic, not accounting-focused
- 2 of 7 AI tools return fake/mock data

---

## PHASE 5: ÄGARE & STYRNING (Owners & Governance)

**Pages:** Aktiebok, Utdelning, Firmatecknare, Bolagsstämma, Styrelsemöte, Delägare (HB/KB), Medlemsregister (Förening), Årsmöte

**Concept:** This is the corporate governance hub — managing shareholders, partners, members, board, meetings, dividends, and signing authority. Must comply with ABL (Aktiebolagslagen), BFL (Lagen om handelsbolag), and föreningslagen depending on company type.

---

### 5.1 AKTIEBOK (Share Register)

**Files:** `src/components/agare/aktiebok/use-aktiebok-logic.ts`, `src/components/agare/aktiebok/types.ts`, `src/services/shareholder-service.ts`

#### What Works
- **Real Supabase data** — shareholders fetched from `shareholders` table with RLS
- **Full shareholder service** — `shareholder-service.ts` provides getShareholders, getById, addShareholder, getBoardMembers, getShareTransactions, getShareRegisterSummary with proper query building
- **Share class handling** — A and B shares with correct 10:1 voting ratio (A-aktier = 10 röster, B-aktier = 1 röst)
- **5 transaction types:** Nyemission, Köp, Gåva, Arv, Split
- **Nyemission creates correct journal entries:** 1930 (debit bank) → 2081 (credit aktiekapital) + 2097 (credit överkursfond) when price > quota value
- **Share transfers** update both sender and receiver share counts in database
- **Transfer validation** — checks if sender has enough shares before transfer
- **New shareholder auto-creation** on transaction if SSN/org-nr provided
- **Transaction history** derived from verifications (filters by `equity_issue` / `share_transfer` sourceType)
- **Search** across shareholder names
- **Proper org/person detection** — `isCompany()` analyzes third digit of cleaned number to differentiate

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No aktienummer (share numbers) per ABL** | **CRITICAL** | ABL 5 kap. §2 requires each share to have a unique sequential number (aktienummer). E.g., "A-aktier nr 1-500, B-aktier nr 501-1000". The share register lacks this entirely. No `shareNumberFrom`/`shareNumberTo` fields. Bolagsverket will reject the register. |
| 2 | **quotaValue hardcoded to 25** | HIGH | Line 182: `const quotaValue = 25`. Should come from company settings (aktiekapital ÷ total shares). Different companies have different quota values. Also hardcoded to 100 in `shareholder-service.ts:197`. |
| 3 | **acquisitionPrice always 0** | HIGH | Line 76: `acquisitionPrice: 0` hardcoded for all shareholders. Original purchase price is needed for capital gains tax calculation when selling shares. |
| 4 | **Share split doesn't update share counts** | HIGH | The Split case (line 272-279) creates a verification but never multiplies existing shareholders' share counts. After a 2:1 split, shareholders still show the pre-split count. |
| 5 | **No fångeshandlingar (transfer deeds)** | MEDIUM | Share transfers require a signed fångeshandling document. No document generation or storage for transfers. |
| 6 | **Share class always defaults to 'B' for transactions** | MEDIUM | Line 130: transaction history defaults `shareClass: 'B'`. Doesn't parse actual class from verification description. |
| 7 | **No Bolagsverket registration** | MEDIUM | No API or export to register share capital changes with Bolagsverket. Manual process required. |
| 8 | **Dual share count fields** | LOW | Database has both `shares` and `shares_count` columns. Code handles both with fallback but this is fragile: `row.shares_count || row.shares || 0`. |

---

### 5.2 UTDELNING (Dividends)

**Files:** `src/components/agare/utdelning/use-dividend-logic.ts`, `src/components/rapporter/k10/use-k10-calculation.ts`

#### What Works
- **Proper 3-step workflow:** Plan → Decide (stämmobeslut) → Book → Pay
- **Step 1 (planDividend):** Creates a draft `general_meeting_minutes` document with dividend decision embedded in JSON content
- **Step 2 (bookDividend):** Creates journal entry: Debit 2091 (Balanserad vinst) → Credit 2898 (Outtagen vinstutdelning). Correct double-entry bookkeeping.
- **Step 3 (payDividend):** Settles the liability: Debit 2898 → Credit 1930 (Bank). Correct payout booking.
- **Status tracking:** `planned` → `decided` (when meeting signed) → `booked` (when journal entry created)
- **Real data source:** Dividend decisions parsed from meeting documents in Supabase
- **K10 integration:** Stats include `gränsbelopp` from K10 calculation hook
- **Can't book before decision:** Enforced — `bookDividend` requires status === 'decided'
- **Can't pay before booking:** Enforced — `payDividend` requires status === 'booked'

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Wrong debit account for dividend booking** | **CRITICAL** | Uses 2091 (Balanserad vinst/förlust). Should be 2098 (Vinstutdelning beslutad). 2091 is the retained earnings account and should only change at year-end (resultatdisposition). The correct flow: book decision on 2098, then at year-end move from 2091 to 2098. |
| 2 | **No distributable equity check** | **CRITICAL** | Never checks if the company has enough fritt eget kapital (unrestricted equity) to pay the dividend. ABL 17:3 requires a "försiktighetsregel" — must ensure company can still meet obligations. Could allow illegal distributions. |
| 3 | **Tax always 20%** | **CRITICAL** | Line 46: `const tax = Math.round(amount * 0.2)`. Flat 20% tax on all dividends. But: dividends exceeding gränsbelopp are taxed at ~52% (as income from employment per 3:12 rules). Also, non-Swedish shareholders pay 30% kupongskatt (withholding tax). |
| 4 | **No per-shareholder distribution** | HIGH | Books total amount as a lump sum. Should split by ownership percentage — each shareholder gets their share. Needed for individual K10 and tax reporting. |
| 5 | **No kupongskatt (withholding tax)** | HIGH | Swedish law requires 30% withholding for foreign shareholders. No nationality/residency tracking. |
| 6 | **No dividend per share calculation** | MEDIUM | Should show amount per share (total ÷ number of shares). Required for K10 form and shareholder communication. |
| 7 | **Meeting document coupling is fragile** | MEDIUM | Dividend decisions embedded as JSON inside `content` field of meeting documents. Parsing could break if content format changes. |

---

### 5.3 FIRMATECKNARE (Authorized Signatories)

**Files:** `src/components/agare/firmatecknare.tsx`, `src/components/agare/firmatecknare-logic.ts`

#### What Works
- **Correct derivation for all 5 company types:**
  - **AB:** Major shareholders (≥50%) get ensam (sole) signing. Board chair gets ensam. Other board members get gemensam (joint, two in association).
  - **HB:** Partners with ≥50% ownership get ensam. Others gemensam.
  - **KB:** Only komplementärer (general partners) can sign. Kommanditdelägare correctly excluded (`isActive: !p.isLimitedLiability`).
  - **Förening:** Board chair gets ensam. Other board members gemensam.
  - **EF:** Owner gets ensam signing authority (sole proprietor).
- **Real data integration** — pulls from `useCompliance()`, `usePartners()`, `useMembers()` hooks
- **Board members derived from latest signed meeting** (latest `protokoll signerat` document)
- **Deduplication** by name to prevent duplicates
- **Professional UI** with status badges (Aktiv/Inaktiv), dropdown actions, date display

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No Bolagsverket registration capability** | HIGH | Firmatecknare changes must be registered with Bolagsverket (Ändring av firmatecknare, blankett 816). No export, no API, no form generation. |
| 2 | **AB signing authority oversimplified** | HIGH | Real AB signing authority is defined in bolagsordningen (articles of association), not just by share ownership. A 49% shareholder could have ensam signing if bolagsordningen says so. |
| 3 | **No VD (CEO) handling for AB** | MEDIUM | VD has legal signing authority for day-to-day operations (ABL 8:29-36). The logic finds VD from `ownerInfo.boardMembers` but the code only checks for 'ordförande' role, not 'VD'. |
| 4 | **EF validFrom hardcoded** | LOW | Line 112: `validFrom: '2020-01-01'`. Should use actual registration date from company data. |
| 5 | **"Lägg till" and "Redigera" buttons are non-functional** | MEDIUM | UI shows add/edit/deregister actions but no handlers are connected. |
| 6 | **No special/prokura signing authority** | LOW | Missing: prokura (limited signing authority), särskild firmateckning (special signing rights for specific transactions). |

---

### 5.4 BOLAGSSTÄMMA & STYRELSEMÖTE (General & Board Meetings)

**Files:** `src/components/agare/bolagsstamma/use-general-meetings.ts`, `src/components/agare/dialogs/meeting-view.tsx`, `src/components/agare/dialogs/kallelse.tsx`, `src/components/agare/dialogs/mote.tsx`

#### What Works
- **Full meeting lifecycle:** Planerad → Kallad → Genomförd → Protokoll signerat
- **Both meeting types:** bolagsstämma (general) and styrelsemöte (board) in unified system
- **Real Supabase storage:** Meeting documents in `corporate_documents` table with JSON content
- **Meeting creation** with type (ordinarie/extra), date, time, location, year
- **Kallelse (meeting notice):**
  - PDF generation via `generateAnnualMeetingNoticePDF()`
  - Text editor with AI assistance (opens AI chat for suggestion)
  - Download and send options
- **Board meeting creation** with automatic sequential numbering (`meetingNumber`)
- **ABL-compliant agenda template** (14 standard items for ordinarie bolagsstämma)
- **Dividend booking from meeting decisions** — creates real journal entry (2091/2898) when dividend decided
- **Status mapping** between UI states (planerad/kallad/genomförd/signerat) and DB states (draft/pending/archived/signed)
- **Meeting update** — can modify date, location, chairperson, secretary, attendees, agenda
- **Stats calculation** — planned, upcoming, completed counts, days until next meeting

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Digital signature is UI-only** | **CRITICAL** | `signature-flow.tsx` provides a signatory selection UI and "Skicka förfrågan" button, but: the `onRequestSignature` callback is just a prop with no backend. No BankID, no Scrive, no DocuSign. No actual signing happens. |
| 2 | **Kallelse sends empty recipients** | **CRITICAL** | Line 66 of `kallelse.tsx`: `recipients: []`. The POST to `/api/notices` always sends an empty array. No email ever reaches shareholders/members. Shows success toast anyway. |
| 3 | **No voting result tracking** | HIGH | Meeting types define `votesFor`, `votesAgainst`, `votesAbstain` fields but the UI has no voting input. All decisions are recorded as text only. ABL requires voting records for certain decisions. |
| 4 | **No quorum (beslutförhet) validation** | HIGH | No check that minimum required attendees/votes are present. An AB stämma needs shareholders representing >50% of votes for most decisions, 2/3 for statute changes. |
| 5 | **saveKallelse is incomplete** | HIGH | Line 291-302: Parses existing document content and adds kallelseText, but **never calls updateDocument**. Shows success toast but data isn't saved. |
| 6 | **Board changes from meetings don't update board registry** | HIGH | A board meeting can decide on new board members, but the shareholders table `is_board_member`/`board_role` fields are never updated from meeting decisions. |
| 7 | **No statutory deadline enforcement** | MEDIUM | ABL requires ordinarie bolagsstämma within 6 months of fiscal year end. `boardService.getAnnualMeetingDeadline()` calculates this correctly but it's not surfaced as a warning in the meeting creation flow. |
| 8 | **Excessive console.log in production code** | LOW | `use-general-meetings.ts` has multiple `console.log` debug statements that should be removed. |

---

### 5.5 DELÄGARE (Partners - HB/KB)

**Files:** `src/components/agare/delagare/use-partner-management.ts`, `src/types/withdrawal.ts`, `src/hooks/use-partners.ts`

#### What Works
- **Correct BAS accounts** for partner equity: dynamically assigned via `getPartnerAccounts(index)`:
  - Partner 0: 2010 (capital), 2013 (withdrawal), 2018 (deposit)
  - Partner 1: 2020 (capital), 2023 (withdrawal), 2028 (deposit)
  - Scales to any number of partners
- **Capital balance from verifications** — aggregates all journal entries affecting partner accounts in a single O(V) pass using Map
- **Enriched partner objects** — adds `currentCapitalBalance` derived from actual ledger entries
- **Stats via Supabase RPC** — `get_partner_stats()` for server-side aggregation (used for withdrawals sum)
- **Fallback to local calculation** when RPC unavailable
- **Active partner detection** — filters partners with `ownershipPercentage > 0`

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Partner withdrawals don't create journal entries** | **CRITICAL** | When a partner makes an uttag (withdrawal), the UI records it but no verification is created with proper BAS accounts (should debit 2013/2023 + credit 1930). Without journal entries, the partner capital balance on the balance sheet will be wrong. |
| 2 | **No partner agreement (bolagsavtal) management** | HIGH | HB/KB must have a bolagsavtal defining profit distribution, decision-making, dissolution terms. No document storage for this. |
| 3 | **No profit distribution calculation** | HIGH | HB/KB partners share profits according to bolagsavtal (or equally by default). No year-end profit distribution mechanism. |
| 4 | **No partner service layer** | MEDIUM | Unlike shareholders (which have `shareholder-service.ts`), partners have no dedicated service. Data comes from `usePartners()` hook directly. Design inconsistency. |
| 5 | **RPC may not exist** | MEDIUM | `get_partner_stats` RPC silently fails if not created in Supabase. Uses `try/catch` with no error reporting. Falls back to local calc but hides setup issues. |
| 6 | **No partner exit workflow** | MEDIUM | When a partner leaves (utträde), their capital must be settled. No liquidation or buyout flow. |

---

### 5.6 MEDLEMSREGISTER (Member Registry - Förening)

**Files:** `src/components/agare/medlemsregister/add-member-dialog.tsx`, `src/hooks/use-members.ts`

#### What Works
- **Real journal entries on member add** — Excellent implementation:
  - Capital contribution (insats): 1930 (debit bank) → 2083 (credit medlemsinsatser). Correct BAS account.
  - Membership fee: 1930 (debit bank) → 3890 (credit medlemsavgifter). Correct BAS account.
- **Configurable membership types:** ordinarie (500 kr), stödmedlem (200 kr), hedersmedlem (0 kr)
- **Pay fee toggle** — can add member without immediate payment
- **Capital contribution toggle** — separate from membership fee
- **Customizable insats amount** (default 100 kr)
- **Sequential member numbering** — auto-generated, zero-padded (001, 002...)
- **Real Supabase storage** via `useMembers()` hook
- **Double-click prevention** with `isLoading` guard

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No member exit with capital return** | HIGH | When a member leaves (utträde), their insats must be returned (debit 2083, credit 1930). No exit workflow. |
| 2 | **Fee amounts hardcoded** | MEDIUM | MEMBERSHIP_FEES constant: 500/200/0. Should come from förening settings (stadgar). Different föreningar charge different amounts. |
| 3 | **No annual fee tracking** | MEDIUM | `currentYearFeePaid` boolean is set on creation but no annual renewal mechanism. Can't track which members have paid for the current year. |
| 4 | **No stadgar (statutes) management** | MEDIUM | Förening must have stadgar defining member obligations, fees, voting rights. No document storage for this. |
| 5 | **No member role management beyond initial add** | LOW | Members can be added with roles but no UI for editing roles after creation (e.g., appointing to valberedning, revisor). |

---

### 5.7 AI TOOLS (Ägare & Styrning)

**Files:** `src/lib/ai-tools/parter/shareholders.ts`, `src/lib/ai-tools/parter/partners.ts`, `src/lib/ai-tools/parter/compliance.ts`, `src/lib/ai-tools/parter/board.ts`

#### Tools Assessment

| Tool | Real Data? | Production Ready? | Detail |
|------|-----------|-------------------|--------|
| `get_shareholders` | **YES** — shareholderService | **YES** | Full query with search, share class filter, board members filter, limit. Returns real summary stats. |
| `get_share_register_summary` | **YES** — shareholderService | **YES** | Real aggregate: total shares, by class (A/B), total capital, quota value. |
| `add_shareholder` | **YES** — shareholderService | **YES** | Creates real shareholder in DB. Has confirmation flow. |
| `transfer_shares` | **NO — MOCK** | **NO** | Lines 218-263: Returns hardcoded `remainingShares: 500`, mock `from.name: 'Säljande aktieägare'`. Comment says "in production this would update Supabase". |
| `get_partners` | **PARTIAL** | **NO** | Calls `get_partner_stats` RPC which returns aggregate stats only (count, total capital). Doesn't return individual partner details. AI can't answer "who are the partners?" with names. |
| `get_members` | **PARTIAL** | **NO** | Same pattern — calls `get_member_stats` RPC for aggregate stats. No individual member list. |
| `get_compliance_docs` | **YES** — API | **YES** | Fetches real documents from `/api/compliance`. Supports type filtering and limit. |
| `register_dividend` | **YES** — API | **Partial** | Creates dividend via API. But doesn't go through the proper 3-step workflow (plan→decide→book). Creates directly. |
| Board tools (in `board.ts`) | **YES** — boardService | **YES** | `get_board_members`, `get_signatories`, `get_meeting_minutes`, `get_annual_meeting_deadline` — all real Supabase queries. |

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Share transfer tool is mock** | HIGH | The `transfer_shares` tool doesn't actually update the database. AI tells user "transfer complete" but nothing changed. |
| 2 | **Partner/member tools return only stats** | HIGH | Can't list individual partners or members. AI response to "visa delägare" would be "There are 3 partners with 500k total capital" but can't name them. |
| 3 | **Dividend tool bypasses workflow** | MEDIUM | `register_dividend` creates a document directly. Should integrate with `useDividendLogic.planDividend()` for proper 3-step flow. |
| 4 | **No share class in transfer** | MEDIUM | Transfer tool accepts `shareClass` parameter but the mock doesn't use it for validation or accounting. |

---

### 5.8 SERVICES LAYER

**Files:** `src/services/shareholder-service.ts`, `src/services/board-service.ts`

#### What Works
- **shareholder-service.ts** (370 lines): Fully functional service with proper Supabase queries, pagination, search, filtering, summary aggregation. Handles dual column names (`shares`/`shares_count`, `ssn_org_nr`/`personal_number`). Has `getShareTransactions()` for history.
- **board-service.ts** (274 lines): Complete board member management. `getSignatories()` derives signing authority from role (VD/Ordförande = Ensam, others = Två i förening). `getAnnualMeetingDeadline()` correctly calculates 6-month deadline from fiscal year end. Queries `boardminutes` and `companymeetings` tables.
- Both use `getSupabaseClient()` properly (RLS-scoped).

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No partner-service.ts** | MEDIUM | Shareholders and board have dedicated services. Partners (HB/KB) don't. All partner logic is in React hooks and components. |
| 2 | **No member-service.ts** | MEDIUM | Same gap for förening members. |
| 3 | **ShareTransaction.fromShareholderName always null** | LOW | Line 294: `fromShareholderName: null` — comment says "Would need join or separate query". Not resolved. |
| 4 | **Signing authority from boardService vs firmatecknare-logic diverge** | LOW | Two different approaches to determine signatories: `boardService.getSignatories()` (from DB metadata) and `deriveSignatories()` (from ownership data). Could give conflicting results. |

---

### PHASE 5 SUMMARY: ÄGARE & STYRNING

#### Overall Maturity: EARLY BETA (40-55% production-ready)

Ägare & Styrning is a mixed picture — some components are impressive while others are dangerously incomplete.

#### The Core Problems

1. **Dividend taxation is dangerously wrong** — flat 20% when Swedish law requires 20% up to gränsbelopp and ~52% above it, plus 30% kupongskatt for non-residents
2. **Digital signing doesn't exist** — the entire signature flow is UI-only with no backend. Meetings can never be truly "signed"
3. **No aktienummer in share register** — ABL requires numbered shares. Bolagsverket will reject the register
4. **Partner withdrawals don't create journal entries** — makes balance sheet unreliable for HB/KB companies
5. **Kallelse never actually sent** — empty recipients array means meeting notices never reach shareholders/members

#### Top 10 Must-Fix Items (Prioritized)

1. **Fix dividend account** (use 2098 for decided dividend, not 2091)
2. **Implement gränsbelopp-based tax** (20% up to gränsbelopp, ~52% above, kupongskatt 30% for non-residents)
3. **Add aktienummer to share register** (sequential numbering per ABL 5:2)
4. **Implement real digital signing** (BankID integration or at minimum Scrive/DocuSign)
5. **Fix kallelse sending** (populate actual recipient emails from shareholders/members)
6. **Add distributable equity check** before allowing dividend (ABL 17:3 försiktighetsregel)
7. **Create journal entries for partner withdrawals** (debit 2013/2023, credit 1930)
8. **Fix share transfer AI tool** (connect to actual shareholderService instead of mock)
9. **Add quorum validation for meetings** (require minimum vote representation per ABL)
10. **Get quotaValue from company settings** (not hardcoded to 25 or 100)

#### Architecture Strengths
- Real Supabase database with RLS for all ownership data
- Professional service layer for shareholders and board (well-structured, query-capable)
- Correct BAS accounts for partner equity (2010-series with proper indexing)
- Member capital contribution creates real, correct journal entries
- Firmatecknare logic handles all 5 company types correctly
- 3-step dividend workflow design is sound (plan→decide→book→pay)
- Meeting lifecycle management with status tracking

#### Architecture Gaps
- No digital signature backend (BankID/Scrive)
- No Bolagsverket API or form generation
- No aktienummer tracking for shares
- Partner subsystem lacks service layer (vs shareholder/board having full services)
- Dividend taxation model is flat-rate (missing 3:12 threshold logic in booking)
- Share transfer AI tool is mocked
- Partner/member AI tools return stats only, not individual data
- Two different signatory derivation systems (boardService vs firmatecknare-logic)
- Kallelse sending infrastructure is placeholder

---

## PHASE 6: FÖRETAGSSTATISTIK (Company Statistics & Dashboard)

**Components:** Company Statistics Service, Dashboard Hook, KPI Calculations, Stats Display Components (14 domain-specific), Chart Infrastructure, Company Provider, AI Statistics Tools, Usage Tracking

**Concept:** The statistics system provides an overview of the company's financial health — KPIs, trends, counts, and visualizations. An accountant should see at a glance: revenue, expenses, profit margin, liquidity, solvency, and any items requiring attention.

---

### 6.1 COMPANY STATISTICS SERVICE

**Files:** `src/services/company-statistics-service.ts` (384 lines)

#### What Works
- **Real Supabase database** — all data from actual tables: transactions, customerinvoices, receipts, employees, inventarier, accountbalances
- **Three main methods:** `getStatistics(year?)`, `getMonthlyBreakdown(year?)`, `getKPIs(year?)`
- **Dashboard counts** via `getDashboardCounts()` — quick overview of all major entity counts
- **Monthly breakdown** with best/worst month identification
- **Division-by-zero protection** on all ratio calculations

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Fiscal year hardcoded to calendar year** | **CRITICAL** | Lines 70-71: `yearStart = '${targetYear}-01-01'`, `yearEnd = '${targetYear}-12-31'`. Ignores `fiscalYearEnd` from company settings. A company with June 30 fiscal year gets wrong data — shows Jan-Dec instead of Jul-Jun. ~40% of Swedish companies use non-calendar fiscal years. |
| 2 | **Account classification is too coarse** | HIGH | Lines 185-195: Treats ALL 4xxx-8xxx as "expenses". But 8xxx (financial items) should be excluded from operating profit calculations. No distinction between COGS (4xxx), personnel costs (5xxx), external costs (6xxx), depreciation (7xxx). |
| 3 | **19xx ≠ all cash** | HIGH | Assumes all 19xx accounts are cash/bank. But 1910-1929 = bank accounts, 1930 = företagskonto, 1940-1990 = other liquid assets. Over-counts "cash" if non-cash 19xx accounts exist. |
| 4 | **Gross margin and operating margin identical** | HIGH | Both use the same 4-8xxx range for costs, producing identical margins. Gross margin should use only 4xxx (COGS), operating margin should use 4-7xxx (excluding financial). |
| 5 | **Monthly breakdown assumes 12 calendar months** | MEDIUM | Line 244: Always creates Jan-Dec months. Won't align with Jul-Jun or other fiscal year periods. |
| 6 | **No validation that balance sheet balances** | MEDIUM | Doesn't check if Assets = Equity + Liabilities. Could silently produce wrong KPIs if accounting data has errors. |

---

### 6.2 DASHBOARD HOOK (KPI Calculations)

**Files:** `src/hooks/use-company-statistics.ts` (247 lines)

#### What Works
- **Real Supabase RPC calls**: `get_monthly_cashflow`, `get_dashboard_counts`, `get_account_balances`
- **4 financial health KPIs:** Soliditet, Kassalikviditet, Skuldsättningsgrad, Vinstmarginal
- **Transaction stats:** total, recorded, pending, missing docs
- **Invoice stats:** sent, paid, overdue, draft, total value, overdue value
- **Monthly revenue trends** for chart display
- **Expense category breakdown** with percentages
- **Smart null handling** — returns `null` for KPIs when insufficient data (better than showing 0)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Soliditet (Equity Ratio) uses computed equity** | **CRITICAL** | Line 86: `equity: assets - liabilities` (computed), then line 124: `equity / assets * 100`. But if equity is already available from 20xx accounts, should use booked equity. Computing equity masks accounting errors — if books don't balance, you'd never know. |
| 2 | **Kassalikviditet uses ALL liabilities, not just current** | **CRITICAL** | Line 131: Divides by total liabilities (2100-2999). Should only use current liabilities (24xx-29xx short-term). Including long-term debt (21xx-23xx mortgage, bonds) makes liquidity look worse than reality. |
| 3 | **Account balance sign flip is undocumented** | HIGH | Line 74: `assets += (val * -1)` with comment "Flip for Asset". Assumes database stores assets as negative. If this convention changes or varies, all KPIs break silently. No documentation of sign convention. |
| 4 | **Equity classification boundary wrong** | HIGH | Lines 75-76: `2000-2099 = equity, 2100-2999 = liabilities`. BAS standard: 20xx = equity, 21xx-23xx = long-term liabilities, 24xx-29xx = short-term liabilities. The 2000-2099 range is too narrow — misses 2081 (aktiekapital), 2091 (balanserad vinst) etc. which are in the 20xx range but could extend. |
| 5 | **ExpenseCategories code references wrong data structure** | HIGH | Lines 214-219: Checks `acc.account?.type === 'expense'` but the actual data is `{ account: string, balance: number }`. This means the expense category breakdown silently returns nothing — it never matches. |
| 6 | **Vinstmarginal sign handling fragile** | MEDIUM | Line 91: `netIncome: (revenue + expenses) * -1`. Only works if revenue is stored as negative and expenses as positive. Undocumented assumption. |

---

### 6.3 AI STATISTICS TOOLS

**Files:** `src/lib/ai-tools/common/statistics.ts` (198 lines), `src/lib/ai-tools/common/company.ts` (177 lines)

#### Tools Assessment

| Tool | Real Data? | Production Ready? | Detail |
|------|-----------|-------------------|--------|
| `get_company_statistics` | YES — via service | Partial | Returns real data but inherits service's fiscal year bug |
| `get_monthly_breakdown` | YES — via service | Partial | Best/worst month identification works. Same fiscal year issue. |
| `get_kpis` | YES — via service | **NO** | Returns gross/operating margin only. Missing the 4 main KPIs (soliditet, kassalikviditet, skuldsättningsgrad, vinstmarginal) which live in the hook instead. AI tool claims to return KPIs but returns an incomplete set. |
| `get_dashboard_counts` | YES — via service | YES | Quick entity counts. Works correctly. |
| `get_company_info` | YES — companyService | YES | Company metadata (name, type, org number, settings). Real DB data. |
| `get_company_stats` | Mixed | **NO** | `pendingVat` hardcoded to 0 (line 105). Silent failures if API calls fail — returns 0 for all metrics instead of error. AI might tell user "you have 0 employees" when API is just down. |

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **getCompanyStatsTool has hardcoded pendingVat: 0** | HIGH | Line 105: `const pendingVat = 0`. Never fetches actual VAT liability. AI tells user they owe 0 kr in VAT even when they might owe thousands. |
| 2 | **Silent API failures** | HIGH | If `/api/transactions` or `/api/employees` returns error, tool silently uses 0 for all values. No distinction between "no data" and "fetch failed". |
| 3 | **KPI tool misleading** | MEDIUM | Named `get_kpis` but only returns gross/operating margin. The Swedish-standard KPIs (soliditet etc.) are not accessible to AI. |

---

### 6.4 AI USAGE TRACKING

**Files:** `src/lib/ai-tools/common/usage.ts` (308 lines)

#### What Works
- **Real Supabase data** — queries `aiusage`, `profiles`, `usercredits` tables
- **Subscription tier support:** free, starter, professional, enterprise with token limits
- **Extra credits system** — purchased credits with expiry dates, properly filtered by `is_active` and `expires_at`
- **Threshold-based reminders** at 50%, 75%, 90%, 100% usage
- **Model cost multipliers** — different pricing for different AI models
- **Credit purchase flow** with package options

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Period calculation uses calendar month** | MEDIUM | Lines 72-74: Always uses 1st-to-last of current month. If subscription renews mid-month, usage calculation spans wrong period. |
| 2 | **Model multiplier defaults to cheap model** | MEDIUM | Line 89: If `model_id` is null, defaults to `gpt-4o-mini` (1x cost). If user actually used an expensive model, usage is undercounted. |
| 3 | **50% reminder only shown 20% of the time** | LOW | Line 140: `Math.random() < 0.2`. Users may miss the 50% warning entirely. |

---

### 6.5 COMPANY PROVIDER

**Files:** `src/providers/company-provider.tsx` (373 lines)

#### What Works
- **Hybrid persistence:** Database-first with localStorage fallback
- **Comprehensive company settings:** name, orgNumber, companyType, address, fiscalYearEnd, accountingMethod, vatFrequency, isCloselyHeld, shareCapital, totalShares, shareClasses, memberFee, capitalContribution
- **Onboarding state tracking:** fresh vs existing mode, completion flag
- **Feature flags by company type** — conditionally shows/hides features (momsdeklaration, lönebesked, AGI, etc.)
- **Debounced database saves** (1-second debounce) — prevents excessive writes
- **Auto-detection of existing company** on database load

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Silent DB failures** | HIGH | If auth succeeds but DB fetch fails, user gets localStorage data with no warning. Could show stale company settings (e.g., wrong company type or VAT status). |
| 2 | **Hardcoded defaults assume standard AB** | MEDIUM | Defaults: `companyType: 'ab'`, `shareCapital: 25000`, `totalShares: 500`, `isCloselyHeld: true`. New users see pre-filled AB settings that may not match their actual company. |
| 3 | **No validation of company type + settings coherence** | MEDIUM | Can set `companyType: 'ef'` (enskild firma) while having `shareCapital: 25000`. EF doesn't have share capital. No cross-validation. |
| 4 | **Onboarding mode can't be manually changed** | LOW | Once loaded, onboarding mode is set automatically. No override mechanism if user wants to re-do onboarding. |

---

### 6.6 STATS DISPLAY COMPONENTS (14 Components)

#### Production Ready

| Component | File | Data | Detail |
|-----------|------|------|--------|
| InventarierStats | `bokforing/inventarier/stats.tsx` | Real | Total asset value, category breakdown, distribution bar. Correct `formatCurrency()`. |
| TransactionsStats | `bokforing/transaktioner/components/transactions-stats.tsx` | Real | Total count, income, expenses. Color-coded icons. Uses `useTextMode()` for i18n. |
| InvoicesStats | `bokforing/fakturor/components/invoices-stats.tsx` | Real | Incoming/outgoing amounts, overdue count with alert. Clickable overdue card. |
| Mini-charts | `shared/page-sidebar/mini-charts.tsx` | N/A | Sparkline, DonutMini, BarMini. SVG-based, zero-data handling ("Ingen data"). |
| Chart wrapper | `ui/chart.tsx` | N/A | Recharts wrapper with theme support, Swedish number formatting, dark mode. |

#### Needs Work

| Component | File | Issue | Detail |
|-----------|------|-------|--------|
| MembersStats | `agare/medlemsregister/members-stats.tsx` | **Hardcoded "+5" change** | Line 30: Static demo data `change="+5"` displayed as member count change. Pure fiction in production. |
| UtdelningStats | `loner/utdelning/utdelning-stats.tsx` | **Hardcoded 20% tax** | `Math.round(stats.bokford * 0.2)`. Same flat-rate tax bug as dividend logic. |
| AktiebokStats | `agare/aktiebok/components/aktiebok-stats.tsx` | Donut chart limits | Hardcoded SVG donut, shows max 4 shareholders with "+X till" overflow. |
| MeetingStats | `agare/bolagsstamma/meeting-stats.tsx` | Uses `any` type | `nextMeeting: any | null`. Type safety gap. |
| PayslipsStats | `loner/payslips/payslips-stats.tsx` | Vague labels | "Skatt att betala" — unclear if arbetsgivaravgifter or inkomstskatt. |
| PartnersStats | `agare/delagare/partners-stats.tsx` | Color accessibility | Grayscale with opacity — hard to distinguish in print or for color-impaired users. |
| WithdrawalStats | `loner/delagaruttag/withdrawal-stats.tsx` | No workflow link | "Att attestera" pending count but no click handler to approval flow. |
| AI chart blocks | `ai/blocks/chart.tsx` | Minimal | 47 lines, no Swedish formatting in tooltips, no dark mode. |

---

### PHASE 6 SUMMARY: FÖRETAGSSTATISTIK

#### Overall Maturity: FUNCTIONAL BUT UNRELIABLE (45-55% production-ready)

The statistics system has a **solid architecture** — real database, proper service layer, comprehensive hook, and well-built UI components. The problem is that the **calculation layer is wrong** in several important ways that would mislead accountants.

#### The Core Problems

1. **KPI formulas don't match Swedish accounting standards** — soliditet uses computed (not booked) equity, kassalikviditet uses total liabilities instead of current, expense categories reference wrong data structure
2. **Fiscal year handling broken for 40% of Swedish companies** — hardcoded calendar year throughout
3. **AI statistics tools return incomplete/misleading data** — KPI tool missing main KPIs, company stats tool has hardcoded values, silent API failures
4. **Display components have hardcoded demo data** — MembersStats "+5" change, UtdelningStats 20% tax

#### Top 10 Must-Fix Items (Prioritized)

1. **Fix kassalikviditet formula** — divide by current liabilities (24xx-29xx), not total liabilities
2. **Fix soliditet formula** — use booked equity from 20xx accounts, not computed assets-liabilities
3. **Implement fiscal year support** — read `fiscalYearEnd` from company settings, calculate proper date ranges
4. **Fix expense category data structure mismatch** — hook references `acc.account.type` but data is `{ account: string, balance: number }`
5. **Remove hardcoded demo data from MembersStats** — the "+5" change indicator
6. **Fix pendingVat in company stats AI tool** — fetch real VAT liability instead of hardcoded 0
7. **Separate account classifications** — 4xxx=COGS, 5-6xxx=operating, 7xxx=depreciation, 8xxx=financial
8. **Document sign conventions** — the `*-1` flip for assets is undocumented and fragile
9. **Add error indicators when API fails** — don't silently show 0 employees when API is down
10. **Complete KPI AI tool** — include soliditet, kassalikviditet, skuldsättningsgrad (currently only in hook)

#### Architecture Strengths
- Real Supabase database with RPC functions for aggregation
- Clean separation: service → hook → component → display
- All display components use proper Swedish formatting (formatCurrency, formatNumber)
- Chart infrastructure is solid (Recharts wrapper with dark mode, themes)
- Company provider handles hybrid persistence well (DB + localStorage fallback)
- Division-by-zero protection on all ratio calculations
- Smart null returns when insufficient data (instead of misleading 0s)

#### Architecture Gaps
- No fiscal year awareness in statistics calculations
- KPI formulas don't match Swedish accounting definitions
- Account classification too coarse (all 4-8xxx = "expenses")
- No multi-year comparison or trend analysis
- No budget vs actual variance analysis
- No accounts receivable/payable aging
- No cash flow statement (only P&L and balance sheet data)
- No industry benchmarks for KPI comparison
- Expense category code references wrong data structure (dead code)
- AI tools and hook calculate KPIs separately (duplication, potential divergence)

---

## PHASE 7: ONBOARDING & SETTINGS (Inställningar)

**Pages:** Onboarding Wizard (11 steps), Settings Dialog (10 tabs), Company Provider, Preferences System, AI Settings Tools

**Concept:** Onboarding should collect EVERYTHING an accountant needs — company details, company type, fiscal year, VAT settings, shareholders/partners, SIE import, bank connection — so after signup the user doesn't have to configure much else. Settings should then allow fine-tuning anything set during onboarding. The vision: account isn't activated until onboarding is complete or skipped.

---

### 7.1 ONBOARDING WIZARD

**Files:** `src/components/onboarding/onboarding-page.tsx`, `onboarding-wizard.tsx`, `step-config.ts`, `types.ts`, all 11 step components in `steps/`

**API:** `src/app/api/onboarding/status/route.ts`, `src/app/api/onboarding/seed/route.ts`

#### What Works
- **Beautiful 11-step flow:** Welcome → Onboarding Mode → Company Type → Company Info → Share Structure → Shareholders → Partners → Bank → SIE Import → Documents → Team
- **Company type selector saves to database** — the ONE field that persists end-to-end
- **SIE import actually works** — `/api/sie/import` parses SIE4 files, inserts transactions and account balances to Supabase. Functional but optional.
- **Onboarding status tracked** — `profiles.onboarding_completed_at` and `onboarding_skipped` flags in database
- **Conditional steps** — shareholders step only for AB, partners step only for HB/KB (config flags exist)
- **Seed API exists** — `/api/onboarding/seed` (140 lines) has full implementation to insert shareholders, partners, and members to database
- **Polish** — framer-motion animations, Swedish messaging, step indicators

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Only company type saves to database** | **CRITICAL** | Of 20+ fields shown across 11 steps, only `companyType` is wired to `setCompanyType()` → CompanyProvider → database. All other inputs are uncontrolled (no state, no onChange, no submission). This is a **facade**. |
| 2 | **Company info inputs are uncontrolled** | **CRITICAL** | `company-info-step.tsx`: inputs use `defaultValue` from hardcoded step-config. No onChange handlers. No form state. User types company name → clicks Next → data is lost. |
| 3 | **Shareholders/Partners steps are mock** | **CRITICAL** | `shareholders-step.tsx` shows one hardcoded shareholder (Johan Svensson, 500 shares, 100%). "Lägg till aktieägare" button is non-functional. Same for partners. |
| 4 | **Seed API is never called** | **CRITICAL** | `/api/onboarding/seed` has full working code to insert shareholders/partners/members, but NO step component ever calls it. Dead code. |
| 5 | **No Bolagsverket auto-fetch** | HIGH | Bokio enters org number → auto-fills company name, address, registration date. Scope AI shows an external link button to Bolagsverket website. No API integration. |
| 6 | **Bank connection says "coming soon"** | HIGH | `bank-step.tsx` shows bank logos but no actual Open Banking/PSD2 flow. |
| 7 | **Documents upload is placeholder** | HIGH | Three UI options (upload files, connect email, do later) but no actual file upload logic. |
| 8 | **Team invite is placeholder** | HIGH | Email input and role selector exist but no invite functionality. |
| 9 | **No company logo upload** | HIGH | Not mentioned anywhere in onboarding. |
| 10 | **No form validation** | HIGH | No org number format check (XXXXXX-XXXX), no share capital minimum (25k for AB), no required field enforcement. |
| 11 | **Account works without onboarding** | MEDIUM | User can skip and access full dashboard with zero company data. No restrictions. |

#### What's Collected vs. What's Needed

| Data Point | UI Exists? | Saves to DB? | Needed For |
|------------|-----------|-------------|------------|
| Company type | YES | **YES** | Everything |
| Org number | YES | **NO** | SIE, Skatteverket, invoices |
| Company name | YES | **NO** | Invoices, reports, documents |
| Address | NO | **NO** | Invoices, payslips, filings |
| Contact person | NO | **NO** | Legal requirement for filings |
| Fiscal year end | NO | **NO** | All reports, deadlines |
| VAT registration | NO | **NO** | Momsdeklaration |
| Accounting method | NO | **NO** | Transaction booking |
| F-skatt status | NO | **NO** | Self-employment, invoices |
| Share capital | YES | **NO** | Aktiebok, K10, Årsredovisning |
| Shareholders | YES (mock) | **NO** | Aktiebok, Utdelning, K10 |
| Partners | YES (mock) | **NO** | Delägare, partner capital |
| Employees (Y/N) | NO | **NO** | Löner feature flag |
| Company logo | NO | **NO** | Invoices, documents |
| SIE import | YES | **YES** | Bookkeeping history |

---

### 7.2 SETTINGS SYSTEM (10 Tabs)

**Files:** `src/components/installningar/settings-dialog.tsx`, 10 tab files in `tabs/`, `src/services/settings-service.ts`, `src/hooks/use-preferences.ts`

#### Tab-by-Tab Assessment

| Tab | Saves to DB? | Rating | Key Finding |
|-----|-------------|--------|-------------|
| **Konto (Account)** | YES | Needs Work | Name/email save. Avatar upload button exists but NO file handler — non-functional. |
| **Företag (Company)** | YES | Good | Company type, name, org number, accounting method, VAT frequency, fåmansföretag checkbox, SIE export. **Best settings tab.** |
| **Integrationer** | NO | Placeholder | All 3 bank integrations show "Coming soon". Calendar integration partially works (generates subscription URL). |
| **Fakturering (Billing)** | NO | Mock | Plan shown as static "449 kr/månad". Buy credits triggers `alert()`. Payment method hardcoded test card (4242). No Stripe integration. |
| **Notiser (Notifications)** | YES | Good | 5 email notification toggles all save via API. Missing: tax deadline, VAT declaration, payroll reminders. |
| **Utseende (Appearance)** | YES | Good | Theme (light/dark/system), density (compact/normal/comfortable), sidebar compactness. All persist. |
| **Språk & Region** | YES | Excellent | Language (5 locales), currency, date format, first day of week, **text mode (enkel/avancerad)**. All persist. Best implemented tab. |
| **E-post (Email)** | YES | Good | Daily digest, marketing toggle. Test email via Resend API works. |
| **Tillgänglighet** | YES | Good | Reduce motion, high contrast, larger text. All persist. |
| **Säkerhet (Security)** | NO | Mock | 2FA status hardcoded "enabled". Sessions hardcoded (MacBook, iPhone). Privacy toggles have no handlers. Non-functional. |

#### What the Company Tab Covers (the best tab)

- Company type selector (AB/EF/HB/KB/Förening)
- Company name, org number, VAT number
- Address (street, city, zip)
- **Bokföringsmetod**: Fakturametoden / Kontantmetoden
- **Momsredovisningsperiod**: Monthly / Quarterly / Annual
- **Fåmansföretag (3:12)**: Checkbox
- SIE export button (calls `/api/sie/export`)
- Data deletion with confirmation

#### What the Company Tab is MISSING

| Missing Setting | Impact | Bokio Has It? |
|----------------|--------|--------------|
| **Fiscal year end picker** | Reports show wrong periods. Field exists in DB but NO UI. | YES |
| **F-skatt registration** | Required on invoices, impacts self-employment. | YES |
| **Employer registration toggle** | Payroll can't be properly activated. | YES |
| **SNI code (industry classification)** | Required by Skatteverket. | YES |
| **Company logo upload** | Invoices, payslips, documents look unprofessional. | YES |
| **VAT registration date** | When was company VAT-registered? Important for audits. | YES |
| **Registration date** | When was company founded? Needed for SIE4. | YES |
| **Multiple contact persons** | Large companies have accountant + director contacts. | YES |

---

### 7.3 SETTINGS SERVICE

**Files:** `src/services/settings-service.ts` (409 lines)

#### What Works
- **getUserProfile()** — fetches from Supabase `profiles` table
- **getSubscriptionStatus()** — real usage from model-auth, tier limits
- **getNotificationPreferences()** — reads/writes `settings` table
- **getIntegrations()** — queries `integrations` table
- **getBankConnections()** — queries `bankconnections` table
- **initiateBankConnection()** — creates pending record in DB

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **syncBankTransactions is fake** | HIGH | Creates random transaction counts: `Math.floor(Math.random() * 20) + 5`. Only updates `last_sync_at` timestamp. No actual bank API calls. |
| 2 | **Bank connection initiation is incomplete** | HIGH | Creates a pending record but the redirect URL (to bank OAuth) doesn't exist as an endpoint. |
| 3 | **Integrations table always empty** | MEDIUM | No seeding, no connection flow. `getIntegrations()` returns empty array. |

---

### 7.4 AI SETTINGS TOOLS

**Files:** `src/lib/ai-tools/common/settings.ts` (370 lines)

#### Tools Assessment

| Tool | Real Data? | Production Ready? | Detail |
|------|-----------|-------------------|--------|
| `getSubscriptionStatusTool` | YES | YES | Real usage from DB, tier limits, token counts |
| `getNotificationPreferencesTool` | YES | YES | Real preferences from settings table |
| `updateNotificationPreferencesTool` | YES | YES | Actually writes to DB |
| `listActiveIntegrationsTool` | YES | Partial | Queries real table but always empty |
| `connectBankAccountTool` | Partial | NO | Creates pending record but no OAuth redirect exists |
| `syncBankTransactionsTool` | NO | NO | Fake — random transaction counts, no bank API |

---

### 7.5 PREFERENCES PERSISTENCE

**Files:** `src/hooks/use-preferences.ts` (165 lines), `src/app/api/user/preferences/route.ts`

#### What Works
- **14 user preferences** all properly persist to Supabase `user_preferences` table
- **Optimistic updates** — UI updates instantly, reverts on API failure
- **Default values** — API returns sensible defaults if no record exists
- **Key validation** — only accepts known preference keys
- **Proper upsert** — `ON CONFLICT (user_id) DO UPDATE`

#### Stored Preferences (Complete)
```
Notifications: notify_new_invoices, notify_payment_reminders,
               notify_monthly_reports, notify_important_dates, notify_mobile
Appearance:    theme, density, compact_sidebar
Language:      language, currency, date_format, first_day_of_week, text_mode
Email:         daily_summary, marketing_emails
Accessibility: reduce_motion, high_contrast, larger_text
```

---

### PHASE 7 SUMMARY: ONBOARDING & SETTINGS

#### Overall Maturity: ONBOARDING: FACADE (10%), SETTINGS: PARTIAL (50%)

This is a tale of two halves. The settings system is surprisingly functional — 7 of 10 tabs actually persist to database, the company tab covers key accounting fields, and the preference system is well-engineered. But the **onboarding is a complete facade** that collects one field (company type) out of 20+ needed.

#### The Core Problems

1. **Onboarding collects nothing** — 11 beautiful steps, 1 field saved. An accountant finishes onboarding with zero company data in the database. Every report, invoice, and filing will fail.
2. **No Bolagsverket integration** — Bokio auto-fills everything from org number. Scope AI makes users manually type everything (and then doesn't save it).
3. **No company logo upload anywhere** — not in onboarding, not in settings. Invoices and documents look unprofessional.
4. **Fiscal year end has no UI** — the field exists in the database and provider but there's no settings field to change it. Stuck at 12-31.
5. **Bank integrations don't exist** — "Coming soon" in UI, random fake data in sync function.
6. **Billing/payment is mock** — no Stripe integration, hardcoded test card, `alert()` for credits.

#### Top 10 Must-Fix Items (Prioritized)

1. **Wire onboarding steps to database** — add controlled inputs with onChange → CompanyProvider → API save for company name, org number, address, contact person
2. **Add fiscal year end picker** to settings Company tab (field exists in DB, just needs UI)
3. **Connect shareholder/partner seed** — call existing `/api/onboarding/seed` from the step components
4. **Implement company logo upload** — use Supabase Storage, add to companies table, surface in onboarding + settings
5. **Add Bolagsverket lookup** — org number → auto-fetch company details (API or scraping)
6. **Add F-skatt, SNI-kod, employer registration** to settings Company tab
7. **Fix fiscal year throughout app** — once configurable, make statistics/reports/deadlines use it
8. **Implement or remove bank integrations** — "coming soon" for months erodes trust
9. **Fix billing tab** — either implement Stripe or remove the tab entirely
10. **Add form validation to onboarding** — org number format, share capital minimum, required fields

#### Architecture Strengths
- Preference persistence system is excellent (14 settings, optimistic updates, proper upsert)
- Company provider is well-designed (hybrid DB + localStorage, debounced saves)
- Settings service layer is comprehensive (409 lines, real Supabase queries)
- Text mode (enkel/avancerad) is a differentiator vs Bokio/Visma
- Conditional onboarding steps per company type (config exists)
- Seed API for shareholders/partners exists and works (just needs to be called)
- SIE import actually works (parses, inserts to DB)

#### Architecture Gaps
- Onboarding has no form state management (no react-hook-form, no controlled inputs)
- No data validation anywhere in onboarding
- Onboarding steps and database are completely disconnected
- No Bolagsverket API integration
- No company logo/image storage
- No bank API integration (Tink/Plaid/Open Banking)
- No payment integration (Stripe/Klarna)
- Security tab is entirely mock (2FA, sessions)
- Fiscal year end configurable in DB but not in UI
- 3 of 10 settings tabs are non-functional (billing, integrations, security)

---

## PHASE 8: AI MODE (AI Assistant & Chat System)

**Components:** ScopeBrain Agent, 60+ AI Tools, Chat API, Streaming Protocol, System Prompt, Model Selection, Tool Registry, Block-based UI (25+ block types), 20+ Card Components, Confirmation Flow, Audit Logging

**Concept:** The AI assistant is "the user's accountant" — it does everything the user would do manually. When the AI creates a verification, invoice, or report, it MUST persist real data that can be downloaded and submitted to Skatteverket. The AI should be accurate, and its outputs should be legally compliant.

---

### 8.1 ARCHITECTURE OVERVIEW

**Data flow:**
```
User input → useSendMessage → /api/chat POST → ScopeBrain agent
    → Model selection (Sonnet 4 + extended thinking)
    → System prompt + company context + 60+ tools
    → Streaming response (T:/TH:/D:/W: protocol)
    → useStreamParser → AIOverlayProvider → Block renderer → UI
```

**Key architectural decisions:**
- Single unified agent (ScopeBrain) replacing old multi-agent system
- Always uses Claude Sonnet 4 with extended thinking (good for accounting reasoning)
- 60+ tools organized by domain: bokföring, löner, skatt, parter, common, planning
- Rich block-based output system (25+ block types: stat-cards, financial-table, chart, checklist, etc.)
- Confirmation flow for write operations (2-step: preview → execute)
- Audit logging of all tool executions to database

---

### 8.2 CHAT API & SECURITY

**Files:** `src/app/api/chat/route.ts`, `validation.ts`, `streaming.ts`

#### What Works
- **Authentication** — `verifyAuth()` runs first, rejects unauthenticated requests
- **User-scoped database** — `createUserScopedDb()` ensures RLS isolation
- **Rate limiting** — 30 requests per 60 seconds per client
- **Budget enforcement** — checks token usage against tier limits before execution
- **Model authorization** — server-side tier check (demo → no models, pro → standard models)
- **Conversation persistence** — user and assistant messages saved to `conversations`/`messages` tables
- **Streaming** — clean protocol with T: (text), TH: (thinking), D: (data), W: (walkthrough blocks), E: (error)

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **CSRF validation defined but never called** | HIGH | `validateRequestOrigin()` exists in `validation.ts` but `route.ts` never invokes it. Cross-origin requests could be crafted. |
| 2 | **Input validation not used** | HIGH | `validateChatMessages()` and `validateTokenLimits()` are exported but never called in the route handler. Unbounded message sizes could cause LLM failures or budget overruns. |
| 3 | **Token estimation is rough** | MEDIUM | `Math.ceil((message.length + fullContent.length) / 4)` — counts characters not tokens. Swedish text (å,ä,ö) and extended thinking can be 2-3x off. Budget tracking is inaccurate. |
| 4 | **Demo mode leakage risk** | MEDIUM | Demo users get simulated responses via `handleDemoMode()`. Response uses same streaming protocol (T: prefix). If frontend doesn't show "Demo Mode" banner, users can't distinguish from real AI. `X-Demo-Mode: true` header is set but must be checked client-side. |
| 5 | **Client-provided conversationId accepted without ownership check** | MEDIUM | If RLS is weak, a user could inject into another user's conversation. |

---

### 8.3 SYSTEM PROMPT & SWEDISH ACCOUNTING CONTEXT

**Files:** `src/app/api/chat/system-prompt.ts`, `src/lib/agents/scope-brain/system-prompt.ts`, `scenarios-loader.ts`

#### What Works
- **BAS kontoplan basics** included: 1xxx assets, 2xxx equity+liabilities, 3xxx revenue, 4-7xxx expenses, 8xxx financial
- **Common accounts** listed: 1930 (bank), 2440 (leverantörsskuld), 2610 (utgående moms), 2640 (ingående moms)
- **VAT rates** correct: 25% standard, 12% food/hotels, 6% books/transport, 0% exempt
- **Walkthrough block guidance** — max 12 blocks, max 6 stat cards, appropriate block type selection
- **Company context** injected at runtime — live data about the specific company

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **No BAS account selection rules** | HIGH | Prompt lists accounts but doesn't teach AI when to use 5xxx vs 6xxx, when to use 1790 vs 2990 for accruals, or how to choose between similar accounts. AI could book to wrong account. |
| 2 | **No Swedish tax rules** | HIGH | Missing: K10 rules, periodization rules, reverse VAT charges (importköp), when input VAT is NOT deductible, margin taxation for used goods. |
| 3 | **No government deadline knowledge** | HIGH | Missing: Moms due 12th/26th of month, AGI monthly, INK2 deadline, Årsredovisning 7 months after FY end. AI can't warn about upcoming deadlines accurately. |
| 4 | **No error prevention guidance** | MEDIUM | No warnings about common mistakes: booking expenses to revenue accounts, VAT on exempt services, wrong partner accounts. |
| 5 | **Few-shot scenarios minimal** | MEDIUM | Scenarios loader provides basic patterns but lacks complex multi-step accounting workflows (year-end closing, salary+tax+AGI flow, dividend decision chain). |

---

### 8.4 TOOL REGISTRY & CONFIRMATION FLOW

**Files:** `src/lib/ai-tools/registry.ts`, `types.ts`, `index.ts`

#### What Works
- **Clean registry pattern** — tools registered by domain, discovered at initialization
- **Confirmation flow** — 2-step: tool returns `confirmationRequired` → user approves → tool executes with `confirmationId`
- **5-minute expiry** on pending confirmations
- **Audit logging** — all tool executions logged to database with toolName, parameters, result, userId
- **Parameter preservation** — confirmed params stored so AI can't change them between preview and execution

#### Critical Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Confirmation ≠ Execution** | **CRITICAL** | The most severe issue in the entire app. Tools that `requiresConfirmation: true` show a confirmation dialog, but when the user approves and the tool runs again, many tools **don't differentiate between preview and confirmed state**. They return the same mock data. The registry calls `tool.execute()` again but tools have no way to know they should actually persist. |
| 2 | **Audit log records false positives** | HIGH | Audit logs say "success: true" when tools return `{ success: true }` even though no data was written to the database. An audit would show "50 transactions created successfully" when zero were actually persisted. |
| 3 | **No expired confirmation cleanup** | LOW | `clearExpiredConfirmations()` exists but is never called. Map accumulates entries indefinitely (minor memory leak). |

---

### 8.5 AI TOOLS: READ vs WRITE ASSESSMENT

This is the **most critical finding of the entire audit**. The AI can READ real data from the database, but almost all WRITE operations are **stubs that pretend to succeed**.

#### READ Tools (Production-Ready)

| Tool | Domain | Data Source | Status |
|------|--------|-----------|--------|
| `get_transactions` | Bokföring | `/api/transactions` → Supabase | **REAL** |
| `get_transactions_missing_receipts` | Bokföring | API | **REAL** |
| `get_customer_invoices` | Bokföring | `invoiceService` → Supabase | **REAL** |
| `get_supplier_invoices` | Bokföring | `invoiceService` → Supabase | **REAL** |
| `get_overdue_invoices` | Bokföring | `invoiceService` → Supabase | **REAL** |
| `get_receipts` | Bokföring | `receiptService` → Supabase | **REAL** |
| `get_unmatched_receipts` | Bokföring | `receiptService` → Supabase | **REAL** |
| `get_verifications` | Bokföring | `verificationService` → Supabase | **REAL** |
| `get_verification_stats` | Bokföring | `verificationService` → Supabase | **REAL** |
| `get_accounts` | Bokföring | `accountService` → Supabase | **REAL** |
| `get_account_balance` | Bokföring | `accountService` → Supabase | **REAL** |
| `get_balance_sheet_summary` | Bokföring | `accountService` → Supabase | **REAL** |
| `get_chart_of_accounts` | Bokföring | `accountService` → Supabase | **REAL** |
| `get_shareholders` | Parter | `shareholderService` → Supabase | **REAL** |
| `get_share_register_summary` | Parter | `shareholderService` → Supabase | **REAL** |
| `get_compliance_docs` | Parter | `/api/compliance` → Supabase | **REAL** |
| `get_board_members` | Parter | `boardService` → Supabase | **REAL** |
| `get_company_statistics` | Common | `companyStatisticsService` → Supabase | **REAL** |
| `get_dashboard_counts` | Common | `companyStatisticsService` → Supabase | **REAL** |
| `get_events` | Common | Supabase events table | **REAL** |

#### WRITE Tools — STUBS (Not Production-Ready)

| Tool | What User Sees | What Actually Happens | Evidence |
|------|---------------|----------------------|----------|
| `categorize_transaction` | "Transaktion kategoriserad" | **Nothing** — returns `{ success: true }` without any database call | Stub at execute() |
| `create_transaction` | "Transaction created" with ID | Returns `id: tx-${Date.now()}` — **never persists** | Mock ID, no DB call |
| `bulk_categorize_transactions` | "Kategoriserad 50 transaktioner" | Returns count but **no transactions updated** | Preparation only |
| `create_invoice` | Confirmation dialog → "Invoice created" | Returns `id: inv-${Date.now()}` — **never persists** | No invoiceService.create() call |
| `send_invoice_reminder` | "Påminnelse skickad" | **No email sent** — returns `sent: false` | Stub |
| `void_invoice` | "Faktura makulerad" | **No credit note created** | Stub |
| `book_invoice_payment` | "Betalning bokförd" | Returns mock verification ID — **no journal entry** | Stub |
| `create_receipt` | "Kvitto skapat" with ID | Returns `id: rcpt-${Date.now()}` — **never persists** | Mock ID |
| `match_receipt_to_transaction` | "Kvitto kopplat" | **No link created** | Stub |
| `match_payment_to_invoice` | "Betalning matchad" | Returns mock with amount=0 — **incomplete** | Hardcoded zero |
| `periodize_expense` | Preview of monthly entries | **No verifications created** | Mock entries |
| `reverse_verification` | "Verifikation reverserad" | Returns mock with `amount: 5000` hardcoded — **no reversal** | Hardcoded mock |
| `create_accrual` | "Upplupen kostnad skapad" | **No verification created** | Stub |
| `transfer_shares` | "Aktieöverlåtelse registrerad" | Returns `remainingShares: 500` hardcoded — **no DB update** | Full mock |

#### REPORT Tools — TODO / Not Implemented

| Tool | Status | Detail |
|------|--------|--------|
| `get_income_statement` | **TODO** | Returns `success: false, "Ingen resultaträkning tillgänglig"` |
| `get_balance_sheet` | **TODO** | Returns `success: false` |
| `export_sie` | **Stub** | Confirmation only, no SIE file generated |
| `generate_financial_report` | **TODO** | Returns `success: false` |
| `prepare_ink2` | **TODO** | Returns `success: false` |
| `close_fiscal_year` | **TODO** | Returns `success: false` |
| `draft_annual_report` | **Partial** | Fetches company info but returns empty report sections |
| `generate_management_report` | **Stub** | Hardcoded template, not data-driven |

---

### 8.6 STREAM PARSER & UI

**Files:** `src/hooks/chat/use-stream-parser.ts`, `use-send-message.ts`, `src/components/ai/blocks/`

#### What Works
- **Protocol parsing robust** — handles T:, TH:, W:, D: prefixes correctly
- **Block-based UI** — 25+ block types for rich structured output (stat-cards, financial-table, chart, timeline, checklist, comparison, etc.)
- **20+ card components** — domain-specific cards (InvoiceCard, VerificationCard, PayslipCard, K10Card, VATReportCard, etc.)
- **14 preview components** — form previews for government filings (VAT, INK2, AGI, K10, annual report)
- **Confirmation UI** — shows summary, warnings, action buttons for write operations
- **Extended thinking** — TH: blocks properly parsed but not exposed to users

#### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Still supports deprecated AIDisplayInstruction** | LOW | Legacy format parsed alongside new W: protocol. Should complete migration. |
| 2 | **No malformed JSON recovery** | LOW | Parser catches JSON errors but continues without notification. Could silently drop data. |
| 3 | **Retry logic could create duplicates** | MEDIUM | `useSendMessage` has retry logic that could re-send a message if a write tool partially executed. No idempotency keys. |

---

### 8.7 MODEL SELECTION & COST

**Files:** `src/lib/agents/scope-brain/model-selector.ts`, `src/lib/ai/models.ts`

#### Configuration
- **ScopeBrain always uses:** Claude Sonnet 4 with extended thinking (10,000 token thinking budget)
- **User-facing tiers:** Snabb (Gemini Flash, 1x), Smart (GPT-4o, 3x), Expert (Claude Opus 4, 15x)
- **Budget:** Pro tier gets 500,000 tokens/month + purchased credits

#### Assessment
- Using Sonnet with thinking for accounting is **correct** — reasoning quality matters for financial accuracy
- Server-side model enforcement prevents client manipulation
- Cost multipliers are reasonable

#### Issue
- User-facing tier selection and ScopeBrain's hardcoded Sonnet create confusion: if user selects "Snabb" (Gemini), ScopeBrain still uses Sonnet. The user-facing selector is effectively ignored by the backend agent.

---

### 8.8 WHAT THE AI CAN AND CANNOT DO

#### CAN DO (Real, Production-Ready):
- Answer questions about the user's financial data (transactions, invoices, receipts, verifications)
- Show account balances and chart of accounts
- Display shareholder registry and board members
- Retrieve compliance documents
- Show company statistics and KPIs
- Navigate to pages/modules
- Display structured walkthroughs with rich blocks
- Track conversations with persistence

#### CANNOT DO (Stubs/Mock):
- Create invoices, receipts, or transactions that persist
- Categorize bank transactions
- Generate income statements or balance sheets
- Export SIE files
- Prepare tax declarations (INK2, K10)
- Close fiscal year
- Match payments to invoices
- Send invoice reminders
- Create accruals or periodizations
- Transfer shares
- Generate any downloadable documents

---

### PHASE 8 SUMMARY: AI MODE

#### Overall Maturity: READ-ONLY ASSISTANT (30-40% production-ready)

The AI Mode has an **impressive architecture** — streaming protocol, block-based rich output, confirmation flows, audit logging, and a comprehensive tool registry. But the **execution layer is hollow**: nearly every write operation is a stub that returns success without persisting data.

#### The Core Problems

1. **Write tools are stubs** — 14+ write tools return `{ success: true }` with fake IDs (`inv-${Date.now()}`) but never call database services. Users see "Invoice created" but nothing is saved.
2. **Confirmation flow is broken** — the 2-step flow works in the UI but tools don't differentiate preview from execution. After user confirms, the same mock data is returned.
3. **Report tools are TODOs** — 5 of 8 report generation tools return `success: false` with "not implemented" messages. AI can't generate income statements, balance sheets, or tax forms.
4. **Audit log records false positives** — logs show "success" for operations that never persisted. An auditor would see fabricated success records.
5. **System prompt lacks Swedish tax depth** — no K10 rules, periodization guidance, reverse VAT charges, or government deadline knowledge.

#### Top 10 Must-Fix Items (Prioritized)

1. **Implement write tool persistence** — connect `create_invoice`, `create_transaction`, `create_receipt`, `create_verification` to actual database services
2. **Fix confirmation→execution flow** — tools must check `confirmationId` and actually persist on second call
3. **Implement report generation** — `get_income_statement` and `get_balance_sheet` must query real verifications
4. **Fix audit logging** — add `persistedToDb: boolean` field, only log success when data is actually saved
5. **Add Swedish tax rules to system prompt** — K10, periodization, reverse charges, government deadlines
6. **Implement SIE export tool** — generate actual .se file from verifications
7. **Add debit/credit validation** — backend must enforce balanced journal entries before saving
8. **Add duplicate detection** — prevent AI from creating duplicate transactions/verifications on retry
9. **Call existing input validation** — invoke `validateChatMessages()` and `validateTokenLimits()` in route handler
10. **Fix demo mode isolation** — prevent any database writes from demo users, show clear demo banner

#### Architecture Strengths
- Single unified agent (ScopeBrain) — clean, maintainable
- Sonnet 4 + extended thinking — appropriate for accounting reasoning
- 60+ tools organized by domain — comprehensive coverage
- Rich block-based output — 25+ types for structured financial display
- Streaming protocol (T:/TH:/D:/W:) — clean separation
- Confirmation flow architecture — 2-step with 5-minute expiry
- Audit logging infrastructure — framework exists, just needs correct data
- Real read operations — all database queries work correctly with RLS
- Budget enforcement — token limits per tier

#### Architecture Gaps
- Write tools are stubs (the largest gap in the entire app)
- Confirmation flow doesn't trigger actual execution
- No transaction semantics for multi-step operations (partial failures leave unbalanced ledger)
- Report generation not implemented (TODO stubs)
- No PDF/document generation from AI tools
- No Skatteverket-compatible output from any tool
- System prompt lacks deep Swedish accounting knowledge
- Demo mode not properly isolated
- Token counting is character-based, not token-based
- Input validation defined but never called

---

## FULL AUDIT COMPLETE

All 8 phases have been audited:

| Phase | Category | Maturity | Score |
|-------|----------|----------|-------|
| 1 | Bokföring | Early Beta | 35-45% |
| 2 | Rapporter | Partial | 40-55% |
| 3 | Löner | Prototype/Demo | 20-30% |
| 4 | Händelser | Early Beta | 35-45% |
| 5 | Ägare & Styrning | Early Beta | 40-55% |
| 6 | Företagsstatistik | Functional but Unreliable | 45-55% |
| 7 | Onboarding & Settings | Onboarding: Facade / Settings: Partial | 10% / 50% |
| 8 | AI Mode | Read-Only Assistant | 30-40% |

### Cross-Cutting Issues (Affect All Categories)

1. **No fiscal year support** — hardcoded to calendar year throughout. ~40% of Swedish companies use non-calendar fiscal years.
2. **No company logo upload** — invoices, payslips, and documents all lack company branding.
3. **Onboarding collects nothing** — 11 steps but only company type saves. All other features start with zero company data.
4. **AI write tools are stubs** — the AI can read everything but can't create or modify anything that persists.
5. **No Bolagsverket integration** — no auto-fetch of company details, no registration filing.
6. **No BankID/digital signing** — signature flows are UI-only with no backend.
7. **No bank API integration** — "coming soon" everywhere. Bokio/Visma core feature.
8. **Hardcoded tax rates** — egenavgifter, dividend tax, employer contributions frozen at one year's values with no update mechanism.
9. **No Skatteverket-compatible exports** — SIE, INK2, K10, AGI, VAT all either mock or TODO.
10. **Audit trail not tamper-proof** — hash chain defined in schema but never implemented.
