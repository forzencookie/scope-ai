# Document Test Page — Findings & TODO

Status: Working document. Updated 2026-04-04.

## Current State

The documents test page (`/test-ui/walkthroughs/documents/`) shows **printable/PDF documents** only:
- Lönebesked (PayslipPreview)
- Styrelseprotokoll (BoardMinutesPreview)
- Aktiebok (ShareRegisterPreview)
- Balanskontroll + Resultatkontroll (audit check rows, inline)

**Removed from documents page** (now walkthroughs):
- Årsredovisning — is a Bolagsverket submission process, not a printable document. Needs its own walkthrough.
- VATFormPreview — replaced by momsdeklaration walkthrough
- AGIFormPreview — replaced by AGI walkthrough
- K10FormPreview — replaced by K10 walkthrough
- TaxDeclarationPreview — replaced by INK2 walkthrough

## Årsredovisning — Walkthrough Built

Årsredovisning was removed from the documents page because it's a process, not a static document. Walkthrough built at `/test-ui/walkthroughs/arsredovisning/` with provenance:

- Förvaltningsberättelse: key events traced to styrelseprotokoll + lönekörningar
- Resultaträkning: sourced from konto 3000–8999
- Balansräkning: sourced from konto 1000–2999
- Noter: each note traces to specific accounts (avskrivningsplan, konto 2350, löneregister)
- Flerårsöversikt: current vs previous year with nyckeltal (soliditet, kassalikviditet)
- Resultatdisposition: sourced from konto 2098 + årets resultat
- Underskrifter: checklist from aktiebok/styrelseregister, shows who has/hasn't signed
- Submission: XBRL/PDF export, Bolagsverket action (blocked until all signatures)

## Anställningsnummer — Missing Across System

Swedish payslips require anställningsnummer. Currently the system uses UUID as employee ID — no human-readable sequential number (e.g. 1001, 1002) exists.

### Who needs an anställningsnummer?

- All employees
- **Owners (AB) who take salary** — a VD/ägare in an aktiebolag who pays themselves is also an anställd. They need a linked employee record with anställningsnummer.
- NOT enskild firma (egenavgifter, no anställning)
- NOT passive shareholders who don't take salary

### What needs to change

**Database & types:**
1. `supabase/migrations/` — add `employee_number TEXT` to `employees` table
2. `src/types/database.ts` — add to Employee type
3. `src/services/payroll/payroll-service.ts` — Employee type + auto-generate on creation

**AI tools:**
4. `src/lib/ai-tools/loner/register-employee.ts` — auto-assign next sequential number (not user-provided)

**API:**
5. `src/app/api/employees/route.ts` — POST generates next number, GET returns it

**UI components:**
6. `src/components/loner/team/employee-card.tsx` — show anställningsnummer
7. `src/components/loner/team/employee-dossier-overlay.tsx` — show in detail view
8. `src/components/ai/previews/documents/payslip-preview.tsx` — already has `employeeId` prop, maps to this
9. `src/components/ai/previews/employee-preview.tsx` — show it
10. `src/components/ai/cards/PayslipCard.tsx` — if it shows employee info

**Owner-Employee bridge:**
11. `src/services/corporate/shareholder-service.ts` — when shareholder takes salary, link to employee record
12. `src/components/pages/ownership-page.tsx` — aktiebok should show if owner is also anställd
13. Shareholders table doesn't need anställningsnummer — the linked employee record does

**Documents & declarations:**
14. AGI walkthrough/tool — uses anställningsnummer per individuppgift
15. K10 walkthrough — references owner's employee data for salary-based gränsbelopp
16. Payslip (lönebesked) — shows as "Anst.nr"

## Lönebesked — Research Findings (2026-04-04)

Based on research of Swedish payslip standards (Fortnox, Visma, Företagarna, Skatteverket):

**What IS on a Swedish lönebesked:**
- Arbetsgivare: namn, org.nr, adress
- Anställd: namn, personnummer (full, not masked), anställningsnummer
- Löneperiod + utbetalningsdag
- Lönearter: Löneart, Antal (only for hourly/unit items), Belopp
- Bruttolön → skatteavdrag (tabellskatt) → nettolön
- Semester: betalda kvar, sparade, intjänade
- Ackumulerat (YTD): brutto, skatt, netto
- Arbetsgivaravgift (informational, small text)

**What is NOT on a Swedish lönebesked:**
- À-pris / unit price column — not standard
- Befattning (job title) — belongs on employment contract
- Arbetsgivaravgift as a prominent section — it's employer-side info, shown as small note only

**Personnummer:** Full number shown on real payslips (secure delivery via BankID/portal). Masking only for demos/screenshots.

Sources:
- Företagarna: https://www.foretagarna.se/juridisk-faq/anstallning/vad-ska-en-lonespecifikation-innehalla-for-uppgifter/
- Fortnox lönebesked: https://support.fortnox.se/produkthjalp/lon/lonebesked-detaljvy
- Personalekonomi.se: https://www.personalekonomi.se/artikel/lonespecifikation.aspx
- The Local: https://www.thelocal.se/20200127/how-to-understand-your-swedish-payslip/
