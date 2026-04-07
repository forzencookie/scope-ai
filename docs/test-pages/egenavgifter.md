# Egenavgifter

Test page: `/test-ui/walkthroughs/egenavgifter/`

## What it shows

Scooby calculates egenavgifter (self-employment contributions) for an enskild firma owner based on annual profit. Shows the 25% schablonavdrag, the 7 component fees, monthly F-skatt amounts, and a month-by-month overview.

**Note:** This walkthrough was approved by the founder 2026-03-31. When shipping:
1. Build AI tool returning this WalkthroughResponse
2. Remove egenavgifter page tab from `app-navigation.ts`
3. Delete `src/components/loner/egenavgifter/` (old page components)
4. Keep `src/lib/egenavgifter.ts` (shared calculation service)

## UI Components

- **ScoobyPresentation** — header with message + 3 dynamic highlights (totala egenavgifter, kvar efter avgifter, månadsbelopp)
- **Test slider** — adjusts årsvinst (0–2M kr) to see how walkthrough updates
- **WalkthroughRenderer** (block-based) with:
  - Beräkningsunderlag: key-value (årsvinst, schablonavdrag 25%, underlag, avgiftssats, totalt)
  - Avgiftsspecifikation: collapsed-group with financial-table (7 components: sjukförsäkring, föräldraförsäkring, ålderspension, efterlevandepension, arbetsmarknad, arbetsskada, allmän löneavgift)
  - Månadsvis översikt: financial-table (12 months × vinst, egenavgifter, netto + totals)
  - Info-card: F-skatt betalning, preliminärdeklaration
  - Action-bar: Bokför egenavgifter, Stäng

## Expected behavior

When user asks "Vad blir mina egenavgifter?" or "Beräkna F-skatt":

1. Scooby reads the estimated annual profit (from bokföring or user input)
2. Tool applies 25% schablonavdrag, then applies all 7 fee rates
3. Computes monthly F-skatt installments
4. Returns WalkthroughResponse with full breakdown

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Årsvinst (annual profit) | `verifications` aggregated, or user estimate | Yes (slider) |
| Schablonavdrag rate (25%) | IL 16 kap 29§ — can change | Yes |
| 7 avgiftssatser | Socialavgiftslagen — change yearly | Yes |
| Monthly profit distribution | `verifications` per month (real) vs even split (test) | Yes (even split) |
| Company type (enskild firma) | `companies.company_type` | Yes |

## What must NEVER be static in production

- **Årsvinst** — from actual bookkeeping or user projection
- **Avgiftssatser** — all 7 rates must come from a rates data source (change yearly with government decisions)
- **Monthly profit** — from actual monthly bookkeeping, not evenly divided
- **Company type check** — egenavgifter only applies to enskild firma, not AB

## What CAN be static

- Component labels (Sjukförsäkringsavgift, etc.)
- Legal references ("IL 16 kap 29§")
- Calculation method (25% schablonavdrag rule)
- Info card text (F-skatt rules, SKV 4314)
- Month names
