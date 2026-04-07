# Bekräftelse & Interaktion

Test page: `/test-ui/walkthroughs/confirmation/`

## What it shows

The flat, borderless confirmation UI that appears whenever Scooby prepares a mutation. Every write operation goes through this flow.

## UI Components

### ConfirmationCard
- Title + description as inline header (no card wrapper, no dashed borders)
- Summary rows: key-value pairs showing the data that will be written
- Optional warnings (amber) — ONLY when required data is missing from the app
- Contextual action buttons: domain-specific label (Bokför / Registrera / Kör / Makulera) + Avbryt
- No "Kommentera" button — user types feedback in the chat input directly
- States: idle → loading → confirmed / cancelled (muted)
- **Confirmed state keeps the card visible** — summary rows stay, buttons replaced with green check + "Klart". The card content serves as the receipt of what was done. Never collapse to just a "Klart" line — the context matters.
- Accent colors on icon/icon-bg only, buttons stay default primary

Test examples:
1. **Bokför kvitto** (blue) — standard single booking, no warnings → button: "Bokför"
2. **Skapa faktura** (teal) — with customer + due date → button: "Skapa faktura"
3. **Kör lönekörning** (emerald) — payroll run → button: "Kör lönekörning"
4. **Arbetsgivaravgifter** (emerald) — payroll contribution booking → button: "Bokför"
5. **Tilldela förmån** (emerald) — employee benefit → button: "Tilldela"
6. **Egenavgifter** (amber) — sole trader, annual → button: "Bokför"
7. **Registrera inventarie** (indigo) — new asset → button: "Registrera"
8. **Avskrivning** (indigo) — periodic depreciation → button: "Bokför avskrivning"
9. **Stäng period** (amber) — month close with warning → button: "Stäng mars"
10. **Uppdatera företagsinfo** (blue) — simple update → button: "Uppdatera"
11. **Makulera verifikation** (amber) — nullification with reversal entry → button: "Makulera"

### DomainCard (domain-specific confirmations)
Same structure as ConfirmationCard but with icon rows instead of key-value summary.

Test examples:
1. **Anställd** (green) — name, role, salary, email, kommun with icon rows
2. **Ägare / Aktieägare** (purple) — AB shareholder with aktier, röster
3. **Delägare HB/KB** (purple) — vinstandel, kapitalinsats
4. **Medlem** (green) — förening, årsavgift
5. **Kund** (teal) — fakturering, org nr
6. **Utdelningsbeslut** (amber) — equity check, försiktighetsregeln
7. **Aktieöverlåtelse** (purple) — from/to, aktienummer range
8. **Ägaruttag EF** (amber) — eget uttag, debet/kredit konton
9. **Tilldela roll** (indigo) — styrelsepost, bolagsverket
10. **Planera möte** (indigo) — styrelsemöte, dagordning

### Batch confirmations
Two styles depending on complexity:

1. **Batchbokföring** — compact list of items with same fields as single "Bokför kvitto" (vendor, amount, account, moms, date). One row per item, total at bottom. Button: "Bokför alla (N)". No debit/credit — Scooby handles the accounting internally.

2. **Statusändring (BatchConfirmationCard)** — checklist with status badges for simple state changes. Each item has label, description, and target state badge. Button: "Uppdatera valda".

## Production logic

### Makulering (not deletion)
When a user asks Scooby to "delete" a verification:
- Scooby does NOT delete the row from the database
- Instead, creates a **reversal verification** (rättelsepost) — a new entry that zeroes out the original (debit becomes credit, credit becomes debit)
- Original stays in the ledger, reversal cancels it out
- Audit trail preserved — no gaps in verifikationskedjan
- Only allowed in **open periods** — if period is closed, Scooby refuses and explains why
- UI label: "Makulera" (not "Radera"), amber accent (correction, not destruction)

### Month close (Månadsavslut)
**The flow:**
1. Sidebar tasks (Aktiviteter) proactively surface outstanding period closes — "Månadsavslut mars 2026" appears when a new month begins
2. User engages — clicks the task or asks Scooby "vad behöver jag göra?" / "stäng mars"
3. Scooby is **reactive**, not autonomous — it checks what needs doing only when asked
4. Scooby runs the checklist (ActivityFeedCard in status mode): kvitton bokförda, momsavstämning, periodiseringar, etc.
5. If issues found → Scooby shows blocking items and helps fix them first
6. If everything passes → Scooby sends "Stäng period" confirmation card
7. User confirms → period locks → no more edits allowed in that period

**Rules after period close:**
- No new verifications can be created in a closed period
- No makulering of verifications in a closed period
- Reopening requires revisorsgodkännande (auditor approval)

### Batch booking
**When it spawns:**
- User uploads multiple receipts at once
- User asks "bokför alla obokförda" and there are several
- Scooby lists what it found, user confirms the batch

**The flow:**
1. Scooby identifies items to book (from uploads or DB query)
2. Shows batch confirmation with compact list — same info as single booking per item
3. User reviews, clicks "Bokför alla (N)"
4. Scooby books each one, assigns sequential verifikationsnummer
5. Result: individual ActivityCards or a summary message

## Required data — what the app MUST have

Confirmations should NEVER show warnings for missing data that the app could already have. If data is missing, Scooby asks FIRST — before showing the confirmation. Warnings are reserved for genuinely ambiguous situations.

### Per confirmation type:

**Bokför kvitto / verifikation**
- Company: org nr, räkenskapsår (determines fiscal period)
- BAS kontoplan loaded (determines valid account numbers)
- Momsregistrering status (determines VAT handling)

**Skapa faktura**
- Company: name, org nr, address, bank details (appears on invoice)
- F-skatt status (required on Swedish invoices)
- Momsregistrering (determines VAT line)
- Customer: name, org nr, address (from `customers` table or user input)

**Kör lönekörning**
- Employee: name, personnummer, anställningsdatum
- Employee: birth date → determines arbetsgivaravgift nedsättning (under 23 = reduced rate, over 65 = reduced rate)
- Employee: kommun → determines kommunalskatt rate (varies ~29-35%), looked up from `src/data/kommun-skattesatser-2026.json` via `getKommunSkattesats()`
- Employee: skattetabell (A-skatt kolumn) → from Skatteverket yearly tables
- Employee: salary, employment type (hourly/monthly)
- Company: momsregistrering, F-skatt

**Makulera verifikation**
- Verifikation must exist in DB
- Period must be open (not closed)
- No data dependency beyond that — warning about rättelsepost always shown

**Uppdatera företagsinfo**
- Current company data (to show what changes)

**Arbetsgivaravgifter**
- All employee birth dates → age-based nedsättning per employee
- Completed lönekörning for the period → actual salary base
- Current year's avgiftssatser (from data source, not hardcoded)

### What Scooby does when data is missing:

1. Tool checks required data exists before preparing confirmation
2. If missing: Scooby asks user conversationally ("Vilken kommun bor Anna i?")
3. User answers → Scooby stores via appropriate tool (update_employee, etc.)
4. THEN Scooby shows confirmation with accurate, deterministic values
5. Result: zero warnings for fixable data gaps

### When warnings ARE appropriate:
- Genuinely ambiguous situations ("This receipt could be 6110 or 6210 — which fits?")
- Legal caution (rättelsepost warning on makulering)
- Unusual values that might indicate errors ("Lönen är 420 000 kr/mån — stämmer det?")
- External data that can't be verified ("Skatteverket's API is unavailable, using cached rates")

## Confirmation flow (production)

1. User asks Scooby to do something (e.g. "Bokför det här kvittot")
2. Scooby's tool checks all required data is present
3. If data missing → Scooby asks, stores answer, then proceeds
4. Tool prepares confirmation with accurate values
5. ConfirmationCard rendered inline with contextual button
6. User clicks domain-specific button (Bokför / Registrera / Kör)
7. Tool executes → card stays visible with buttons replaced by check + "Klart"
8. Scooby may also show an ActivityCard with the result details
9. On Avbryt → action cancelled, Scooby asks what to change

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Confirmation title + description | AI tool selection + context | Yes |
| Summary rows | Tool params (computed from real data) | Yes |
| Warnings | Only for genuinely ambiguous situations | Yes |
| Confirm button label | Domain-specific (Bokför/Registrera/Kör) | Yes |
| Batch items | From uploads or DB query | Yes |

## What must NEVER be static in production

- **Summary data** — reflects actual values computed from DB
- **Tax rates** — from municipality tax tables, resolved per employee
- **Avgiftssatser** — from yearly data source, with age-based nedsättning applied
- **Warnings** — contextual and only shown when genuinely needed
- **Period open/closed status** — from DB, determines if makulering is allowed
- **Batch items** — from actual unbooked items or uploaded receipts

## What CAN be static

- UI chrome (button labels per domain, state transitions)
- Warning styling (amber for caution)
- BFL compliance warning text (rättelsepost on makulering)
