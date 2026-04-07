# AGI — Arbetsgivardeklaration

Test page: `/test-ui/walkthroughs/agi/`

## What it shows

Scooby presents a complete arbetsgivardeklaration (employer tax declaration) for a given month. The walkthrough breaks down each employee's individual salary components and traces them back to the payroll run that produced them.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (totalt att betala, arbetsgivaravgifter, avdragen skatt)
- **WalkthroughRenderer** (block-based) with:
  - Per-employee sections: heading (name + personnummer + kommun + skattetabell), annotation (source payroll run), financial-table (lönearter: Månadslön, OB-tillägg, Sjukavdrag, etc.), key-value (bruttolön, förmåner, preliminärskatt)
  - Summary financial-table: all employees with bruttolön + förmåner + avdragen skatt + totals row
  - Avgiftsberäkning: key-value (fält 011, 012, 499, 487, 001) + collapsed-group (7 avgiftskomponenter)
  - Status-check: individuppgifter komplett, avgiftsunderlag stämmer, skatteavdrag rimligt, klart för inlämning
  - Info-card: deadline + förseningsavgift
  - Action-bar: Skicka till Skatteverket, Exportera XML, Stäng

## Expected behavior

When user asks Scooby "Gör arbetsgivardeklarationen" or "Visa AGI för mars":

1. Scooby runs a tool that fetches payroll data for the period
2. The tool returns a `WalkthroughResponse` built from real payroll runs
3. ScoobyPresentation header summarizes the 3 key figures
4. WalkthroughRenderer displays the full declaration with provenance

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Period (e.g. "2026-03") | User request / current month | Yes |
| Employee names, personnummer | `employees` table | Yes |
| Lönearter per employee | `payroll_line_items` joined through `payroll_runs` | Yes |
| Kommun, skattetabell | `employees.municipality` → `getKommunSkattesats()` from `src/data/kommun-skattesatser.ts` | Yes |
| Bruttolön, förmåner | Computed from lönearter | Yes |
| Preliminärskatt | Computed from `getKommunSkattesats()` — `src/data/kommun-skattesatser-2026.json` (290 kommuner, from Skatteverket) | Yes |
| Arbetsgivaravgifter | Computed: `(bruttolön + förmåner) × 31.42%` | Yes |
| Avgiftssatser (7 delkomponenter) | Socialavgiftslagen — can change yearly | Yes |
| Payroll run ID + date | `payroll_runs` table | Yes |
| Validation checks | Computed from completeness of above data | Yes |

## What must NEVER be static in production

- **Employee data** — names, personnummer, kommun, skattetabell come from DB
- **Lönearter** — from actual payroll runs, not hardcoded
- **Avgiftssatser** — must come from a rates data source, not inline constants (rates change yearly)
- **Skattetabell** — municipality-based, resolved per employee via tax table service
- **Period** — derived from user request or current accounting period

## What CAN be static

- Field labels ("Ruta 05", "fält 011", etc.) — these are Skatteverket form field codes
- Section headings ("Individuppgifter", "Avgiftsberäkning")
- Legal references ("SFS 2000:980 — Socialavgiftslag")
- Info card content (deadline rules, förseningsavgift)
