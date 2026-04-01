# Flow: Medlemsregister (Member Registry)

> Read-only page displaying association members, their roles, types, and fee status. All mutations through Scooby. Only available for föreningar (associations), not aktiebolag.

## Purpose

Swedish föreningar (ideella föreningar, ekonomiska föreningar, bostadsrättsföreningar) are required to maintain a member registry. This page gives a complete overview of all members, their membership type, fee payment status, and current standing.

## Page Structure

### 1. Stat Card (single, full-width)

One gradient stat card stretching full width:

| Card | Icon | Color | Value |
|------|------|-------|-------|
| Medlemmar | Users | Teal | Total member count |

Style: Same gradient pattern as other pages. Single card because the table already displays status, type, and fee information per row — additional stat cards would be redundant.

### 2. Avgiftsstatus Bar

A progress bar showing fee payment status across all members:

- Label: "Avgiftsstatus"
- Right text: "{paid}/{total} betalt ({percent}%)"
- Bar: gradient emerald-to-teal fill, rounded-full
- Contained in a subtle bordered card (`bg-muted/20 border border-border/30`)

### 3. Filters

Three filter groups in a single row:

- **Search** — text input filtering by name, email, or member number (M-001)
- **Status pills** — Alla, Aktiv, Vilande, Avslutad (colored badges when active)
- **Fee pills** — Avgift, Betald, Ej betald

### 4. Members Table

Grid-based table (`grid-cols-[1fr_auto_auto_auto]`).

**Header style:** `bg-muted/40 rounded-xl`, `text-[10px] font-bold uppercase tracking-wider` with `h-3.5 w-3.5` icons per column.

**Columns:**
- **Namn & Nr** (flex-1, User icon) — Avatar circle (initials, rotating colors), member name, member number + email in monospace below
- **Typ** (w-24, centered, Tag icon) — Colored badge: Ordinarie (blue), Stödmedlem (purple), Hedersmedlem (amber)
- **Avgift** (w-16, centered, CreditCard icon) — Green check circle if paid, muted X circle if unpaid
- **Status** (w-20, right-aligned, Activity icon) — Badge: Aktiv (emerald), Vilande (amber), Avslutad (muted)

**Avatar colors:** 8 rotating color combinations assigned by row index. Initials extracted from first + last name.

**Empty state:** "Inga medlemmar matchar filtret." centered text when filters return no results.

### 5. Footer

Subtle info bar: "{filtered} av {total} visas · Ändringar via Scooby"

## Data Source

### Database Tables

```
members
  - id, company_id
  - member_number (sequential, e.g. M-001)
  - name
  - email
  - member_type (ordinarie | stodmedlem | hedersmedlem)
  - status (aktiv | vilande | avslutad)
  - fee_paid (boolean, for current period)
  - joined_at
  - left_at (null if active)
  - created_at, updated_at

member_fees
  - id, member_id
  - period (year or date range)
  - amount
  - paid_at (null if unpaid)
  - due_date
```

### Derived Values

- **Total members:** `COUNT(members)` for the company
- **Aktiva:** `COUNT WHERE status = 'aktiv'`
- **Paid/unpaid:** `COUNT WHERE fee_paid = true/false`
- **Paid percent:** `paid / total * 100`

## Member Types

| Type | Swedish | Color | Description |
|------|---------|-------|-------------|
| Ordinarie | Ordinarie | Blue | Standard member with full voting rights |
| Stödmedlem | Stödmedlem | Purple | Supporting member, typically no voting rights |
| Hedersmedlem | Hedersmedlem | Amber | Honorary member, often fee-exempt |

## Mutations (via Scooby)

The page is read-only. All member actions go through chat:

- **Registrera medlem** — Scooby adds a new member, assigns next member number
- **Ändra medlemstyp** — Change between ordinarie/stödmedlem/hedersmedlem
- **Registrera avgift** — Mark a member's fee as paid for the current period
- **Sätt vilande** — Set a member to vilande status (retains membership but inactive)
- **Avsluta medlemskap** — End membership, sets left_at date
- **Skicka påminnelse** — Trigger fee payment reminder to unpaid members
- **Exportera register** — Generate CSV/Excel export of the full registry

## Legal Requirements

- **Föreningslagen** — Ekonomiska föreningar must maintain a member registry (Lag om ekonomiska föreningar 3 kap.)
- **Ideella föreningar** — No statutory requirement but strongly recommended for governance
- **Bostadsrättsföreningar** — Must maintain a member and lägenhetsförteckning (BRL 9 kap.)
- **GDPR** — Member data is personal data. Retention policy needed for avslutade members.

## Row Click Behavior

Clicking a member row opens a **page overlay** with full detail:
- All fields from the table
- Fee payment history (all periods)
- Membership timeline (joined, type changes, status changes)
- Role history (if member has held board positions — maps to möten & beslut)
- "Fråga Scooby" button with member context prefilled

## What Connects Here

- **Möten & Beslut** — föreningsstämma references members and voting rights
- **Bokföring** — member fee payments create bookkeeping entries (debit bank, credit intäkt)
- **Export** — Exportera button generates downloadable member list
- **Scooby** — primary way to manage members, send reminders, and handle fee tracking
