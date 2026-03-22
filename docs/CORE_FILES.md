# Core Files — What We Keep

> These files contain Swedish law, government report formats, or complex domain logic that took real research to build. Everything else can be rebuilt with the AI-first vision in mind.

## 1. Bookkeeping Engine — `src/lib/bookkeeping/` (2,087 lines)

Enforces BFL (Bokföringslagen) — the foundation of every accounting mutation.

| File | Lines | What It Enforces |
|------|-------|-----------------|
| `entries/salary.ts` | 333 | Payroll verification entries + Semesterlagen 12% vacation accrual |
| `entries/sales.ts` | 368 | Sales & VAT entries + reverse charge rules (25/12/6/0%) |
| `entries/purchase.ts` | 191 | Purchase & input VAT entries + supplier invoicing |
| `entries/simple.ts` | 107 | Generic double-entry creation + debit/credit balance |
| `entries/index.ts` | 30 | Export + factory pattern |
| `validation.ts` | 144 | **Sequential gap-free verification numbering (BFL)** + debit=credit + BAS validation |
| `vat.ts` | 149 | Swedish VAT calculations (25/12/6/0%) + gross/net conversions |
| `types.ts` | 136 | Verification, entry, line, VAT rate types |
| `utils.ts` | 239 | BAS account lookup + validation against chart of accounts |
| `templates.ts` | 247 | Standard verification templates (sales, purchases, payroll) |
| `index.ts` | 143 | Public API + re-exports |

## 2. Generators — `src/lib/generators/` (2,204 lines)

Creates files in official formats for government submission. Binary/format specs — AI can't replace these.

| File | Lines | Format |
|------|-------|--------|
| `pdf-generator.ts` | 1,028 | K2 Arsredovisning PDF (annual report, balance sheet, income statement, notes) |
| `sru-generator.ts` | 459 | Skatteverket SRU format (INFO.SRU + BLANKETTER.SRU, CRLF) |
| `sie-generator.ts` | 325 | SIE4 export (Bokforingsnamnden standard) |
| `xbrl-generator.ts` | 184 | iXBRL for Bolagsverket (se-cd taxonomy) |
| `agi-generator.ts` | 138 | AGI2 Loneinformation (payroll report to Skatteverket) |
| `vat-xml-export.ts` | 60 | VAT XML export |
| `index.ts` | 10 | Exports |

## 3. Processors — `src/services/processors/` (3,609 lines)

Where accounting data meets government form fields. Maps BAS accounts to official form boxes.

| File | Lines | What It Maps |
|------|-------|-------------|
| `vat/vat-boxes.ts` | 459 | 33 VAT rutor per SKV 4700 — account ranges to form boxes |
| `vat/calculator.ts` | 291 | VAT calculation — reverse extraction, box formulas, section totals (A-H) |
| `vat/xml-export.ts` | 136 | VAT XML submission |
| `vat/utils.ts` | 124 | VAT helpers + rounding |
| `vat/types.ts` | 96 | VAT types |
| `vat/index.ts` | 55 | Export |
| `inkomstdeklaration-processor.ts` | 469 | INK2 form fields — balance sheet (2.1-2.50), income statement (3.1-3.27), tax adjustments (4.1-4.22) |
| `inkomstdeklaration-sru-processor.ts` | 12 | SRU export bridge |
| `tax/balance-sheet.ts` | 110 | K2 Balansrakning grouping |
| `tax/income-statement.ts` | 83 | K2 Resultatrakning grouping |
| `tax/ink2-processor.ts` | 134 | INK2 field mapping |
| `tax/tax-adjustments.ts` | 68 | Taxable adjustments (depreciation, provisions) |
| `tax/types.ts` | 98 | Tax processor types |
| `tax/index.ts` | 37 | Export |
| `periodiseringsfonder-processor.ts` | 231 | Periodization funds (K2 reserved earnings) |
| `investments-processor.ts` | 178 | Fixed asset depreciation schedules |
| `invoice-processor.ts` | 172 | Invoice import + OCR validation |
| `transaction-processor.ts` | 304 | Transaction batching + validation |
| `reports/calculator.ts` | 257 | Report metric calculations |
| `reports/types.ts` | 96 | Report types |
| `reports/processors.ts` | 82 | Report generation pipeline |
| `reports/index.ts` | 55 | Export |
| `ai-tool-types.ts` | 62 | AI tool type definitions |

## 4. Tax Law Data — `src/data/` + `src/lib/` (~800 lines)

Lookup tables from Swedish law. Not reasoning — pure reference data.

| File | Lines | What It Contains |
|------|-------|-----------------|
| `src/data/accounts.ts` | 541 | BAS Chart of Accounts 2024 (400+ accounts, 1xxx-8xxx) |
| `src/data/account-constants.ts` | 81 | Account class definitions |
| `src/lib/tax-periods.ts` | 193 | VAT/tax deadlines — monthly (12th), quarterly, annual (26th) + fiscal year calc |
| `src/lib/swedish-tax-rules.ts` | 31 | Prisbasbelopp (2023: 52,500, 2024: 57,300, 2025: 58,800) |

## 5. Core Compliance Services (~2,100 lines)

Services that enforce legal invariants — not simple CRUD.

| File | Lines | Legal Requirement |
|------|-------|-----------------|
| `verification-service.ts` | 486 | BFL — sequential numbering, create/search verifications, audit trail |
| `correction-service.ts` | 135 | BFL 5:13 — never delete, reverse + correct via new verification |
| `shareholder-service.ts` | 492 | ABL — share register, voting %, acquisition tracking, quota value |
| `accrual-service.ts` | 239 | Semesterlagen — 12% vacation pay reserve + periodization |
| `closing-entry-service.ts` | 299 | Year-end — opening/closing balances, P&L transfer to equity |
| `payroll-service.ts` | 267 | Semesterlagen + AGI — vacation accrual, tax withholding |
| `vat-service.ts` | 147 | VAT period management + reporting |

## 6. Parsers — `src/lib/parsers/` (148 lines)

| File | Lines | What It Parses |
|------|-------|---------------|
| `sie-parser.ts` | 141 | SIE4 file import (reads external accounting data) |
| `index.ts` | 7 | Export |

---

## Totals

| Category | Files | Lines |
|----------|-------|-------|
| Bookkeeping engine | 11 | 2,087 |
| Generators | 7 | 2,204 |
| Processors | 23 | 3,609 |
| Tax law data | 4 | 846 |
| Core compliance services | 7 | 2,065 |
| Parsers | 2 | 148 |
| **Total** | **54** | **~10,959** |

These ~54 files are the irreplaceable backbone. Everything else — UI components, hooks, CRUD services, API routes — can be rebuilt in hours with the architecture vision clear.
