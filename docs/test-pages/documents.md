# Dokumentförhandsvisningar

Test page: `/test-ui/walkthroughs/documents/`

## What it shows

Formal documents that Scooby generates — lönebesked, styrelseprotokoll, aktiebok. White background, print/PDF-ready. These are for external parties (employees, Bolagsverket, auditors), not internal display.

## UI Components

### Lönebesked (PayslipPreview)
- Swedish payslip following Fortnox/Visma standard
- Columns: Löneart, Antal (for hourly items only), Belopp
- Sections: arbetsgivare info, anställd info, lönearter, brutto → skatt → netto, semester (betald kvar, sparade, intjänade), ackumulerat YTD (brutto, skatt, netto), arbetsgivaravgift (small info note)
- Full personnummer shown (secure delivery assumed)
- Theme-independent: all colors hardcoded neutral (not muted-foreground)

### Styrelseprotokoll (BoardMinutesPreview)
- Formal board meeting minutes
- Sections: company info, meeting info, attendees (present/absent), agenda, decisions (numbered paragraphs with type: info/election/decision), next meeting, signatures (role + name)
- No separator lines between sections — clean flowing layout

### Aktiebok (ShareRegisterPreview)
- Share register extract per ABL
- Two separate summary boxes: total shares + total capital
- Table: shareholder name, person/org number, share count, share class, voting rights, acquisition date
- Table styling: border-b headers, dashed row borders, font-medium names

## Required data — what the app MUST have

Documents are the strictest — every field is legally required. If ANY required data is missing, Scooby must ask before generating the document. A document with placeholder values is useless.

### Lönebesked

**Company (all required):**
- Name, org nr, address → appears in header
- F-skatt status → legally required on employment documents

**Employee (all required):**
- Name, personnummer → identifies the employee
- Anställningsnummer → internal reference
- Birth date → determines arbetsgivaravgift nedsättning
- Kommun → determines kommunalskatt rate
- Skattetabell → A-skatt kolumn from Skatteverket (resolved from kommun + income level)

**Payroll data (all required):**
- Completed lönekörning for the period → source of all line items
- Lönearter with amounts → from `payroll_line_items`
- Tax rate → from `getKommunSkattesats()` in `src/data/kommun-skattesatser.ts` (NOT hardcoded 32.4%)
- Net salary → computed: gross − deductions − tax
- Vacation balance → from `employees.vacation_balance`
- YTD figures → aggregated from all payroll runs in calendar year
- Employer contributions → computed with age-based nedsättning applied

**How kommun → tax rate works:**
1. Employee record has `kommun` field (e.g. "Stockholm", "Göteborg")
2. App calls `getKommunSkattesats(kommun)` from `src/data/kommun-skattesatser.ts` — looks up rate in `src/data/kommun-skattesatser-2026.json` (290 kommuner, from Skatteverket's yearly xlsx)
3. Tax rate applied: e.g. Stockholm = 30.62%, Dorotea = 35.94%
4. If kommun is missing → Scooby asks: "Vilken kommun är Anna folkbokförd i?"
5. User answers → stored on employee → accurate tax from now on

**How birth date → avgift nedsättning works:**
1. Employee record has birth date (from personnummer)
2. At lönekörning: calculate age at period start
3. Under 23 → reduced arbetsgivaravgift (10.21% instead of 31.42%)
4. Over 65 → reduced arbetsgivaravgift (10.21%)
5. Normal age → standard 31.42%
6. Birth date is ALWAYS available if personnummer is stored (first 6 digits = YYMMDD)

### Styrelseprotokoll

**Company (required):**
- Name, org nr → header

**Meeting data (all from user/AI):**
- Meeting type, number, date, time, location
- Board members + roles (from `board_members` or owner data)
- Attendance → user confirms who was present
- Agenda → user provides or Scooby drafts
- Decisions → user provides content, Scooby formats as numbered paragraphs
- Next meeting date → user provides
- Signatories → from board member roles (ordförande, sekreterare, justerare)

### Aktiebok

**Company (required):**
- Name, org nr → header
- Total share capital → from `companies.share_capital` or bolagsordning

**Shareholder data (all required):**
- Name, person/org number → from `shareholders` table
- Share count, share class → from `share_register`
- Voting rights → from share class rules (A-aktier vs B-aktier)
- Acquisition date → from share transactions
- Share numbers (aktienummer) → ABL requires numbered shares (e.g. 1-600, 601-850)

## Data connections — what's dynamic

### Lönebesked
| Data | Source | Static in test? |
|------|--------|----------------|
| Company name, org number, address | `companies` table | Yes |
| Employee name, personnummer, anställningsnummer | `employees` table | Yes |
| Löneperiod | Payroll run period | Yes |
| Lönearter | `payroll_line_items` | Yes |
| Tax rate + amount | `getKommunSkattesats()` from `src/data/kommun-skattesatser.ts` (per employee kommun) | Yes |
| Net salary | Computed: gross − deductions − tax | Yes |
| Vacation info | `employees.vacation_balance` | Yes |
| YTD figures | Aggregated from all payroll runs in year | Yes |
| Employer contributions | Computed: base × rate (age-adjusted) | Yes |

### Styrelseprotokoll
| Data | Source | Static in test? |
|------|--------|----------------|
| Company info | `companies` table | Yes |
| Meeting details | `board_meetings` table or user input | Yes |
| Attendees + roles | `board_members` + attendance | Yes |
| Agenda items | User-provided or AI-drafted | Yes |
| Decisions | User-provided, AI-formatted | Yes |
| Signatures | Board member roles | Yes |

### Aktiebok
| Data | Source | Static in test? |
|------|--------|----------------|
| Company info | `companies` table | Yes |
| Shareholders | `shareholders` table | Yes |
| Share details | `share_register` table | Yes |
| Total shares + capital | Computed from share register | Yes |
| Aktienummer ranges | `share_register.share_numbers` | Yes |

## What must NEVER be static in production

- **All financial amounts** — from actual data
- **Employee/shareholder data** — from DB
- **Tax rates** — from municipality tax tables, NEVER hardcoded
- **Avgiftssatser** — age-adjusted, from yearly data source
- **Personnummer** — from employee records
- **Meeting minutes content** — from actual board meetings
- **Share numbers** — from share register (ABL compliance)

## What CAN be static

- Document structure/layout
- Column headers
- Legal compliance format (what a lönebesked must contain per Swedish law)
- Section labels
