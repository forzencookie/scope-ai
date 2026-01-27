# AI Tools Audit & Implementation Plan

> **Date:** 27 januari 2026  
> **Purpose:** Audit existing AI tools and plan for wiring them to real database queries

---

## Overview

When a user mentions a page (e.g., `@Transaktioner`) in the AI chat, the AI should:
1. Receive a **simple context** about what the page shows
2. Have **tools that query the real database** - the same data the page displays
3. Be able to help the user with that data

Currently, many tools return **mock data** instead of querying the database.

---

## Audit Results

### Legend
- ✅ **REAL DB** = Tool calls service that queries Supabase
- 🟡 **PARTIAL** = Tool exists but returns mock data or is incomplete
- ❌ **MISSING** = No tool exists for this page

---

## 1. BOKFÖRING Pages

| Page | DB Tables | Service | AI Tool | Status |
|------|-----------|---------|---------|--------|
| **Transaktioner** | `transactions` | `transaction-service.ts` | `get_transactions` | ✅ REAL (via API) |
| **Fakturor** | `customerinvoices`, `supplierinvoices` | `invoice-service.ts` | `create_invoice` only | 🟡 PARTIAL - missing `get_invoices` |
| **Kvitton** | `receipts` | `receipt-service.ts` | `get_receipts` | ✅ REAL |
| **Inventarier** | `inventarier` | `inventarie-service.ts` | `get_assets` | ✅ REAL |
| **Verifikationer** | `verifications` | ❌ None | `periodize_expense` only | 🟡 PARTIAL - missing `get_verifications` |
| **Kontoplan** | `accountbalances` | ❌ None | ❌ None | ❌ MISSING |
| **Moms** | `vatdeclarations` | `vat-service.ts` | `get_vat_report` | 🟡 RETURNS MOCK |

---

## 2. RAPPORTER Pages

| Page | DB Tables | Service | AI Tool | Status |
|------|-----------|---------|---------|--------|
| **INK2** | `incomedeclarations`, `taxreports` | `tax-declaration-service.ts` | Exists | 🟡 NEEDS AUDIT |
| **Årsredovisning** | `annualreports`, `annualclosings` | ❌ None | `generate_annual_report` | 🟡 PARTIAL |
| **Företagsstatistik** | Multiple (aggregations) | ❌ None | ❌ None | ❌ MISSING |

---

## 3. LÖNER Pages

| Page | DB Tables | Service | AI Tool | Status |
|------|-----------|---------|---------|--------|
| **Löner/Lönebesked** | `payslips`, `employees` | `payroll-service.ts` | `get_payslips`, `get_employees` | ✅ REAL |
| **Eget uttag** | `shareholders`, transactions | 🟡 Partial | `register_owner_withdrawal` | 🟡 PARTIAL |
| **3:12** | K10 calculations | `skatt/k10.ts` | `calculate_qualified_dividend_allowance` | 🟡 Calculated, not DB |

---

## 4. ÄGARE & STYRNING Pages

| Page | DB Tables | Service | AI Tool | Status |
|------|-----------|---------|---------|--------|
| **Ägande/Aktiebok** | `shareholders`, `share_transactions` | ❌ API calls | `get_shareholders` | 🟡 Via API, not service |
| **Styrelse** | `boardminutes`, `companies` | ❌ None | `get_board_members` | 🟡 RETURNS MOCK |

---

## 5. ÖVRIGT Pages

| Page | DB Tables | Service | AI Tool | Status |
|------|-----------|---------|---------|--------|
| **Händelser** | `events`, `activity_log` | `event-service.ts` | `get_events` | 🟡 RETURNS MOCK |
| **Inställningar** | `profiles`, `settings`, `integrations` | ❌ None | All 6 tools | 🟡 ALL RETURN MOCK |

---

## Implementation Plan

### Priority 1: Fix tools that return mock data (service exists) ✅ COMPLETE

| Task | File | Action | Status |
|------|------|--------|--------|
| 1.1 | `common/events.ts` | Use `event-service.ts` `getEvents()` | ✅ Done |
| 1.2 | `skatt/vat.ts` | Use `vat-service.ts` | ✅ Done |
| 1.3 | `bokforing/invoices.ts` | Use `invoice-service.ts` | ✅ Done |
| 1.4 | `common/settings.ts` | Created `settings-service.ts`, queries profiles/settings/integrations/bankconnections | ✅ Done |

### Priority 2: Add missing tools (need new services) ✅ COMPLETE

| Task | Files Created | Status |
|------|---------------|--------|
| 2.1 | `verification-service.ts` + `bokforing/verifications.ts` | ✅ Done |
| 2.2 | `account-service.ts` + `bokforing/accounts.ts` | ✅ Done |
| 2.3 | `company-statistics-service.ts` + `common/statistics.ts` | ✅ Done |
| 2.4 | `shareholder-service.ts` + updated `parter/shareholders.ts` | ✅ Done |
| 2.5 | `board-service.ts` + `parter/board.ts` | ✅ Done |

### Priority 3: Simplify page context prompts ✅ COMPLETE

After tools query real data, simplified `src/data/page-contexts.ts`:

```typescript
// BEFORE (100+ lines per page)
transaktioner: `
## TRANSAKTIONER - Fullständig sidkontext
### Vad användaren ser på denna sida:
... [100 lines of documentation]
`

// AFTER (simple, tool-focused)
transaktioner: `Användaren tittar på Transaktioner-sidan som visar banktransaktioner.
Använd 'get_transactions' för att hämta deras transaktioner med filter (datum, status, belopp).
Använd 'categorize_transaction' för att bokföra en enskild transaktion.
Använd 'bulk_categorize_transactions' för att kategorisera flera liknande transaktioner.
Använd 'match_payment_to_invoice' för att matcha inbetalningar mot fakturor.`
```

All 30+ page contexts have been simplified from verbose documentation to concise, tool-focused prompts.

---

## Database Tables Reference

From `src/types/database.ts`:

```
accountbalances      activity_log         agent_metrics        agireports
ai_audit_log         ailogs               aiusage              annualclosings
annualreports        assets               bankconnections      benefits
boardminutes         categories           companies            company_members
companymeetings      conversations        corporate_documents  customerinvoices
dividends            documents            employeebenefits     employees
events               financialperiods     inboxitems           incomedeclarations
integrations         inventarier          invoices             members
monthclosings        neappendices         notifications        partners
payslips             periodiseringsfonder profiles             ratelimits
ratelimitssliding    receipts             roadmap_steps        roadmaps
securityauditlog     settings             share_transactions   shareholders
sharetransactions    supplierinvoices     tax_reports          taxcalendar
taxreports           transactions         usercredits          vatdeclarations
verifications
```

---

## Existing Services

Located in `src/services/`:

| Service | Queries Table(s) | Used by AI Tool? |
|---------|------------------|------------------|
| `transaction-service.ts` | `transactions` | ✅ Yes |
| `invoice-service.ts` | `customerinvoices`, `supplierinvoices` | 🟡 Partial |
| `receipt-service.ts` | `receipts` | ✅ Yes |
| `inventarie-service.ts` | `inventarier` | ✅ Yes |
| `payroll-service.ts` | `payslips`, `employees` | ✅ Yes |
| `event-service.ts` | `events` | ❌ No (tool uses mock) |
| `vat-service.ts` | `vatdeclarations` | ❌ No (tool uses mock) |
| `tax-service.ts` | `taxreports` | 🟡 Unclear |
| `tax-declaration-service.ts` | `incomedeclarations` | 🟡 Unclear |
| `roadmap-service.ts` | `roadmaps`, `roadmap_steps` | ✅ Yes |
| `asset-service.ts` | `assets` | 🟡 Unclear |
| `benefit-service.ts` | `benefits`, `employeebenefits` | ✅ Yes |

---

## Existing AI Tools

Located in `src/lib/ai-tools/`:

### bokforing/
- `transactions.ts` - get_transactions, categorize_transaction, create_transaction, bulk_categorize
- `invoices.ts` - create_invoice, send_invoice_reminder, void_invoice, book_invoice_payment
- `receipts.ts` - get_receipts, create_receipt, match_receipt_to_transaction
- `inventarier.ts` - get_assets, create_asset, calculate_depreciation, book_depreciation, dispose_asset
- `verifications.ts` - periodize_expense, reverse_verification
- `create-verification.ts` - create_manual_verification
- `reports.ts` - generate_annual_report, get_financial_summary

### common/
- `company.ts` - get_company_info
- `events.ts` - get_events, create_event, get_upcoming_deadlines, get_activity_summary, export_to_calendar
- `navigation.ts` - navigate_to_page
- `settings.ts` - get_subscription_status, get/update_notification_preferences, list_active_integrations, connect_bank_account, sync_bank_transactions
- `usage.ts` - get_ai_usage

### loner/
- `payroll.ts` - get_payslips, get_employees, run_payroll, submit_agi
- `owner-payroll.ts` - register_owner_withdrawal, calculate_owner_fees
- `register-employee.ts` - register_employee
- `benefits.ts` - get_benefits, create_benefit, calculate_benefit_value

### parter/
- `shareholders.ts` - get_shareholders, add_shareholder, transfer_shares
- `compliance.ts` - get_compliance_docs, register_dividend, get_compliance_deadlines, prepare_annual_meeting
- `partners.ts` - get_partners

### planning/
- `roadmap.ts` - get_roadmaps, create_roadmap, update_roadmap_step
- `roadmap-generator.ts` - generate_roadmap_suggestions

### skatt/
- `vat.ts` - get_vat_report, submit_vat_declaration
- `k10.ts` - calculate_qualified_dividend_allowance, optimize_salary_dividend_split
- `investments.ts` - get_investment_entities
- `periodiseringsfonder.ts` - get_periodiseringsfonder, create_periodiseringsfond

---

## Next Steps

1. **Start with P1.1** - Wire `get_events` to `event-service.ts`
2. **Then P1.3** - Add `get_invoices` tool
3. **Then P1.2** - Fix VAT service types and wire tool
4. **Then P1.4** - Create settings service or direct queries
5. **Move to P2** - Create missing services and tools
6. **Finally P3** - Simplify all page context prompts
