# Scenario — Konversationssimulering

Test page: `/test-ui/walkthroughs/scenario/`

## What it shows

A complete, realistic conversation simulation. Steps through every UI surface in sequence — thinking state, tool calls, streamed text, audit card, document preview, confirmation, activity card, inline card, and walkthrough.

**This page needs rebuilding.** Currently only simulates one scenario (månadsavslut). Should have modes for different scenario types so we can test the full range of Scooby interactions.

## Planned modes

| Mode | Scenario | UI surfaces exercised |
|------|----------|----------------------|
| Bokföring | User scans a receipt, Scooby books it | ReceiptCard → VerificationPreview → ActivityCard |
| Lönekörning | User says "Kör löner för mars" | Employee data check → PayslipPreview → ConfirmationCard → ActivityCard |
| Deklaration | User says "Förbered momsdeklarationen" | Financial tables → StatusCheck → ActionBar |
| Månadsavslut | User says "Stäng mars åt mig" | Full chain: audit → payslip → confirmation → activity → walkthrough |
| Faktura | User says "Skapa faktura till Acme" | Customer lookup → ConfirmationCard → InvoiceCard |
| Ägare | User says "Visa min aktiebok" | ShareRegisterPreview |

Each mode exercises different components and data flows. The scenario page becomes the integration test for all UI surfaces working together.

## Current implementation (månadsavslut only)

### UI Components used (in order)

1. **User message bubble** — "Stäng mars åt mig..."
2. **AiProcessingState** — thinking spinner
3. **AiProcessingState** (×3) — tool call indicators (get_verifications, get_bank_balance, get_payroll_runs)
4. **Streamed markdown** — ReactMarkdown with typewriter effect + cursor
5. **BalanceAuditCard** — inline audit check rows (5 checks, 1 warning)
6. **Streamed markdown** — payroll summary text
7. **PayslipPreview** — full document preview (white bg, print-ready)
8. **ConfirmationCard** — "Bokför arbetsgivaravgifter" with summary rows (flat, borderless)
9. **ActivityCard** — "Arbetsgivaravgifter mars 2026" booked result (flat, borderless)
10. **InlineCardRenderer** — verification A48 compact row
11. **Streamed markdown** — AGI transition text
12. **WalkthroughRenderer** — full AGI walkthrough with blocks
13. **Done summary** — green box with all completed items

### Step progression

Auto-advances through thinking/tool states, then pauses at each UI surface for user interaction via "Fortsätt →" buttons. Step indicator pills at top show progress.

States: idle → thinking → tools-checking → tools-done → text-1 → audit → text-2 → payslip → confirmation → confirm-loading → booked → text-3 → agi-walkthrough → done

## Required data — what the app MUST have

The scenario page is a simulation, but it represents real production flows. Each mode's data requirements match the components it uses:

### Månadsavslut mode requires:
- **Company**: name, org nr, räkenskapsår, momsregistrering
- **Employees**: all with name, personnummer, kommun, birth date, salary
- **Payroll runs**: completed for the period
- **Verifications**: all for the period (for audit checks)
- **Bank balance**: reconciliation data (for bank check)
- **Municipality tax tables**: `getKommunSkattesats()` from `src/data/kommun-skattesatser.ts` (per employee kommun)
- **Avgiftssatser**: current year, with age-based nedsättning

### Bokföring mode requires:
- **Company**: org nr, räkenskapsår, momsregistrering
- **BAS kontoplan**: loaded and validated
- **Receipt data**: from scan or user input

### Lönekörning mode requires:
- **All employee data**: name, personnummer, kommun, birth date, salary, skattetabell
- **Company**: F-skatt, momsregistrering

### What Scooby does when data is missing:
Same pattern everywhere: check → ask → store → proceed. Never show a confused confirmation or card with placeholder values.

## Data connections — what's dynamic

Every piece of data in this scenario comes from other components' data sources:

| Step | Data source |
|------|-------------|
| Tool names | AI tool routing (which tools Scooby decides to call) |
| Audit checks | Computed from bookkeeping state (see cards.md) |
| Payslip data | See documents.md (Lönebesked section) |
| Confirmation summary | Tool params with accurate computed values |
| Activity card changes | Mutation result (what was written) |
| Verification inline | `verifications` table |
| AGI walkthrough | See agi.md |
| Text content | AI-generated from context |

## What must NEVER be static in production

- **Everything** — this is a live conversation, all data comes from the AI + database
- The scenario page is purely a simulation for UI review

## What CAN be static

- Nothing in production — the scenario page itself is a test-only construct
- The step progression logic and typewriter effect are test scaffolding
