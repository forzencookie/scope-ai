# Flow: Utdelning (Dividends)

> Read-only page displaying dividend history, tax overview, and a quick simulator. Formal dividend planning happens through Scooby.

## Purpose

The utdelning page gives shareholders a clear picture of past dividends, current gränsbelopp status, and a simulator to explore tax implications before asking Scooby to formally plan a dividend (bolagsstämma, K10, bookkeeping).

## Page Structure

### 1. Stat Cards (top row)

Three gradient stat cards:

| Card | Icon | Color | Value |
|------|------|-------|-------|
| Utdelat totalt | BadgeDollarSign | Rose | Sum of all dividends paid out |
| Kvar av gränsbelopp | BarChart3 | Emerald | Remaining tax-advantaged space this year |
| Gränsbelopp [year] | PieChart | Violet | Full calculated gränsbelopp for the current year |

Style: Same gradient card pattern as aktiebok — icon in colored rounded container, gradient background.

### 2. Tax Simulator

A standalone card with dashed border (`border-2 border-dashed border-border`) that lets the user explore dividend amounts and see the tax split in real time.

**Components:**
- **Slider** — 0 to 500 000 kr, step 5 000
- **Amount display** — Large bold number above the slider
- **Gränsbelopp progress bar** — Shows how much of the tax-advantaged space the chosen amount consumes. Green when within, red when exceeding.
- **Tax breakdown** — Key-value rows with dashed separators:
  - Inom gränsbelopp (20%) — amount taxed at the low rate
  - Över gränsbelopp (52%) — amount taxed at the high rate (only shown when applicable)
  - Total skatt — red, with effective rate in parentheses
  - Du får ut — green, the net payout
- **CTA button** — "Planera utdelning med Scooby" — sends the user to chat with the selected amount as context

**Important:** The simulator is a read-only calculator. It does NOT create a dividend. The actual dividend process (bolagsstämma beslut, K10 filing, bookkeeping entries) is handled entirely by Scooby through chat.

### 3. Dividend History Table

Flex-based table showing all historical dividends.

**Columns:**
- **År** (flex-1) — Year + exact date in muted text
- **Brutto** (w-28, right-aligned) — Gross dividend amount
- **Skatt** (w-28, right-aligned, hidden mobile) — Tax paid, red with – prefix
- **Netto** (w-28, right-aligned) — Net payout, green with + prefix
- **Status** (w-24, right-aligned) — Badge showing lifecycle state
- **Avi** (w-20) — Button to open the utdelningsavi detail

**Footer row:** Totals for brutto, skatt, and netto.

**Status badges:**

| Status | Color | Meaning |
|--------|-------|---------|
| Planerad | Blue | Dividend planned but not yet decided at stämma |
| Beslutad | Amber | Decided at bolagsstämma, awaiting execution |
| Bokförd | Emerald | Fully executed and booked |

### 4. Utdelningsavi (Dividend Receipt)

Modal overlay triggered by clicking "Avi" on a history row. Shows key-value detail:

- Stämmobeslut — date of the shareholder meeting
- Bruttoutdelning — gross amount
- Skatt (rate%) — tax amount with – prefix, red
- Nettoutdelning — net amount, bold
- Per aktie — amount per share

**Actions:**
- Stäng — close
- Ladda ner PDF — download receipt as PDF

In production, this should be a **page overlay** (not a modal), consistent with the app's overlay pattern.

## Data Source

### Database Tables

```
dividends
  - id, company_id
  - year (fiscal year)
  - decision_date (bolagsstämma date)
  - payment_date
  - gross_amount
  - per_share
  - status (planerad | beslutad | bokford)
  - created_at, updated_at

dividend_tax_details
  - id, dividend_id
  - shareholder_id
  - within_gransbelopp (amount taxed at 20%)
  - above_gransbelopp (amount taxed at 52%)
  - tax_amount
  - net_amount
  - k10_reference (link to K10 filing if applicable)

gransbelopp
  - id, company_id, year
  - total_gransbelopp (calculated amount)
  - used (amount consumed by dividends this year)
  - calculation_method (forenklingsregeln | huvudregeln)
  - ibb_value (inkomstbasbelopp used)
```

### Derived Values

- **Gränsbelopp:** Calculated using K10 rules — either förenklingsregeln (2.75 × IBB) or huvudregeln (salary-based). Scooby's `calculate_k10` tool handles this.
- **Kvar av gränsbelopp:** `gransbelopp.total - gransbelopp.used`
- **Utdelat totalt:** `SUM(dividends.gross_amount)` for the company
- **Effective tax rate:** `total_tax / gross_amount`

## Mutations (via Scooby)

The page is read-only. All dividend actions go through chat:

- **Planera utdelning** — Scooby calculates optimal amount using K10 rules, checks ABL solvency requirements, and drafts a plan
- **Besluta utdelning** — Scooby generates bolagsstämmoprotokoll (meeting minutes) and records the decision
- **Bokför utdelning** — Scooby creates the bookkeeping entries (debit 2091 Balanserad vinst, credit 2898 Utdelning)
- **Generera K10** — Scooby fills out the K10 form based on shareholder data and gränsbelopp calculation

## Tax Rules (3:12 / Fåmansbolag)

The simulator implements the core 3:12 tax split:

- **Within gränsbelopp (20%):** Dividends up to the calculated gränsbelopp are taxed as capital income at 20%
- **Above gränsbelopp (52%):** Dividends exceeding gränsbelopp are taxed as employment income (up to ~52% marginal rate)
- **Gränsbelopp calculation:**
  - Förenklingsregeln: 2.75 × IBB (inkomstbasbelopp). Simple, no salary requirement.
  - Huvudregeln: Based on salary paid by the company. Higher ceiling if salaries are large enough.
  - Scooby recommends whichever rule gives the higher gränsbelopp.

**Legal guardrails:**
- ABL 17:3 — solvency test (försiktighetsregeln). Cannot distribute more than free equity allows.
- ABL 18:4 — dividend must be decided at bolagsstämma
- Shares must be fully paid before dividend is allowed

## Row Click Behavior

Clicking a history row opens a **page overlay** with full dividend detail:
- All fields from the table
- Per-shareholder breakdown (who got how much)
- Tax detail per shareholder
- Link to bolagsstämmoprotokoll
- Link to K10 filing
- "Fråga Scooby" button with dividend context prefilled

## What Connects Here

- **Aktiebok** — ownership percentages determine dividend distribution per shareholder
- **K10 tool** — calculates gränsbelopp, referenced in tax breakdown
- **Bokföring/Verifikationer** — dividend bookkeeping entries appear in the ledger
- **Bolagsstämmoprotokoll** — meeting minutes where dividend is formally decided
- **Rapporter** — dividends affect balansräkning (equity reduction)
