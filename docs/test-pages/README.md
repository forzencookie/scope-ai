# Test Pages — UI & Logic Specifications

Each file documents one test page at `/test-ui/walkthroughs/`. Describes the UI (visual contract), required data (what the app must have), data dependencies (where each value comes from), and logic (how calculations work, what happens when data is missing).

**Test pages = visual contract.** These MD files = logic contract. Production code must match both.

## Walkthrough pages (block-based)

| Page | Doc | What it covers |
|------|-----|---------------|
| AGI | [agi.md](agi.md) | Arbetsgivardeklaration — individuppgifter from lönekörningar |
| K10 | [k10.md](k10.md) | Kvalificerade andelar — gränsbelopp from aktiebok + löner |
| INK2 | [inkomstdeklaration.md](inkomstdeklaration.md) | Inkomstdeklaration 2 — justeringar from verifikationer |
| Egenavgifter | [egenavgifter.md](egenavgifter.md) | Self-employment fees — 7 components from årsvinst |
| Momsdeklaration | [momsdeklaration.md](momsdeklaration.md) | VAT declaration — fakturor + inköp from bokföring |
| Årsredovisning | [arsredovisning.md](arsredovisning.md) | K2 annual report — full provenance chain |
| Resultaträkning | [resultatrakning.md](resultatrakning.md) | Income statement — konto 3000–8999 |
| Balansräkning | [balansrakning.md](balansrakning.md) | Balance sheet — konto 1000–2999 |

## Other test pages

| Page | Doc | What it covers |
|------|-----|---------------|
| Dokument | [documents.md](documents.md) | Lönebesked, styrelseprotokoll, aktiebok (print-ready documents) |
| Bekräftelse | [confirmation.md](confirmation.md) | ConfirmationCard (flat/borderless), ComparisonTable, ActionTriggerChip |
| Alla kort | [cards.md](cards.md) | Every Layer 1 card type (display + inline + audit cards) |
| Scenario | [scenario.md](scenario.md) | Conversation simulation — all UI surfaces in sequence |

## Key principles

### Nothing static in production
Almost nothing on these pages should be static in production. Every number, name, date, and status comes from the database or is computed from bookkeeping data. The test pages use hardcoded mock data to preview the UI, but production AI tools must fetch and compute everything dynamically.

Even tax rates and avgiftssatser — which change yearly — must come from data sources, not inline constants.

### No confused warnings
Warnings on confirmations should only appear when the situation is genuinely ambiguous. If a warning exists because data is missing (employee kommun, birth date, etc.), the fix is: Scooby asks for the data first, stores it, then shows the confirmation with accurate values. Warnings for fixable data gaps = bad UX.

### Data completeness before action
Before showing any confirmation or generating any document, the tool checks that all required data exists. Missing data → Scooby asks conversationally → user provides → app stores → proceed with accurate values. This is documented per page in the "Required data" section of each MD file.
