# Balanskontroll AI Audit — Implementation Plan

## Overview

Replace the purple AI card on Balansräkning page with a green "Balanskontroll" card that triggers an AI-powered audit via the existing AI chat flow.

## Flow

```
Balansräkning page → Green card "Kör kontroll" button
  → dispatches AI_CHAT_EVENT with actionTrigger
  → AI chat sidebar opens, shows ActionTriggerChip
  → AI auto-sends prompt, calls run_balance_sheet_audit tool
  → Tool gathers cross-domain data, runs checks
  → AI responds with structured card + natural language
  → User can follow up in chat
```

## What the audit checks (Swedish accountant checklist)

| Check              | Data source                        | What to verify                             |
| ------------------ | ---------------------------------- | ------------------------------------------ |
| Balansräkningsprov | get_account_balances               | Tillgångar = EK + Skulder                  |
| Momsavstämning     | tax_reports + account balances     | Reported VAT matches booked (2640/2650)    |
| Kundfordringar     | invoices + account 1510            | Open invoices match balance, flag >90 days |
| Leverantörsskulder | supplier_invoices + account 2440   | Open bills match balance                   |
| Löneavstämning     | payslips + accounts 2710/2730/2731 | Payroll liabilities match payslips         |
| Avskrivningar      | accounts 1200-1299 vs 7800-7899    | Depreciation booked for fixed assets       |
| Eget kapital       | shareholders + account 2081/2090   | Matches shareholder register               |
| Periodiseringar    | accounts 1700/2900 ranges          | Accruals/prepayments present at period end |

## Data sources the tool needs

- `get_account_balances` RPC (bokföring)
- `invoices` table (kundfordringar)
- `supplierinvoices` table (leverantörsskulder)
- `payslips` table (lönekostnader)
- `shareholders` table (eget kapital)
- `taxreports` table (moms, skattekonto)
- `corporate_documents` table (utdelning, protokoll)

## What to build

1. **AI tool** `run_balance_sheet_audit` in `src/lib/ai-tools/bokforing/`
   - Gathers all data above
   - Runs each check, returns structured results
   - Display card type: `BalanceAuditCard`

2. **Display card** `BalanceAuditCard` component
   - Shows checklist with ✅/⚠️/❌ per check
   - Summary footer: X/Y passed, warnings, failures

3. **Register card** in `src/components/ai/card-registry.ts`

4. **Update balansräkning page**
   - Green card at top with "Kör kontroll" button
   - Uses `navigateToAI()` with audit-specific context and actionTrigger
   - Remove the old footer "Balansräkningsprov" (replaced by AI audit)

5. **Add `actionTrigger` icon** `'audit'` to ActionTriggerChip

## No new Supabase tables needed initially

Can add `balance_sheet_audits` table later for history.
