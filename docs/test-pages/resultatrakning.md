# Resultaträkning

Test page: `/test-ui/walkthroughs/resultatrakning/`

## What it shows

Scooby presents an income statement for a period. Shows revenue, costs, and result broken down by BAS account with amounts.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (intäkter, kostnader, rörelseresultat)
- **WalkthroughRenderer** (block-based) with:
  - Financial-table: konto, benämning, belopp for each account row + totals
  - Action-bar: Bokför som PDF i Arkiv, Stäng

## Expected behavior

When user asks "Visa resultaträkningen" or "Hur gick Q1?":

1. Scooby determines the period from context or user request
2. Tool aggregates all verifikationer on konto 3000–8999 for the period
3. Groups by account, computes subtotals per category
4. Returns WalkthroughResponse

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Period | User request or current accounting period | Yes |
| Revenue accounts (3001, 3002, etc.) | `verifications` + `verification_rows` on konto 3000–3999 | Yes |
| Cost accounts (5010, 5420, 7010, etc.) | `verifications` + `verification_rows` on konto 4000–8999 | Yes |
| Account names (Benämning) | BAS kontoplan (`src/data/accounts.ts`) | Yes |
| Amounts per account | Sum of `verification_rows.amount` per konto | Yes |
| Previous period for comparison | Prior period aggregation | Yes |
| Percentage changes | Computed from current vs prior | Yes |

## What must NEVER be static in production

- **All amounts** — from actual verifikationer
- **Period** — from user context
- **Which accounts appear** — only accounts with activity should show
- **Previous period data** — from actual prior period

## What CAN be static

- Account numbers and names (from BAS kontoplan data source)
- Column headers (Konto, Benämning, Belopp)
- Section labels
