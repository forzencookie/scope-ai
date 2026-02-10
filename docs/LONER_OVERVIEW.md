# Löner — Payroll & Personnel Economics

> The payroll hub that turns salary runs into ledger entries, tax declarations, and owner capital tracking — automatically.

## What Löner Does

Löner handles everything related to paying people and accounting for the cost of labor. For a Swedish small business, this means not just printing a payslip — it means computing employer contributions (arbetsgivaravgifter), withholding the right tax, accruing vacation pay, booking pension costs, and feeding all of that into the ledger so that the Resultaträkning, Balansräkning, and Arbetsgivardeklaration are always up to date.

The category has five sub-pages, each solving a distinct problem:

### 1. Lönekörning (Payroll Run)

The core workflow. A 3-step wizard:

1. **Select employee** — pick from existing team or enter a new person with full details (personnummer, anställningsform, skattesats, pensionsavtal, fackavgift, A-kassa)
2. **AI adjustments** — describe the month in natural language ("Anna var sjuk 2 dagar, Erik hade 5h övertid") and the system computes karensavdrag, overtime pay, and bonuses using the employee's actual salary data
3. **Review & confirm** — a complete lönespecifikation showing:
   - Bruttolön
   - Preliminärskatt (employee's actual rate, not a flat default)
   - Fackavgift / A-kassa (when applicable)
   - Nettolön
   - Semesterersättning (12% per Semesterlagen)
   - Arbetsgivaravgift (31.42%, or 10.21% for employees 66+)
   - Tjänstepension (configurable, default ITP1 4.5%)
   - Total employer cost

**On confirm**, the system does two things simultaneously:
- Saves the payslip to the database
- Creates a complete double-entry verification in Bokföring

This is the key design principle: **the accountant never has to manually book a salary verification**. Lönekörning does it automatically.

### 2. Team & Rapportering

The employee register. Each employee has a card showing their role, salary, expense balance, and mileage claims. Clicking a card opens a **dossier** with three tabs:

- **Lönehistorik** — every payslip ever created for this person
- **Utlägg** — expense claims and mileage reports, derived from the ledger (accounts 2820/7330)
- **Förmåner** — active benefits assigned to this employee

The Team page also handles expense reporting (utlägg) and mileage claims (milersättning), both of which create verifications on submit — so the bookkeeping is always current.

### 3. Förmåner (Benefits)

A catalog of Swedish employee benefits (friskvård, lunch, tjänstebil, etc.) backed by Supabase with a static fallback of 25+ items. Benefits are categorized as:

- **Skattefria** (tax-free) — friskvårdsbidrag, personalrabatter, etc.
- **Skattepliktiga** (taxable) — company car, free meals, etc.
- **Bruttolöneavdrag** (salary sacrifice) — pension top-ups, etc.

Stats track total spend, employee coverage ratio, and **unused tax-free potential** (how much the company could save by utilizing benefits that haven't been assigned yet).

### 4. Delägaruttag (Owner Withdrawals)

For AB owners who take money out of the company — withdrawals, capital contributions, and owner salary. Each transaction:

- Records the amount with bank payment instructions
- **Automatically creates a verification** against the correct BAS accounts (2013/2023 for withdrawals, 2018/2028 for contributions)
- Shows in both this page AND in Ägare → Delägare as recent transactions

This page exists because owner transactions have specific legal implications (förbjudna lån, utdelningsbegränsningar) that regular salary doesn't.

### 5. Egenavgifter (Self-Employment Fees)

For enskild firma owners. A calculator that:

- Computes all 7 fee components at 2025 Skatteverket rates (28.97% full, 10.21% reduced)
- Applies schablonavdrag (25% standard deduction)
- Shows monthly trend and payment schedule
- **Books the fees to the ledger** with one click (6310 debit / 2510 credit)
- Displays government form references (SKV 4314, NE-bilaga)

---

## How Löner Helps Accountants

### The Problem It Solves

In traditional accounting, payroll is a manual chain: calculate gross → look up tax table → compute employer contributions → write the payslip → manually create 5+ ledger rows → remember to file AGI by the 12th → hope nothing was forgotten.

Every step is a chance for error, and errors in payroll have legal consequences.

### What Scope AI Does Differently

**One action, complete accounting.** When an accountant confirms a payslip, the system:

1. Saves the payslip record
2. Creates a verification with all correct BAS accounts:
   - `7010` Löner (debit — salary expense)
   - `7411` Tjänstepension (debit — pension expense)
   - `7510` Arbetsgivaravgift (debit — employer contribution expense)
   - `2710` Personalskatt (credit — tax liability to Skatteverket)
   - `2730` Arbetsgivaravgift skuld (credit — contribution liability)
   - `2810` Pensionsskuld (credit — pension liability)
   - `1930` Bankkonto (credit — net salary payout)
   - `2790` Övriga skulder (credit — union fees/A-kassa, when applicable)
3. Updates all dependent reports automatically

The accountant's job shifts from data entry to **review and confirm** — the system does the bookkeeping.

### Real-Life Scenarios

**Monthly payroll run for a 5-person AB:**
Select each employee → AI processes any adjustments (sick days, overtime) → review the spec → confirm. Five payslips, five verifications, all balanced. The AGI report is already populated.

**Senior employee turning 66:**
The system reads the personnummer, detects the employee is 66+, and automatically applies reduced employer contributions (10.21% instead of 31.42%). The lönespecifikation shows a note explaining the reduction. No manual override needed.

**Owner taking a withdrawal:**
Register the uttag with amount and purpose. The system shows bank transfer instructions and books it to 2013/1930. The transaction immediately appears in both Delägaruttag and Ägare → Delägare. When K10 is prepared, the withdrawal history is already there.

**Enskild firma owner booking monthly fees:**
Open Egenavgifter → see the breakdown → click "Bokför egenavgifter." One verification, correct accounts, done. The payment schedule reminds them to pay by the 12th.

---

## Symbiosis With Other Categories

Löner is not a standalone module. It is a **data producer** that feeds nearly every other part of the accounting system.

### Löner → Bokföring

Every payslip, expense report, owner withdrawal, and egenavgifter booking creates a verification in Bokföring → Verifikationer. These verifications use the standard BAS kontoplan and follow double-entry rules (debit = credit). The accountant can always drill into Verifikationer to see exactly what was booked and trace it back to the source payslip.

```
Lönekörning    → Verification (series L) → accounts 7010, 7510, 7411, 2710, 2730, 2810, 1930
Utlägg/Resor   → Verification           → accounts 4000/7330, 2820
Delägaruttag   → Verification           → accounts 2013/2023, 2018/2028, 1930
Egenavgifter   → Verification           → accounts 6310, 2510
```

### Löner → Rapporter

**Resultaträkning** pulls salary expenses from accounts 7010, 7510, 7411, and 6310. Without Löner creating verifications, these accounts would be empty and the income statement would overstate profit.

**Balansräkning** shows the liability side: unpaid tax (2710), employer contribution debt (2730), pension obligations (2810). These liabilities appear automatically after each payroll run.

**Arbetsgivardeklaration (AGI)** is the monthly employer declaration to Skatteverket. It summarizes gross salaries, tax withheld, and employer contributions — all data that comes directly from Lönekörning payslips. AGI lives under Rapporter but is entirely fed by Löner data. Deadline: 12th of each month.

**Inkomstdeklaration (INK2)** calculates taxable income. Payroll expenses (accounts 70xx, 75xx) are the largest deduction for most companies. Without accurate payroll booking, the tax return is wrong.

**K10 (Qualified Shares)** uses **lönebaserat utrymme** — the salary-based allocation room under Sweden's 3:12 rules. The formula is `50% of total salary sum × ownership share`. This means the salaries booked through Lönekörning directly determine how much the owner can take as low-taxed dividend. The K10 optimizer reads payroll data to recommend the optimal salary/dividend split.

### Löner → Ägare & Styrning

**Delägare** shows a per-partner view of capital movements. When Delägaruttag records a withdrawal, it appears both in Löner → Delägaruttag (for the accountant managing the transaction) and in Ägare → Delägare (for the governance view). Same data, different perspective.

**Utdelning** (dividends) needs to know the distributable equity from Balansräkningen — which includes payroll liabilities. It also needs the lönebaserat utrymme from K10, which depends on salary data. The chain: Löner → Bokföring → Balansräkning → Utdelning.

**Aktiebok** tracks ownership percentages, which K10 uses alongside salary data to compute the 3:12 allocation per shareholder.

### Löner → Händelser

Händelser (Events) tracks what happened and when. Payroll runs, AGI submissions, and egenavgifter bookings all appear in the activity timeline. Månadsavslut (month closing) can't be completed until payroll is finalized — so Löner feeds the month-close checklist.

### Summary: The Data Flow

```
                          ┌──────────────┐
                          │    Löner     │
                          │  (Payroll)   │
                          └──────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
              ▼                  ▼                   ▼
       ┌─────────────┐  ┌──────────────┐   ┌──────────────┐
       │  Bokföring   │  │    Ägare     │   │  Händelser   │
       │ (Verifikat)  │  │ (Delägare)   │   │ (Tidslinje)  │
       └──────┬───────┘  └──────────────┘   └──────────────┘
              │
    ┌─────────┼─────────┬──────────────┐
    │         │         │              │
    ▼         ▼         ▼              ▼
┌────────┐┌────────┐┌────────┐  ┌──────────┐
│Resultat││Balans- ││  AGI   │  │   K10    │
│räkning ││räkning ││        │  │(3:12)    │
└────────┘└────────┘└────────┘  └──────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Utdelning   │
                              │ (Dividends)  │
                              └──────────────┘
```

Every salary run ripples through the entire system. That's the point — Löner is not a payslip printer, it's the engine that keeps the financial picture accurate.

---

## BAS Accounts Used by Löner

| Account | Name | Category | Created By |
|---------|------|----------|------------|
| 1930 | Bankkonto | Tillgång | Lönekörning, Delägaruttag |
| 2013 | Privata uttag | Eget kapital | Delägaruttag |
| 2023 | Privata uttag delägare 2 | Eget kapital | Delägaruttag |
| 2018 | Egna insättningar | Eget kapital | Delägaruttag |
| 2028 | Egna insättningar delägare 2 | Eget kapital | Delägaruttag |
| 2510 | Skatteskuld | Skuld | Egenavgifter |
| 2710 | Personalskatt | Skuld | Lönekörning |
| 2730 | Arbetsgivaravgift skuld | Skuld | Lönekörning |
| 2790 | Övriga skulder | Skuld | Lönekörning (fack/A-kassa) |
| 2810 | Pensionsskuld | Skuld | Lönekörning |
| 2820 | Skuld till anställda (utlägg) | Skuld | Team utlägg |
| 4000 | Inköp | Kostnad | Team utlägg |
| 6310 | Egenavgifter | Kostnad | Egenavgifter |
| 7010 | Löner | Kostnad | Lönekörning |
| 7330 | Bilersättning | Kostnad | Team milersättning |
| 7411 | Tjänstepension | Kostnad | Lönekörning |
| 7510 | Arbetsgivaravgifter | Kostnad | Lönekörning |

---

## Legal Compliance Built Into Löner

| Requirement | Law/Source | Implementation |
|-------------|-----------|----------------|
| Semesterersättning 12% | Semesterlagen | Computed and shown on every lönespecifikation |
| Arbetsgivaravgift 31.42% | Skatteverket 2025 | Applied automatically, age-aware (10.21% for 66+) |
| Egenavgifter 28.97% | Skatteverket 2025 | 7-component breakdown with schablonavdrag |
| Reduced egenavgifter 10.21% | Skatteverket 2025 | Toggle for ålderspensionsavgift only |
| Karensdag (sick leave) | Sjuklönelagen | First day full deduction, day 2-14 at 80% sjuklön |
| Tjänstepension | ITP/kollektivavtal | Configurable rate, default 4.5% (ITP1) |
| AGI deadline 12th monthly | Skatteförfarandelagen | Shown in payment schedule |
| F-skatt payment 12th monthly | Skatteförfarandelagen | Shown in Egenavgifter info cards |
| Personnummer on lönespec | Bokföringslagen | Captured and displayed when available |
| Sequential verification numbering | BFL 5 kap 7§ | Enforced by verification engine |
