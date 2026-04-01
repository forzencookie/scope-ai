# Flow: Delägare & Delägaruttag (Partners & Partner Withdrawals)

> Two related read-only pages for HB/KB companies. Delägare shows ownership structure with pie chart. Delägaruttag tracks withdrawals, deposits, and salary per partner. All mutations through Scooby.

## Who Sees These Pages

Only HB (handelsbolag) and KB (kommanditbolag) company types. Aktiebolag use Aktiebok instead.

---

## Page 1: Delägare (Partner Registry)

### Purpose

Displays who owns what share of the partnership, their kapitalkonto balance, and partner details.

### Page Structure

#### 1. Pie Chart Card

Full-width card (`bg-muted/30 rounded-2xl`) with:
- **Pie chart** (h-28 w-28) — CSS `conic-gradient`, monochrome indigo palette (`#4f46e5` darkest to `#e0e7ff` lightest). Largest owner gets the darkest shade.
- **Legend** beside the chart — each partner with colored dot, name, ownership %, kapitalkonto amount

Color palette (indigo family, 6 shades): `#4f46e5`, `#6366f1`, `#818cf8`, `#a5b4fc`, `#c7d2fe`, `#e0e7ff`

#### 2. Search

Single search input filtering by name or personnummer.

#### 3. Expandable Partner Cards

Each partner renders as a collapsible card following the standard expandable card pattern:
- **Collapsed:** Avatar (initials), name, type badge (no border), kapitalkonto, ownership % (colored to match pie slice), chevron
- **Expanded:** Inset separator, key-value grid (Typ, Vinstfördelning, Registrerad, E-post, Adress), "Fråga Scooby om {name}" button

**Expandable card rules (consistent across app):**
- Border only when expanded (`border-border/50 shadow-sm`), transparent when collapsed
- Hover bg only when collapsed
- Same background color expanded and collapsed (no grey differentiation)
- Separator inset — starts after the avatar, ends before the chevron

**Partner type badges (no borders):**

| Type | Color | Description |
|------|-------|-------------|
| Komplementär | Blue | Full liability partner |
| Kommanditdelägare | Amber | Limited liability partner |

#### 4. No footer disclaimers

Legal info belongs in Scooby's explanations, not on the data page.

---

## Page 2: Delägaruttag (Partner Withdrawals)

### Purpose

Tracks all capital movements — withdrawals (uttag), deposits (insättningar), and salary (lön) per partner. Shows a bar chart of monthly activity.

### Page Structure

#### 1. Stat Cards (3, top row)

| Card | Icon | Color | Value |
|------|------|-------|-------|
| Totala uttag | TrendingDown | Orange | Sum of all withdrawals + salary |
| Totala insättningar | TrendingUp | Emerald | Sum of all deposits |
| Netto kapital | Minus | Violet | Net (insättningar + uttag) |

Each card has a distinct color — no duplicates.

#### 2. Stacked Bar Chart

Uses recharts via shadcn `ChartContainer` component. Same indigo color palette as the delägare pie chart.

- **Stacked bars:** uttag (lighter `#818cf8`) + insättning (darker `#4f46e5`) per month
- **Built-in:** CartesianGrid, XAxis (month labels), ChartTooltip, ChartLegend
- **Reactive:** Chart updates when partner dropdown or type filter changes
- **Container:** `bg-muted/30 rounded-2xl` card

#### 3. Filters

- **Search** — text input, neutral focus style
- **Partner dropdown** — `<select>` with "Alla delägare" default + all partners. Scales to any number of partners (not individual buttons).
- **Type pills** — Alla, Uttag (orange), Insättning (emerald), Lön (blue)

All filters affect both the chart and the transaction list simultaneously.

#### 4. Transaction List

Row-based list (not a formal table with header — transactions are varied enough that a table header doesn't add value).

Each row:
- **Avatar** (initials, indigo/violet colors)
- **Description** + partner name + type badge with icon
- **Amount** (red with – for outgoing, emerald with + for incoming) + date

**Type badges:**

| Type | Icon | Color |
|------|------|-------|
| Uttag | ArrowDownRight | Orange |
| Insättning | ArrowUpRight | Emerald |
| Lön | Wallet | Blue |

**Amount colors:**
- Outgoing (uttag, lön): `text-red-500 dark:text-red-400/80` — matches walkthrough red style
- Incoming (insättning): `text-emerald-600 dark:text-emerald-400`

## Data Source

### Database Tables

```
partners
  - id, company_id
  - name, personal_number (or org_number)
  - partner_type (komplementar | kommanditdelagare)
  - ownership_share (percentage)
  - profit_share (percentage)
  - kapitalkonto (current balance)
  - registered_at
  - address, email
  - created_at, updated_at

partner_transactions
  - id, partner_id, company_id
  - transaction_type (uttag | insattning | lon)
  - amount (negative for uttag/lön, positive for insättning)
  - date
  - description
  - kapitalkonto_after (balance after this transaction)
  - verification_id (link to bookkeeping entry)
  - created_at
```

### Derived Values

- **Kapitalkonto:** Running balance from partner_transactions or stored on partner record
- **Totala uttag:** `SUM(amount) WHERE type IN (uttag, lon)`
- **Totala insättningar:** `SUM(amount) WHERE type = insattning`
- **Monthly chart data:** Aggregated by month, filtered by partner and type

### Bookkeeping Integration

- Uttag: debit 2072 (privat uttag), credit 1930 (bank)
- Insättning: debit 1930 (bank), credit 2073 (kapitaltillskott)
- Lön: debit 2075 (lön till delägare), credit 1930 (bank)

## Mutations (via Scooby)

Both pages are read-only. All actions go through chat:

- **Registrera delägare** — add a new partner with ownership share
- **Ändra ägarandel** — update ownership/profit shares (requires new bolagsavtal)
- **Registrera uttag** — record a withdrawal, updates kapitalkonto
- **Registrera insättning** — record a capital deposit
- **Registrera lön** — record salary payment to partner
- **Exportera** — generate PDF summary of partner transactions

## Legal Requirements

- **Handelsbolagslagen (1980:1102)** — komplementärer have unlimited personal liability for company debts
- **Kommanditdelägare** — liability limited to their capital contribution
- **Kapitalkonto** — must be tracked per partner, reflects their economic stake
- **Egenavgifter** — partners in HB/KB pay their own social contributions (not the company)

## What Connects Here

- **Bokföring/Verifikationer** — each transaction creates a verification entry
- **Egenavgifter** — partner withdrawals feed into egenavgifter calculations
- **Rapporter** — kapitalkonto balances appear on balansräkning
- **Scooby** — "Fråga Scooby om {name}" button prefills chat with partner context
