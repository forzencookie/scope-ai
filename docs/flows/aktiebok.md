# Flow: Aktiebok (Share Register)

> Read-only page displaying shareholders, ownership structure, and corporate events. All mutations through Scooby.

## Purpose

The aktiebok is a legally required register (ABL 5 kap.) that documents who owns shares in the company, how many, and what class. It also tracks corporate events like share transfers, new issuances, and formation.

## Page Structure

### 1. Stat Cards (top row)

Three gradient stat cards:

| Card | Icon | Color | Value |
|------|------|-------|-------|
| Aktiekapital | Landmark | Blue | Sum of share capital in SEK |
| Antal aktier | BarChart3 | Emerald | Total shares across all classes |
| Aktieägare | Users | Violet | Count of shareholders |

Style: gradient background (`from-{color}-50/60 to-zinc-50`), icon in colored rounded container.

### 2. Shareholders Table

Flex-based table (not HTML `<table>` — enables proper rounded corners and hover backgrounds).

**Columns:**
- **Namn** (flex-1) — shareholder name + personnummer/orgnummer below in monospace. Role badges appear inline next to the name.
- **Aktier** (w-20, right-aligned) — share count, tabular-nums
- **Klass** (w-16, right-aligned) — A/B badge with distinct colors (A = blue, B = amber)
- **Andel** (w-20, right-aligned) — ownership percentage
- **Röster** (w-20, right-aligned, hidden on mobile) — voting power percentage

**Footer row:** Totalt with summed shares, 100% andel, 100% röster.

**Search:** Filter by name or personnummer via search input top-right.

### 3. Role Badges

Shareholders can hold corporate roles. Badges render inline next to the name — no dedicated column. A shareholder with no roles gets no badge.

| Role | Color | Description |
|------|-------|-------------|
| VD | Blue | CEO / Managing Director |
| Firmatecknare | Emerald | Authorized signatory |
| Styrelseordförande | Violet | Board chairman |
| Styrelseledamot | Amber | Board member |
| Suppleant | Zinc | Deputy board member |
| Revisor | Rose | Auditor (usually external) |

Style: `text-[9px] font-semibold uppercase tracking-wider rounded-full` with color-specific bg/text.

A person can hold multiple roles (e.g. VD + Firmatecknare).

### 4. Event History (Händelsehistorik)

Vertical timeline showing corporate events in reverse chronological order.

**Layout:** Flex column with dot + vertical line connector.
- Dot: `h-2.5 w-2.5 rounded-full bg-foreground/70` — uniform for all events
- Line: `w-px bg-border/40` connecting dots vertically
- Each event: date (tabular-nums, muted), FileText icon + event title (semibold), detail text below

**Event types:**
- Bolagsbildning — company formation
- Nyemission — new share issuance
- Aktieöverlåtelse — share transfer
- Split/Omvänd split — share split
- Utdelning — dividend decision (links to utdelning page)
- Nedsättning/Ökning av aktiekapital — capital changes

## Data Source

### Database Tables

```
shareholders
  - id, company_id
  - name, personal_number (or org_number for corporate shareholders)
  - share_class (A, B, etc.)
  - shares (count)
  - acquisition_date
  - created_at, updated_at

shareholder_roles
  - id, shareholder_id
  - role (VD | Firmatecknare | Styrelseordförande | Styrelseledamot | Suppleant | Revisor)
  - appointed_date, removed_date (null if active)

share_events
  - id, company_id
  - event_type
  - event_date
  - description
  - metadata (JSON — shares involved, price per share, parties, etc.)
  - created_at
```

### Derived Values

- **Total shares:** `SUM(shareholders.shares)` for the company
- **Ownership %:** `shareholder.shares / total_shares * 100`
- **Votes %:** Depends on share class voting rights (A-shares typically 10x B-shares)
- **Share capital:** From company settings or `total_shares * quota_value`

## Mutations (via Scooby)

Users cannot edit the aktiebok directly. All changes go through chat:

- **Registrera aktieägare** — add a new shareholder
- **Överlåt aktier** — transfer shares between parties
- **Nyemission** — issue new shares (changes total shares + capital)
- **Ändra roller** — assign/remove corporate roles
- **Registrera split** — split or reverse-split shares

Each mutation creates a corresponding entry in `share_events`.

## Legal Requirements

- **ABL 5 kap. 7 §:** Aktiebok must contain shareholder name, personnummer, address, share count, share class, and share numbers (aktienummer range).
- **Sequential share numbering:** Each share has a unique number. Ranges stored per shareholder (e.g. shares 1–600).
- **Public document:** The aktiebok is not secret — any shareholder can request to see it.
- **Bolagsverket alignment:** Board members and signatories registered with Bolagsverket should match what the aktiebok shows.

## Row Click Behavior

Clicking a shareholder row opens a **page overlay** with full detail:
- All fields from the table
- Share number range (aktienummer)
- Acquisition history (when/how they got their shares)
- Role history
- "Fråga Scooby" button with shareholder context prefilled

## What Connects Here

- **Utdelning page** — dividend decisions reference shareholders and ownership %
- **K10 tool** — needs ownership data for 3:12 calculations
- **Bolagsstämmoprotokoll** — meeting minutes reference shareholders and votes
- **Firmatecknare** — role data displayed here, registered via Bolagsverket
