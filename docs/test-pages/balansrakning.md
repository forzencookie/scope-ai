# Balansräkning

Test page: `/test-ui/walkthroughs/balansrakning/`

## What it shows

Scooby presents a balance sheet at a given date. Shows assets, liabilities, and equity broken down by category with key-value summaries.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (tillgångar, skulder, eget kapital)
- **WalkthroughRenderer** (block-based) with:
  - Heading: Summering av Tillgångar + key-value (kassa och bank, kundfordringar, inventarier)
  - Heading: Summering av Skulder och Eget Kapital + key-value (kortfristiga skulder, långfristiga skulder, aktiekapital, balanserat resultat)
  - Action-bar: Bokför som PDF, Stäng

## Expected behavior

When user asks "Visa balansräkningen" or "Hur ser tillgångarna ut?":

1. Scooby determines the date from context
2. Tool aggregates closing balances for all konto 1000–2999
3. Groups into tillgångar (1000–1999), skulder (2000–2499), eget kapital (2050–2099)
4. Returns WalkthroughResponse

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Report date | User request or period end | Yes |
| Kassa och bank | Closing balance konto 1910 + 1930 | Yes |
| Kundfordringar | Closing balance konto 1510 | Yes |
| Inventarier | Closing balance konto 1220 (minus ack. avskr. 1229) | Yes |
| Kortfristiga skulder | Closing balance konto 2400–2499 | Yes |
| Långfristiga skulder | Closing balance konto 2300–2399 | Yes |
| Aktiekapital | Closing balance konto 2081 | Yes |
| Balanserat resultat | Closing balance konto 2091 + 2098 + årets resultat | Yes |
| Previous period for comparison | Prior period closing balances | Yes |

## What must NEVER be static in production

- **All balances** — from verifikationer closing balances
- **Date** — from user context
- **Which categories appear** — only those with non-zero balances
- **Comparison data** — from actual prior period

## What CAN be static

- Category labels (Kassa och Bank, Kundfordringar, etc.)
- Section headings
- Balance sheet structure (assets = liabilities + equity check)
