# Alla kort (Layer 1)

Test page: `/test-ui/walkthroughs/cards/`

## What it shows

Every card type that Scooby can render inline in chat. Split into walkthrough openers, data display cards, audit cards, billing cards, and inline cards.

## UI Components

### Walkthrough Opener Cards
Clickable cards that open a full walkthrough overlay. The AI dynamically names the card based on what it's about to show — e.g., "Momsdeklaration mars 2026" or "Resultaträkning Q1 2026".

| Card | Opens | When shown |
|------|-------|-----------|
| Resultaträkning | `/walkthroughs/resultatrakning` | After generating P&L report |
| Balansräkning | `/walkthroughs/balansrakning` | After generating balance sheet |
| Momsdeklaration | `/walkthroughs/momsdeklaration` | After preparing VAT declaration |
| K10-beräkning | `/walkthroughs/k10` | After K10 threshold calculation (AB) |
| Egenavgifter | `/walkthroughs/egenavgifter` | After computing self-employment fees (EF) |
| AGI | `/walkthroughs/agi` | After preparing employer declaration |
| Inkomstdeklaration | `/walkthroughs/inkomstdeklaration` | After preparing income tax declaration |
| Årsredovisning | `/walkthroughs/arsredovisning` | After generating annual report (AB) |

**How it works in production:**
1. User asks "Gör min momsdeklaration för mars"
2. Scooby gathers data via tools, composes the walkthrough
3. A clickable card appears inline: icon + AI-generated title + key stats subtitle
4. User clicks → walkthrough overlay opens with full detailed view
5. Title is reactive — AI names it based on content (period, key figures, etc.)

### Data Display Cards (CardRenderer)
Rendered in chat for data queries and status checks.

| Card | Component | When shown |
|------|-----------|-----------|
| Aktivitetsflöde | `ActivityFeedCard` | Timeline of past events — "vad hände igår?" |
| Statusöversikt | `ActivityFeedCard` (status mode) | Status checklist — månadsavslut, saknad data |
| Sammanfattning | `SummaryCard` | Calculation results (lön, K10, etc.) |
| Generisk lista | `SmartListCard` | Search results, entity lists |

### Audit Cards
Inline pass/warning/fail checks that Scooby shows after running a health check.

| Card | Component | When shown |
|------|-----------|-----------|
| Balanskontroll | `BalanceAuditCard` | Balance sheet audit — debet=kredit, bank reconciliation, etc. |
| Resultatkontroll | `ResultatAuditCard` | Income statement audit — margins, cost ratios, etc. |

### Billing Cards

| Card | Component | When shown |
|------|-----------|-----------|
| AI-användning | `AIUsageCard` | Token budget consumption |
| Köp Credits | `BuyCreditsPrompt` | Prompt to buy more AI tokens |

### Inline Cards (InlineCardRenderer)
Compact clickable rows that navigate to relevant pages.

| Card | Type key | What it shows |
|------|----------|--------------|
| Faktura | `invoice` | Invoice number, customer, amount, status |
| Transaktion | `transaction` | Description, amount, date, bokförd/obokförd |
| Verifikation | `verification` | Ver. number, date, description, amount |
| Lönebesked | `payroll` | Employee name, period, net amount, status |
| Rapport | `report` | Report type, period, title |
| Kvitto | `receipt` | Supplier, amount, date |
| Moms | `vat` | Period, amount (att betala/få tillbaka), status |
| Utdelning | `dividend` | Shareholder name, amount, year |

## Retired cards

These display cards have been **removed** — replaced by ConfirmationCard with `isDone` state:

- **ReceiptCard** — after-action receipt display → ConfirmationCard stays visible with "Klart"
- **TransactionCard** — after-booking display → same
- **InvoiceCard** — after-creation display → same
- **ActivityCard** (åtgärdskvitto) — after-mutation receipt → same

The confirmed ConfirmationCard IS the receipt — it keeps all the summary data visible and just swaps the buttons for a green check. No need for a separate "done" card.

## Production logic

### Walkthrough opener cards
The AI generates walkthrough content (blocks), then renders a compact opener card in chat. The card has:
- **Icon** — matches the report type
- **Title** — AI-generated, specific to the content ("Momsdeklaration mars 2026")
- **Subtitle** — key figures summary ("Utgående 24 500 kr · Ingående 12 050 kr · Att betala 12 450 kr")

Clicking the card opens the walkthrough overlay, which renders the full block composition (stat cards, tables, charts, info cards, etc.).

### ActivityFeedCard — universal list card
One component serves two purposes:

**Activity timeline** (events with action badges + timestamps):
- Used for "vad hände igår?", "visa aktivitet denna vecka"
- Badge colors: booked=emerald, created=blue, updated=amber, deleted=red

**Status checklist** (items with status badges, no timestamps):
- Used for workflow checklists (månadsavslut, missing data blocks)
- Badge labels: done="OK", warning="Varning", error="Saknas", pending="Väntar"

**Connection to sidebar tasks:** The sidebar Aktiviteter section proactively surfaces outstanding work items. These are the same items that ActivityFeedCard displays in status mode when the user asks Scooby about them.

## Required data — what the app MUST have

Each card type has data dependencies. If data is missing, Scooby asks before creating the card.

### Walkthrough openers:
- Report data → computed from bookkeeping state via tools
- Title + subtitle → AI-generated from the computed data
- Walkthrough blocks → composed by AI from report data

### Data display cards:
- Activity events → from activity log table
- Status items → computed from bookkeeping state
- Summary items → from calculation tools (deterministic)
- List items → from database queries

### Audit cards:
- Check results → computed from live bookkeeping state
- Discrepancies → from account balance comparisons

## What must NEVER be static in production

- **All entity data** — from database tables
- **Card type selection** — from AI tool output
- **Walkthrough titles** — AI-generated per content
- **Navigation targets** — computed from entity IDs
- **Tax rates and avgiftssatser** — from data sources, never hardcoded
- **Verification numbers** — from bookkeeping engine (sequential, gap-free)
- **Status items** — computed from actual bookkeeping state

## What CAN be static

- Card layouts and styling
- Icon mappings per report/card type
- Badge colors (done/booked=emerald, created=blue, warning/updated=amber, error/deleted=red, pending=muted)
- Walkthrough block primitives (stat-card, table, chart, info-card layout)
