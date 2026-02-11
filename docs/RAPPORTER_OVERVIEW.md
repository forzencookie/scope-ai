# Rapporter — Category Overview

> Last updated: 2026-02-10

## What Rapporter Is

Rapporter is the reporting engine of Scope AI. It takes raw bookkeeping data (verifications, account balances, payslips) and transforms it into the official Swedish tax forms, financial statements, and declarations that every business must file. Think of it as a mini accountant that does the paperwork — it doesn't submit to government agencies, but it produces the finished documents ready for manual filing.

The core philosophy: **auto-calculate from bookkeeping, let the user override manually, then export in the correct format.**

---

## Pages & What They Do

### 1. Resultaträkning (Income Statement)

**File:** `src/components/rapporter/resultatrakning.tsx`
**Data source:** Supabase RPC `get_account_balances` via `useFinancialReports()` hook
**Export:** PDF download

Displays a standard Swedish income statement (P&L) calculated from the BAS kontoplan account ranges. Shows current year vs previous year comparison. Revenue sections (3000-3999), cost sections (4000-7999), and financial items (8000-8999) are all auto-calculated from real ledger data.

**Production status:** Real data. Dynamic years. No mock values.

---

### 2. Balansräkning (Balance Sheet)

**File:** `src/components/rapporter/balansrakning.tsx`
**Data source:** Supabase RPC `get_account_balances` via `useFinancialReports()` hook
**Export:** PDF download

Standard balance sheet with assets (1000-1999), equity + liabilities (2000-2999). Compares current vs previous year. Same real data pipeline as Resultaträkning.

**Production status:** Real data. Dynamic years. No mock values.

---

### 3. Momsdeklaration (VAT Declaration)

**File:** `src/components/rapporter/moms/` (directory)
**Data source:** `/api/financial-periods` + `/api/reports/vat` + `VatProcessor` calculates from verifications
**Export:** XML download (Skatteverket format)

Displays VAT periods with per-period breakdown. Each period can be opened in a full editing dialog with all SKV 4700 fields (ruta 05-62) organized by section. Fields auto-calculate from bookkeeping but are manually editable. Supports save + XML export. Submitted periods are immutable (accounting principle).

**Production status:** Real data. Live draft calculation from verifications. Submitted periods use saved immutable snapshots. No mock values in active code.

---

### 4. Inkomstdeklaration / INK2 (Corporate Income Tax)

**File:** `src/components/rapporter/inkomstdeklaration.tsx`
**Data source:** `useVerifications()` → `Ink2Processor.calculateAll()`
**Export:** SRU files (Skatteverket digital format)

Calculates all INK2 fields from real ledger data. Supports filtering by income/balance/tax adjustment sections. Dynamic tax year via `useTaxPeriod()` hook which respects the company's fiscal year end date. SRU preview dialog generates INFO.SRU + BLANKETTER.SRU for Skatteverket filing.

**Production status:** Real data. Dynamic years. Full INK2 field mapping.

---

### 5. NE-bilaga (Sole Trader Tax Attachment)

**File:** `src/components/rapporter/ne-bilaga.tsx`
**Data source:** Supabase RPC `get_account_balances` (direct call)
**Export:** PDF download + Generera wizard

Maps BAS account ranges to NE form fields (R1-R24). Revenue from 3000-3999, costs from 4000-7999. Calculates egenavgifter (28.97%), schablonavdrag (25% deduction), and överskott. The "Generera" button opens a 2-step wizard where all values are editable — the user can adjust any field and add periodiseringsfond (up to 30% of result) and återföring from previous years. Saves draft/done status to API.

**Production status:** Real data from ledger. Dynamic tax year. Periodiseringsfond on the main display page is hardcoded to 0 (by design — requires user input via wizard). The wizard dialog handles the full manual flow.

---

### 6. K10 — Kvalificerade Andelar (Closely-Held Company Shares)

**File:** `src/components/rapporter/k10/` (directory)
**Data source:** `useK10Calculation()` → verifications + shareholder data + tax params
**Export:** SRU files (Skatteverket digital format)

Calculates the K10 form for fåmansföretag under the 3:12 rules. Includes schablonbelopp, lönebaserat utrymme, sparat utdelningsutrymme, and gränsbelopp. Has a wizard dialog for creating new K10 blanketts and a history table of past filings. SRU export generates properly formatted declaration files.

**Production status:** Real data. Dynamic tax year. No PDF export (intentional — Skatteverket only accepts SRU).

---

### 7. AGI — Arbetsgivardeklaration (Employer Declaration)

**File:** `src/components/rapporter/agi/` (directory)
**Data source:** `/api/payroll/payslips` endpoint
**Export:** XML download per period

Generates employer declarations from real payslip data. Groups by period, counts unique employees, calculates employer contributions (31.42% of gross salary). Each period row has XML download. Detail dialog shows per-period breakdown.

**Production status:** Real payslip data. Dynamic periods from actual payroll. Employer contribution rate (31.42%) is hardcoded — should be verified against current Skatteverket rates annually.

---

### 8. Årsredovisning (Annual Report)

**File:** `src/components/rapporter/arsredovisning.tsx`
**Data source:** `useVerifications()` → `AnnualReportProcessor`
**Export:** Wizard dialog (4 steps) → save draft to API

The most complex report. Shows section completion status (Förvaltningsberättelse, Resultaträkning, Balansräkning, Noter, Underskrifter). The wizard flows through:
1. **Review financials** — auto-calculated from bookkeeping
2. **Förvaltningsberättelse** — text editors for verksamhet, väsentliga händelser, framtidsutsikter + resultatdisposition with utdelning input
3. **Noter** — redovisningsprinciper (pre-filled K2 standard text), medelantal anställda, övriga noter
4. **Confirm** — review all sections before saving

**Production status:** Real financial data. Dynamic fiscal year. Text editors for förvaltningsberättelse and noter are functional. Missing iXBRL export (Bolagsverket requires iXBRL, not PDF — this is a separate later phase).

---

### 9. Årsbokslut (Annual Closing — Sole Traders)

**File:** `src/components/rapporter/arsbokslut.tsx`
**Data source:** `useAccountBalances()` hook (verifications)
**Export:** PDF download + Generera wizard (3 steps)

Simplified annual closing for enskild firma. Shows P&L and balance sheet from real verification data. The "Generera" button opens a 3-step wizard:
1. **Resultaträkning** — all line items editable
2. **Balansräkning** — all line items editable, shows balance check (warns if assets ≠ EK + skulder)
3. **Granska** — summary review before saving

**Production status:** Real data. Dynamic fiscal year. All display labels now use dynamic years.

---

## How This Provides Value

### For accountants and business owners:

1. **Auto-calculation eliminates manual entry** — Every report pulls from real bookkeeping data. No re-typing numbers from the ledger into tax forms.

2. **Manual override preserves control** — The wizard dialogs pre-populate from bookkeeping but every field is editable. This is critical because accountants sometimes need to adjust values for tax optimization (periodiseringsfond, resultatdisposition, etc.).

3. **Correct export formats** — SRU for Skatteverket, XML for AGI/Moms. These are the actual digital formats the agencies accept. No useless PDF exports for forms that require digital filing.

4. **Draft/done workflow** — Reports can be saved as drafts and revisited. Marking as "done" creates an immutable snapshot. This matches how accountants actually work — iterative review before final submission.

5. **Swedish legal compliance** — Egenavgifter rates (28.97%), schablonavdrag (25%), K2 redovisningsprinciper, INK2 field mappings, VAT ruta codes — all follow Skatteverket and BFN standards.

---

## Honest Assessment: What's Production-Ready and What's Not

### Production-Ready

| Page | Data | Years | Export | Verdict |
|------|------|-------|--------|---------|
| Resultaträkning | Real (Supabase RPC) | Dynamic | PDF | Ready |
| Balansräkning | Real (Supabase RPC) | Dynamic | PDF | Ready |
| Momsdeklaration | Real (verifications + API) | Dynamic | XML | Ready |
| Inkomstdeklaration | Real (verifications) | Dynamic | SRU | Ready |
| NE-bilaga | Real (Supabase RPC) | Dynamic | PDF + Wizard | Ready |
| K10 | Real (verifications + shareholder) | Dynamic | SRU | Ready |
| AGI | Real (payslips API) | Dynamic | XML | Ready |
| Årsredovisning | Real (verifications) | Dynamic | Wizard (save) | Partial — missing iXBRL |
| Årsbokslut | Real (verifications) | Dynamic | PDF + Wizard | Ready |

### Known Remaining Issues

1. **iXBRL export for Årsredovisning** — Bolagsverket requires iXBRL format, not PDF. This is the single biggest gap. The årsredovisning content (förvaltningsberättelse, noter, financial statements) is complete, but the export format isn't built yet. This is a significant engineering effort (iXBRL taxonomy mapping) and is intentionally deferred.

2. **Dead mock data in constants.ts** — The file `src/components/rapporter/constants.ts` contains ~100 lines of unused mock data (vatPeriods, contributionPeriods, declarationItems). None of this is used by any component. It should be cleaned up.

3. **AGI employer contribution rate** — Hardcoded at 31.42%. This rate changes annually and should be pulled from a configuration or verified against current Skatteverket tables.

4. **NE-bilaga periodiseringsfond on main page** — The main display always shows 0 for periodiseringsfond (R14/R15). This is by design — the user enters it via the wizard. But the main page doesn't reflect previously saved wizard values.

5. **INK2 preview dialog** — The `dialogs/ink2.tsx` file has some hardcoded display values ("Mitt Bolag AB", hardcoded address). This is a preview-only dialog, not a data entry form, so impact is cosmetic.

6. **No Skatteverket/Bolagsverket API integration** — The app generates the correct file formats (SRU, XML) but doesn't submit them electronically. Users must download and upload manually. This is intentional for the current phase — API integrations are expensive and complex.

### What's NOT Mock/Demo

Every single report page fetches from real data sources:
- **Supabase RPC** (`get_account_balances`) — for NE-bilaga, Resultaträkning, Balansräkning
- **Verifications hook** (`useVerifications()`) — for Årsredovisning, INK2, Moms, K10, Årsbokslut
- **Payslips API** (`/api/payroll/payslips`) — for AGI
- **Financial periods API** (`/api/financial-periods`) — for Moms

No report page uses static/mock data for its primary calculations.

---

## Architecture Notes

### Shared Components
- **ReportWizardShell** (`src/components/shared/report-wizard-shell.tsx`) — Shared dialog skeleton with step indicator, navigation, and footer (Spara utkast / Klar / Download). Used by NE-bilaga and Årsbokslut wizards.
- **TaxReportLayout** (`src/components/shared/layout/tax-report-layout.tsx`) — Shared page layout for tax reports with stats grid, AI card, and content area.
- **ReportLayout** (`src/components/shared/layout/report-layout.tsx`) — Simpler layout for display reports (Resultaträkning, Balansräkning).

### Data Flow
```
Bookkeeping (verifications/accounts)
    ↓
Supabase RPC or useVerifications() hook
    ↓
Processor (VatProcessor, Ink2Processor, AnnualReportProcessor, etc.)
    ↓
Report component (display)
    ↓
Wizard dialog (manual override)
    ↓
Export (SRU / XML / PDF)
```

### Filing Format Summary
| Report | Filing Target | Format |
|--------|--------------|--------|
| Moms | Skatteverket | XML |
| INK2 | Skatteverket | SRU |
| K10 | Skatteverket | SRU |
| NE-bilaga | Skatteverket (via INK1) | Manual / PDF reference |
| AGI | Skatteverket | XML |
| Årsredovisning | Bolagsverket | iXBRL (not yet built) |
| Årsbokslut | Internal / Bolagsverket | PDF |
| Resultaträkning | Internal | PDF |
| Balansräkning | Internal | PDF |
