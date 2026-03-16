# Workflow: Information Pages

> Read-only data displays. Users review data here. All mutations happen through chat.

## What They Are

Pages are reference views — tables of data that the user can browse, filter, search, and inspect. They do NOT have create/edit/delete dialogs. If a user wants to change something, they ask Scooby.

## The Pages

### Bokföring
- **Transaktioner** — bank transaction inbox. Table of all transactions with status badges (bokförd/ej bokförd). Filter by status.
- **Fakturor** — invoice lifecycle. Kanban or table view showing customer and supplier invoices by state.
- **Kvitton** — uploaded receipts. Table of receipts with OCR status and matching state.
- **Inventarier** — fixed assets. Table with depreciation status.
- **Verifikationer** — the ledger. Flat table with Nr, Datum, Konto, Beskrivning, Belopp. Search and filter. This is where all bookings end up.

### Löner
- **Lönekörning** — payroll runs. Table of completed and pending payroll entries.
- **Förmåner** — employee benefits. Table of active benefits.
- **Team** — employee cards or list. Personnel dossier per person.
- **Delägaruttag** — owner withdrawals. Table with documentation status.
- **Egenavgifter** — self-employment contributions.

### Rapporter
- **Resultaträkning** — income statement. Deterministic math from account balances. Rendered as walkthrough overlay when requested via chat, or viewable as a page.
- **Balansräkning** — balance sheet. Same pattern.
- **Momsdeklaration** — VAT declaration. Manual or AI-assisted.
- **Inkomstdeklaration** — income tax. Same pattern.
- **K10** — shareholder tax form.
- **Årsredovisning & Bokslut** — annual report.

### Ägare & Styrning
- **Aktiebok** — share register documentation.
- **Möten & Protokoll** — meeting minutes, legal paper trail.
- **Firmatecknare** — authorized signatories.
- **Utdelning** — dividend decisions and receipts.
- **Delägare & Medlemmar** — owner cards with ownership details.

### Händelser
- **Månadsavslut** — 12-month grid, expand a month to see events/timeline.
- **Kalender** — click a day to see what happened.

### Inställningar
- Opens as an **overlay** on the main content area (not a dialog). Contains: Företag, Profil, Språk, Billing.

## Table Row Interaction

Every table row is clickable. On click → **page overlay** opens in the main content area:
- Overlay takes over the main content area (sidebar stays visible)
- Shows full detail view of that item (transaction, invoice, verification, etc.)
- Read-only — no edit forms
- "Tillbaka" button to return to the table
- "Fråga Scooby" button to jump to chat with context about this item

This replaces all dialogs. No more large modal popups.

## Mutation Dialogs Removed

All 18 mutation dialogs have been deleted from the codebase. Pages are now fully read-only as intended by the architecture. Actions that were previously handled by dialogs (creating bookings, adding employees, registering dividends, etc.) now go through Scooby via chat. See `docs/flows/tools.md` § "AI Tools Needed (Dialog Replacements)" for the list of AI tools that still need to be built to cover these actions.

**Remaining work:** Add "Fraga Scooby" buttons on pages where users are likely to want to act on data they are viewing. Priority locations:
- **Transaktioner** — next to unbooked transactions (status: ej bokford)
- **Fakturor** — next to overdue invoices
- **Verifikationer** — on individual verification detail overlays
- **Team** — on employee cards (to trigger payroll, update details)
- **Aktiebok / Delagare** — on partner/member detail overlays

These buttons should prefill the chat with context about the item the user is looking at.

## What Connects Here

- Pages display data that Scooby creates/modifies through chat
- Table rows open page overlays for detail inspection
- "Fråga Scooby" hands off to the AI interface with prefilled context
- Reports (resultat/balans) are deterministic math — no AI reasoning needed, just computation and rendering
