# Årsredovisning

Test page: `/test-ui/walkthroughs/arsredovisning/`

## What it shows

Scooby presents a complete K2 annual report (årsredovisning) following BFNAR 2016:10. Every section traces to source data — resultaträkning from konto 3000–8999, balansräkning from konto 1000–2999, noter from specific accounts, signatures from aktiebok/styrelseregister.

This is a process (Bolagsverket submission), not a printable document — that's why it's a walkthrough, not a document preview.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (omsättning, årets resultat, soliditet)
- **WalkthroughRenderer** (block-based) with:
  - Förvaltningsberättelse: heading, key-value (verksamhet, säte, antal anställda), annotation (source: styrelseprotokoll + lönekörningar), key-value (väsentliga händelser)
  - Resultaträkning: annotation (source: konto 3000–8999), financial-table (nettoomsättning, kostnader, rörelseresultat, finansiella poster, skatt, årets resultat)
  - Balansräkning: annotation (source: konto 1000–2999), financial-table (tillgångar), financial-table (eget kapital + skulder)
  - Noter (4): avskrivningar (annotation: avskrivningsplan), obeskattade reserver (annotation: konto 2150), anställda & löner (annotation: löneregister), upplupna kostnader (annotation: konto 2990)
  - Flerårsöversikt: financial-table (current vs previous year + nyckeltal)
  - Resultatdisposition: annotation (source: konto 2098), key-value (balanserat + årets resultat)
  - Underskrifter: status-check (per styrelseledamot, signed/pending)
  - Inlämning: info-card (XBRL/PDF export, Bolagsverket), action-bar

## Expected behavior

When user asks "Gör årsredovisningen" or "Förbered inlämning till Bolagsverket":

1. Scooby fetches full year bookkeeping data
2. Tool assembles resultaträkning from konto 3000–8999
3. Tool assembles balansräkning from konto 1000–2999
4. Tool reads styrelseprotokoll for väsentliga händelser
5. Tool reads aktiebok for styrelseledamöter (signatories)
6. Tool reads löneregister for anställda-note
7. Tool computes nyckeltal (soliditet, kassalikviditet)
8. Returns WalkthroughResponse with full report

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Company name, org number, säte | `companies` table | Yes |
| Verksamhetsbeskrivning | `companies.description` or AI-generated | Yes |
| Antal anställda | `employees` count | Yes |
| Väsentliga händelser | `board_minutes` decisions | Yes |
| Resultaträkning rows | `verifications` aggregated by konto 3000–8999 | Yes |
| Balansräkning rows | `verifications` aggregated by konto 1000–2999 | Yes |
| Previous year figures | Prior year `verifications` or stored closing balances | Yes |
| Avskrivningsplan | `assets` table + depreciation schedule | Yes |
| Obeskattade reserver | `verifications` on konto 2150 | Yes |
| Löneuppgifter (not, anställda) | `payroll_runs` aggregated | Yes |
| Upplupna kostnader | `verifications` on konto 2990 | Yes |
| Styrelseledamöter + signatures | `shareholders` + `board_members` tables | Yes |
| Nyckeltal (soliditet, kassalikviditet) | Computed from balansräkning | Yes |
| Resultatdisposition | `verifications` on konto 2098 + årets resultat | Yes |

## What must NEVER be static in production

- **All financial figures** — from actual bookkeeping
- **Styrelseledamöter** — from aktiebok/board register
- **Väsentliga händelser** — from board minutes
- **Previous year data** — from prior closing
- **Nyckeltal** — computed from current balansräkning
- **Signature status** — tracked per board member

## What CAN be static

- K2 structure (section order, headings)
- Legal references ("BFNAR 2016:10", "ÅRL 5 kap")
- Note headings ("Avskrivningar av materiella anläggningstillgångar")
- Submission info (Bolagsverket, XBRL format)
- Resultatdisposition text template
